const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync, execFileSync } = require("child_process");
const { run } = require("../src/cli");
const { cliScripts } = require("../src/utilites/launchers");
const { readJSON, writeJSON } = require("../src/utilites/storage");

const isWindows = os.platform() === "win32";

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "pt-test-"));

// A temp db.json and launcher calls that are recorded instead of written to PATH.
const setup = (allcommands = []) => {
    const dbFile = path.join(tempDir(), "db.json");
    writeJSON(dbFile, { allcommands });
    const created = [];
    const removed = [];
    const options = {
        dbFile,
        dir: "",
        validate: () => null,
        create: (command) => created.push(command),
        remove: (name) => removed.push(name),
    };
    return { dbFile, created, removed, options };
};

test("add: saves the command and writes its launchers", () => {
    const { dbFile, created, options } = setup([{ id: 70, name: "old", commands: ["echo old"] }]);
    const result = run(["add", "dev", "npm run dev"], options);
    assert.deepStrictEqual(result, { code: 0, out: "dev saved" });
    const saved = { id: 71, name: "dev", commands: ["npm run dev"] };
    assert.deepStrictEqual(readJSON(dbFile).allcommands[1], saved);
    assert.deepStrictEqual(created, [saved]);
});

test("add: one argument per entry, and the first command gets id 65", () => {
    const { dbFile, options } = setup();
    const result = run(["add", "stack", "npm run api", "  ", "npm run web"], options);
    assert.strictEqual(result.code, 0);
    assert.match(result.out, /only runs while VS Code/);
    assert.deepStrictEqual(readJSON(dbFile).allcommands, [
        { id: 65, name: "stack", commands: ["npm run api", "npm run web"] },
    ]);
});

test("add: a name the check refuses is not saved", () => {
    const { dbFile, created, options } = setup();
    const result = run(["add", "git", "git status"], { ...options, validate: () => `"git" is taken` });
    assert.deepStrictEqual(result, { code: 1, out: `"git" is taken` });
    assert.deepStrictEqual(readJSON(dbFile).allcommands, []);
    assert.deepStrictEqual(created, []);
});

test("add: the real name check sees commands already saved", () => {
    const { options } = setup([{ id: 65, name: "dev", commands: ["npm run dev"] }]);
    const { validate, ...rest } = options;
    const result = run(["add", "DEV", "npm start"], rest);
    assert.deepStrictEqual(result, { code: 1, out: `"DEV" already exists as "dev"` });
});

test("add: a name with no entries prints the usage", () => {
    const { options } = setup();
    const result = run(["add", "dev"], options);
    assert.strictEqual(result.code, 1);
    assert.match(result.out, /^usage:/);
});

test("remove: deletes the command and its launchers", () => {
    const { dbFile, removed, options } = setup([
        { id: 65, name: "dev", commands: ["npm run dev"] },
        { id: 66, name: "web", commands: ["npm run web"] },
    ]);
    assert.deepStrictEqual(run(["remove", "dev"], options), { code: 0, out: "dev deleted" });
    assert.deepStrictEqual(readJSON(dbFile).allcommands.map((c) => c.name), ["web"]);
    assert.deepStrictEqual(removed, ["dev"]);
});

test("remove: a missing command says so and touches nothing", () => {
    const { removed, options } = setup();
    assert.deepStrictEqual(run(["remove", "nope"], options), { code: 1, out: `Command "nope" not found` });
    assert.deepStrictEqual(removed, []);
});

test("list: one line per entry, the name only on the first", () => {
    const { options } = setup([
        { id: 65, name: "dev", commands: ["npm run dev"] },
        { id: 66, name: "stack", commands: ["npm run api", "npm run web"] },
    ]);
    assert.deepStrictEqual(run(["list"], options), {
        code: 0,
        out: ["dev    npm run dev", "stack  npm run api", "       npm run web"].join("\n"),
    });
});

test("rm and ls still work as the old names of remove and list", () => {
    const { removed, options } = setup([{ id: 65, name: "dev", commands: ["npm run dev"] }]);
    assert.deepStrictEqual(run(["ls"], options), { code: 0, out: "dev  npm run dev" });
    assert.deepStrictEqual(run(["rm", "dev"], options), { code: 0, out: "dev deleted" });
    assert.deepStrictEqual(removed, ["dev"]);
});

test("unknown actions fail, no action prints the usage", () => {
    const { options } = setup();
    assert.strictEqual(run(["make"], options).code, 1);
    assert.deepStrictEqual(run([], options).code, 0);
});

// Node stands in for Code.exe here; ELECTRON_RUN_AS_NODE means nothing to it.
const echoScript = () => {
    const script = path.join(tempDir(), "echo.js");
    fs.writeFileSync(script, `process.stdout.write(JSON.stringify(process.argv.slice(2)))`);
    return script;
};

test("cli launcher: cmd hands the arguments over", { skip: !isWindows }, () => {
    const script = echoScript();
    const launcher = path.join(path.dirname(script), "pt.cmd");
    fs.writeFileSync(launcher, cliScripts(process.execPath, script).cmd);
    const out = execSync(`"${launcher}" add dev "npm run dev"`, { encoding: "utf8" });
    assert.deepStrictEqual(JSON.parse(out), ["add", "dev", "npm run dev"]);
});

test("cli launcher: sh hands the arguments over with their quoting", { skip: !isWindows }, () => {
    const script = echoScript();
    const launcher = path.join(path.dirname(script), "pt");
    fs.writeFileSync(launcher, cliScripts(process.execPath, script).sh);
    let out;
    try {
        out = execFileSync("sh", [launcher, "add", "co", "git checkout -b $1 && echo 'x'"], { encoding: "utf8" });
    } catch (err) {
        if (err.code === "ENOENT") return; // no Git Bash
        throw err;
    }
    assert.deepStrictEqual(JSON.parse(out), ["add", "co", "git checkout -b $1 && echo 'x'"]);
});

test("cli launcher: the editor steps aside for a pt installed from npm", { skip: !isWindows }, () => {
    const { installCli, shimPath, shPath } = require("../src/utilites/shim");
    const had = [shimPath("pt"), shPath("pt")].map((file) => (fs.existsSync(file) ? fs.readFileSync(file) : null));
    try {
        installCli("C:\\Code.exe", "C:\\pt.js", () => []);
        assert.match(fs.readFileSync(shimPath("pt"), "utf8"), /ELECTRON_RUN_AS_NODE/);

        installCli("C:\\Code.exe", "C:\\pt.js", () => ["C:\\Users\\x\\AppData\\Roaming\\npm\\pt.cmd"]);
        assert.ok(!fs.existsSync(shimPath("pt")) && !fs.existsSync(shPath("pt")));
    } finally {
        // leave whatever pt the machine had before
        [shimPath("pt"), shPath("pt")].forEach((file, i) => {
            if (had[i]) fs.writeFileSync(file, had[i]);
            else if (fs.existsSync(file)) fs.unlinkSync(file);
        });
    }
});

test("arabic: pt ضيف / امسح / اعرض, and any spelling deletes", () => {
    const { dbFile, removed, options } = setup();
    assert.deepStrictEqual(run(["ضيف", "ابدأ", "npm start"], options), { code: 0, out: "ابدأ saved" });
    assert.deepStrictEqual(run(["أضف", "شغل", "npm run dev"], options).code, 0);
    assert.match(run(["اعرض"], options).out, /ابدأ +npm start/);
    assert.deepStrictEqual(run(["قائمة"], options).code, 0);

    assert.deepStrictEqual(run(["امسح", "ابدا"], options), { code: 0, out: "ابدأ deleted" });
    assert.deepStrictEqual(removed, ["ابدأ"]);
    assert.deepStrictEqual(run(["احذف", "شغل"], options).code, 0);
    assert.deepStrictEqual(readJSON(dbFile).allcommands, []);
});
