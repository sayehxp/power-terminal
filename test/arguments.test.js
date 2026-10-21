const test = require("node:test");
const assert = require("node:assert");
const { matchCommandLine, applyArgs } = require("../src/utilites/arguments");

const saved = [
    { name: "pull", commands: ["git pull origin"] },
    { name: "print numbers", commands: ["echo 1"] },
];

test("matchCommandLine splits the name from the arguments", () => {
    const match = matchCommandLine(saved, "  pull main --rebase ");
    assert.strictEqual(match.targetCommand.name, "pull");
    assert.strictEqual(match.args, "main --rebase");
});

test("matchCommandLine prefers the longest name and needs a whole word", () => {
    assert.strictEqual(matchCommandLine(saved, "print numbers 5").targetCommand.name, "print numbers");
    assert.strictEqual(matchCommandLine(saved, "puller"), null);
    assert.strictEqual(matchCommandLine(saved, ""), null);
});

test("applyArgs appends to the last entry when there is no placeholder", () => {
    assert.deepStrictEqual(applyArgs(["cd app", "npm start"], "--port 3000"), ["cd app", "npm start --port 3000"]);
    assert.deepStrictEqual(applyArgs(["npm start"], ""), ["npm start"]);
});

test("applyArgs fills placeholders and drops missing ones", () => {
    assert.deepStrictEqual(
        applyArgs(["git checkout -b $1 origin/$2"], "login dev"),
        ["git checkout -b login origin/dev"]
    );
    assert.deepStrictEqual(applyArgs(["echo $*"], "a b"), ["echo a b"]);
    assert.deepStrictEqual(applyArgs(["echo $1 $2"], "a"), ["echo a"]);
});
