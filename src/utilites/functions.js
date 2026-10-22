const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const { sharedDir, writeJSON, importCommands, legacyDatabases } = require("./storage");

const bundledDB = path.join(__dirname, "..", "db.json");
let pathDB = bundledDB;

// One db.json shared by every editor, so a command saved in VS Code also exists in Cursor and
// Antigravity. Called once from activate(). The databases older versions kept per editor are
// copied in on the first start; what was added or left out is returned so it can be reported.
const initDB = (context) => {
    try {
        const dir = sharedDir();
        fs.mkdirSync(dir, { recursive: true });
        const sharedDB = path.join(dir, "db.json");
        if (!fs.existsSync(sharedDB)) writeJSON(sharedDB, { allcommands: [] });
        pathDB = sharedDB;

        const added = [];
        const skipped = [];
        for (const source of legacyDatabases(context.globalStorageUri.fsPath)) {
            const result = importCommands(sharedDB, source);
            if (!result) continue;
            added.push(...result.added);
            skipped.push(...result.skipped);
        }
        return { added, skipped };
    } catch (err) {
        console.log("failed to init the shared db.json", err);
    }

    // shared folder unusable: keep working out of this editor's own storage like before
    try {
        const storedDB = path.join(context.globalStorageUri.fsPath, "db.json");
        fs.mkdirSync(path.dirname(storedDB), { recursive: true });
        if (!fs.existsSync(storedDB)) writeJSON(storedDB, { allcommands: [] });
        pathDB = storedDB;
    } catch (err) {
        console.log("failed to init global storage, using bundled db.json", err);
    }
    return null;
};

const getDB = async () => {
    try {
        let data = await fs.promises.readFile(pathDB, "utf8");
        return JSON.parse(data);
    } catch (failed) {
        console.log("failed to read db.json");
        console.log(pathDB);
        return { allcommands: [] };
    }
};

const postDB = async (data) => {
    try {
        writeJSON(pathDB, data);
    } catch (failed) {
        console.log("failed to write db.json");
        console.log(pathDB);
    }
};

const openTerminal = async (curCommandArr, name) => {
    try {
        // single command: reuse the active terminal instead of opening a new one
        if (curCommandArr.length === 1 && vscode.window.activeTerminal) {
            const terminal = vscode.window.activeTerminal;
            terminal.show();
            terminal.sendText(curCommandArr[0]);
            return;
        }

        // multiple commands (or no terminal open yet): each command gets its own new terminal,
        // created directly so the text cannot land in a terminal opened by someone else meanwhile
        for (const command of curCommandArr) {
            const terminal = vscode.window.createTerminal({ name: name || "Power Terminal" });
            terminal.show();
            terminal.sendText(command);
        }
    } catch (err) { }
};

module.exports = {
    initDB, getDB, postDB, openTerminal
}
