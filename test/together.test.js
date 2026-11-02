const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { runTogether, lineTagger } = require("../src/utilites/together");

const isWindows = os.platform() === "win32";

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "pt-test-"));

// Collects what would reach the terminal; not a TTY, so no colour codes.
const sink = () => {
    const chunks = [];
    return { chunks, write: (text) => chunks.push(text), text: () => chunks.join("") };
};

test("tagger: whole lines get the tag, a line cut across chunks waits for its end", () => {
    const out = sink();
    const tagger = lineTagger("[1] ", out.write);
    tagger.push("one\ntw");
    tagger.push("o\nthr");
    assert.strictEqual(out.text(), "[1] one\n[1] two\n");
    tagger.end();
    assert.strictEqual(out.text(), "[1] one\n[1] two\n[1] thr\n");
});

test("together: every entry runs in this terminal at once, output tagged, as typed", { skip: !isWindows }, async () => {
    const dir = tempDir();
    const cwd = process.cwd();
    process.chdir(dir);
    const stdout = sink();
    const stderr = sink();
    let code;
    try {
        code = await runTogether("stack", [
            `echo "a & b" && echo second`,
            `echo x^^y 1>&2 && exit /b 4`,
        ], { stdout, stderr });
    } finally {
        process.chdir(cwd);
    }

    const out = stdout.text().split(/\r?\n/).map((line) => line.trimEnd());
    assert.strictEqual(out[0], "stack: running 2 entries here, Ctrl+C stops them all");
    assert.strictEqual(out[1], `[1] echo "a & b" && echo second`);
    assert.ok(out.includes(`[1] "a & b"`), stdout.text());
    assert.ok(out.includes(`[1] second`), stdout.text());
    assert.ok(out.includes(`[1] exited with code 0`), stdout.text());
    assert.ok(out.includes(`[2] exited with code 4`), stdout.text());
    assert.match(stderr.text(), /^\[2\] x\^y/m);
    assert.strictEqual(code, 4, "the failing entry's code comes back");
});

test("together: an entry that cannot start ends with code 1 and the rest still finish", async () => {
    const { EventEmitter } = require("events");
    const stdout = sink();
    const stderr = sink();
    const start = (entry) => {
        const child = new EventEmitter();
        setImmediate(() => (entry === "bad" ? child.emit("error", new Error("spawn failed")) : child.emit("close", 0)));
        return child;
    };
    const code = await runTogether("x", ["bad", "good"], { stdout, stderr, start });
    assert.strictEqual(code, 1);
    assert.match(stderr.text(), /\[1\] spawn failed/);
    assert.match(stdout.text(), /\[2\] exited with code 0/);
});
