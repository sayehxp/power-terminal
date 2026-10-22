const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync, execFileSync } = require("child_process");
const { cmdWithArgs, shWithArgs, launcherScripts } = require("../src/utilites/launchers");

const isWindows = os.platform() === "win32";

const hasSh = (() => {
    try {
        execFileSync("sh", ["-c", "exit 0"], { stdio: "ignore" });
        return true;
    } catch (err) {
        return false;
    }
})();

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "pt-test-"));

// Requests are written as `<name>\n<args>\n`; the extension reads the first two lines.
const readRequest = (dir) => {
    const files = fs.readdirSync(dir).filter((name) => name.endsWith(".req"));
    assert.strictEqual(files.length, 1, `one request expected, found ${files.join(", ")}`);
    return fs.readFileSync(path.join(dir, files[0]), "utf8").split(/\r?\n/).slice(0, 2);
};

test("cmd: arguments are appended, or fill the placeholders", () => {
    assert.strictEqual(cmdWithArgs("npm run dev"), "npm run dev %*");
    assert.strictEqual(cmdWithArgs("git checkout -b $1 origin/$2"), "git checkout -b %1 origin/%2");
    assert.strictEqual(cmdWithArgs("echo $* and $@"), "echo %* and %*");
});

test("sh: arguments are appended, or fill the placeholders", () => {
    assert.strictEqual(shWithArgs("npm run dev"), `npm run dev "$@"`);
    assert.strictEqual(shWithArgs("git checkout -b $1 origin/$2"), "git checkout -b $1 origin/$2");
    assert.strictEqual(shWithArgs("echo $*"), `echo "$@"`);
});

test("a single command runs directly, several go through a request", () => {
    const single = launcherScripts({ name: "dev", commands: ["npm run dev"] }, "C:\\req");
    assert.strictEqual(single.cmd, "@echo off\r\nnpm run dev %*\r\n");
    assert.strictEqual(single.sh, `#!/bin/sh\nnpm run dev "$@"\n`);

    const several = launcherScripts({ name: "both", commands: ["npm run api", "npm run web"] }, "C:\\req");
    assert.match(several.cmd, /\.req/);
    assert.doesNotMatch(several.cmd, /npm run/);
    assert.match(several.sh, /dir='C:\/req'/);
    assert.ok(!several.sh.includes("\r"), "sh scripts need LF line endings");
});

test("cmd direct launcher runs the command with the typed arguments", { skip: !isWindows }, () => {
    const dir = tempDir();
    const file = path.join(dir, "pt.cmd");
    fs.writeFileSync(file, launcherScripts({ name: "pt", commands: ["echo hello"] }, dir).cmd);

    assert.strictEqual(execSync(`"${file}" a "b c"`, { encoding: "utf8" }).trim(), `hello a "b c"`);
    assert.strictEqual(execSync(`"${file}"`, { encoding: "utf8" }).trim(), "hello");
});

test("cmd: every part of a chain but the last is called", () => {
    const cmd = (command) => launcherScripts({ name: "x", commands: [command] }, "C:\\req").cmd.split("\r\n")[1];
    assert.strictEqual(cmd("npm i && npm start"), "call npm i && npm start %*");
    assert.strictEqual(cmd("a & b || c"), "call a & call b || c %*");
    assert.strictEqual(cmd(`echo "x && y"`), `echo "x && y" %*`);
    assert.strictEqual(cmd("echo a ^& b"), "echo a ^& b %*");
});

test("cmd direct launcher keeps % and ^ in typed arguments", { skip: !isWindows }, () => {
    const dir = tempDir();
    const file = path.join(dir, "pt.cmd");
    fs.writeFileSync(file, launcherScripts({ name: "pt", commands: ["echo"] }, dir).cmd);

    assert.strictEqual(execSync(`"${file}" "--format=%an" "a^b"`, { encoding: "utf8" }).trim(), `"--format=%an" "a^b"`);
});

test("cmd direct launcher returns from a .cmd in the middle of a chain", { skip: !isWindows }, () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "inner.cmd"), "@echo inner %1\r\n");
    const file = path.join(dir, "pt.cmd");
    fs.writeFileSync(file, launcherScripts({ name: "pt", commands: ["inner one && inner two"] }, dir).cmd);

    // through PATH, not the cwd: cmd skips the cwd when NoDefaultCurrentDirectoryInExePath is set
    const env = { ...process.env, PATH: `${dir};${process.env.PATH}` };
    const lines = execSync(`"${file}"`, { env, encoding: "utf8" }).trim().split(/\r?\n/);
    assert.deepStrictEqual(lines.map((line) => line.trim()), ["inner one", "inner two"]);
});

test("cmd request launcher writes the arguments as text", { skip: !isWindows }, () => {
    const dir = tempDir();
    const file = path.join(dir, "pt.cmd");
    fs.writeFileSync(file, launcherScripts({ name: "pt", commands: ["a", "b"] }, dir).cmd);

    // nothing in here may run: `&` would start `whoami`, `>` would create a file, `!` used to vanish
    execSync(`"${file}" "x & whoami" "1 > out.txt" wow!`, { cwd: dir });
    assert.deepStrictEqual(readRequest(dir), ["pt", `"x & whoami" "1 > out.txt" wow!`]);
    assert.ok(!fs.existsSync(path.join(dir, "out.txt")));
});

test("cmd request launcher handles no arguments", { skip: !isWindows }, () => {
    const dir = tempDir();
    const file = path.join(dir, "pt.cmd");
    fs.writeFileSync(file, launcherScripts({ name: "pt", commands: ["a", "b"] }, dir).cmd);

    execSync(`"${file}"`);
    assert.deepStrictEqual(readRequest(dir), ["pt", ""]);
});

test("sh direct launcher keeps each argument whole", { skip: !hasSh }, () => {
    const dir = tempDir();
    const file = path.join(dir, "pt");
    fs.writeFileSync(file, launcherScripts({ name: "pt", commands: ["printf '%s|'"] }, dir).sh);

    assert.strictEqual(execFileSync("sh", [file, "a b", "c"], { encoding: "utf8" }), "a b|c|");
});

test("sh request launcher writes the name and the arguments", { skip: !hasSh }, () => {
    const dir = tempDir();
    const file = path.join(dir, "pt");
    fs.writeFileSync(file, launcherScripts({ name: "pt", commands: ["a", "b"] }, dir).sh);

    execFileSync("sh", [file, "x & y", "$HOME"]);
    assert.deepStrictEqual(readRequest(dir), ["pt", "x & y $HOME"]);
});

test("cmd: ASCII launchers stay one line, others switch to UTF-8 and back", () => {
    assert.doesNotMatch(launcherScripts({ name: "dev", commands: ["npm run dev"] }, "").cmd, /chcp/);
    const arabic = launcherScripts({ name: "سلم", commands: ["echo مرحبا"] }, "").cmd;
    assert.match(arabic, /chcp 65001/);
    assert.match(arabic, /chcp %PT_CP%/);
    assert.match(launcherScripts({ name: "ابدأ", commands: ["a", "b"] }, "C:\\req").cmd, /chcp 65001[\s\S]*chcp !PT_CP!/);
});

test("cmd: Arabic in the command, the name and the arguments arrives intact", { skip: !isWindows }, () => {
    const dir = tempDir();
    const echo = path.join(dir, "echo.js");
    fs.writeFileSync(echo, `process.stdout.write(Buffer.from(process.argv.slice(2).join("|")).toString("hex"))`);
    const hex = (text) => Buffer.from(text).toString("hex");

    const direct = path.join(dir, "direct.cmd");
    fs.writeFileSync(direct, launcherScripts({ name: "x", commands: [`node "${echo}" مرحبا`] }, dir).cmd);
    assert.strictEqual(execSync(`"${direct}" سلام`, { encoding: "utf8" }), hex("مرحبا|سلام"));

    const request = path.join(dir, "request.cmd");
    fs.writeFileSync(request, launcherScripts({ name: "ابدأ", commands: ["a", "b"] }, dir).cmd);
    execSync(`"${request}" سلام`);
    assert.deepStrictEqual(readRequest(dir), ["ابدأ", "سلام"]);

    // the console is left on the code page it had
    assert.match(execSync(`chcp 437 >nul & "${direct}" & chcp`, { encoding: "utf8" }), /: 437/);
});
