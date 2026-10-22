const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { mergeCommands, importCommands, legacyDatabases, readJSON, writeJSON } = require("../src/utilites/storage");

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "pt-test-"));

test("merge: a name already saved wins, new names are added", () => {
    const target = [{ id: 65, name: "dev", commands: ["npm run dev"] }];
    const incoming = [
        { id: 65, name: "dev", commands: ["npm start"] },
        { id: 66, name: "zero", commands: ["echo zero"] },
    ];
    const { allcommands, added, skipped } = mergeCommands(target, incoming);
    assert.deepStrictEqual(allcommands.map((c) => [c.id, c.name, c.commands[0]]), [
        [65, "dev", "npm run dev"],
        [66, "zero", "echo zero"],
    ]);
    assert.deepStrictEqual(added, ["zero"]);
    assert.deepStrictEqual(skipped, ["dev"]);
});

test("merge: an id that is taken gets the next free one", () => {
    const target = [{ id: 79, name: "dxd", commands: ["echo dxd"] }, { id: 90, name: "x", commands: ["x"] }];
    const { allcommands } = mergeCommands(target, [{ id: 79, name: "zero", commands: ["echo zero"] }]);
    assert.strictEqual(allcommands[2].id, 91);
});

test("merge: an empty target starts at 65, and an exact copy is dropped without a report", () => {
    const { allcommands, skipped } = mergeCommands([], [
        { name: "a", commands: ["a"] },
        { id: 80, name: "dev", commands: ["npm run dev"] },
        { id: 81, name: "dev", commands: ["npm run dev"] },
    ]);
    assert.deepStrictEqual(allcommands.map((c) => [c.id, c.name]), [[65, "a"], [80, "dev"]]);
    assert.deepStrictEqual(skipped, []);
});

test("import: each old database is copied in once", () => {
    const dir = tempDir();
    const shared = path.join(dir, "db.json");
    const old = path.join(dir, "old.json");
    writeJSON(shared, { allcommands: [] });
    writeJSON(old, { allcommands: [{ id: 65, name: "dev", commands: ["npm run dev"] }] });

    assert.deepStrictEqual(importCommands(shared, old), { added: ["dev"], skipped: [] });

    // deleting it afterwards must not bring it back on the next start
    writeJSON(shared, { ...readJSON(shared), allcommands: [] });
    assert.strictEqual(importCommands(shared, old), null);
    assert.deepStrictEqual(readJSON(shared).allcommands, []);
});

test("import: a missing old database is skipped", () => {
    const dir = tempDir();
    const shared = path.join(dir, "db.json");
    writeJSON(shared, { allcommands: [] });
    assert.strictEqual(importCommands(shared, path.join(dir, "nope.json")), null);
});

test("legacy databases: own editor first, then the other editors under the same root", () => {
    const root = tempDir();
    const storage = (editor) => path.join(root, editor, "User", "globalStorage", "sayehxp.powerterminal");
    for (const editor of ["Code", "Cursor", "Antigravity"]) {
        fs.mkdirSync(storage(editor), { recursive: true });
    }
    writeJSON(path.join(storage("Antigravity"), "db.json"), { allcommands: [] });
    writeJSON(path.join(storage("Code"), "db.json"), { allcommands: [] });

    const found = legacyDatabases(storage("Cursor"));
    assert.strictEqual(found[0], path.join(storage("Cursor"), "db.json"));
    assert.deepStrictEqual(found.slice(1).sort(), [
        path.join(storage("Antigravity"), "db.json"),
        path.join(storage("Code"), "db.json"),
    ]);
});

test("write: no temp file is left behind", () => {
    const dir = tempDir();
    writeJSON(path.join(dir, "db.json"), { allcommands: [] });
    assert.deepStrictEqual(fs.readdirSync(dir), ["db.json"]);
});
