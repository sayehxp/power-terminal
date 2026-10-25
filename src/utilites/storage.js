//@ts-check
// Where saved commands and launcher requests live. VS Code, Cursor, Antigravity and the other
// forks each give an extension its own global storage, so commands saved in one editor were
// invisible to the others, and a launcher only reached the editor that wrote it. Everything
// now lives in one folder they all agree on. Nothing in here touches VS Code, so the tests can
// run it.
const fs = require("fs");
const Os = require("os");
const path = require("path");

const EXTENSION_ID = "sayehxp.powerterminal";

const sharedDir = () => {
    const home = Os.homedir();
    if (Os.platform() === "win32") {
        return path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "powerterminal");
    }
    if (Os.platform() === "darwin") {
        return path.join(home, "Library", "Application Support", "powerterminal");
    }
    return path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "powerterminal");
};

const readJSON = (file) => {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
        return null;
    }
};

// Several editors can have the file open at once. Writing next to it and renaming means a
// reader never sees half a file, which would parse as no commands at all and get saved back.
const writeJSON = (file, data) => {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
};

// A name already in the target wins, since it is the one the launcher on PATH already runs.
// Only a clash with different entries is reported as skipped; an exact copy is just dropped.
// Imported commands keep their id when it is free; keyboard shortcuts are bound to ids.
const mergeCommands = (target, incoming) => {
    const allcommands = [...(target || [])];
    const entries = new Map(allcommands.map((command) => [String(command.name), JSON.stringify(command.commands)]));
    const ids = new Set(allcommands.map((command) => Number(command.id)));
    const added = [];
    const skipped = [];

    for (const command of incoming || []) {
        if (!command || !command.name) continue;
        const name = String(command.name);
        if (entries.has(name)) {
            if (entries.get(name) !== JSON.stringify(command.commands)) skipped.push(name);
            continue;
        }
        let id = Number(command.id);
        if (!Number.isInteger(id) || ids.has(id)) {
            id = Math.max(64, ...ids) + 1;
        }
        allcommands.push({ ...command, id });
        entries.set(name, JSON.stringify(command.commands));
        ids.add(id);
        added.push(name);
    }

    return { allcommands, added, skipped };
};

const sameFile = (a, b) => {
    const norm = (file) => path.resolve(file);
    return Os.platform() === "win32"
        ? norm(a).toLowerCase() === norm(b).toLowerCase()
        : norm(a) === norm(b);
};

// Each editor's old db.json is copied in once. It is remembered by path, so deleting a command
// later does not bring it back on the next start. The old file is left where it was.
const importCommands = (dbFile, sourceFile) => {
    if (!fs.existsSync(sourceFile)) return null;

    const db = readJSON(dbFile) || { allcommands: [] };
    const imported = Array.isArray(db.imported) ? db.imported : [];
    if (imported.some((done) => sameFile(done, sourceFile))) return null;

    const source = readJSON(sourceFile);
    const { allcommands, added, skipped } = mergeCommands(
        db.allcommands,
        source && source.allcommands
    );
    writeJSON(dbFile, { ...db, allcommands, imported: [...imported, sourceFile] });
    return { added, skipped };
};

// globalStorage is <root>/<Editor>/User/globalStorage/<extension id>, and every fork uses the
// same shape under the same root, so the other editors' old databases sit next to ours. The
// running editor's own file comes first so its commands win a name clash.
const legacyDatabases = (globalStoragePath) => {
    const own = path.join(globalStoragePath, "db.json");
    const root = path.resolve(globalStoragePath, "..", "..", "..", "..");
    const found = [own];
    try {
        for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const candidate = path.join(root, entry.name, "User", "globalStorage", EXTENSION_ID, "db.json");
            if (!sameFile(candidate, own) && fs.existsSync(candidate)) found.push(candidate);
        }
    } catch (err) { }
    return found;
};

module.exports = {
    sharedDir, readJSON, writeJSON, mergeCommands, importCommands, legacyDatabases
}
