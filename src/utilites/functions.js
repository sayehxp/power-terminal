const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

const bundledDB = path.join(__dirname, "..", "db.json");
let pathDB = bundledDB;

// Store db.json in VS Code's global storage so saved commands survive extension updates.
// Called once from activate(). Falls back to the bundled db.json if storage is unavailable.
const initDB = (context) => {
    try {
        const storageDir = context.globalStorageUri.fsPath;
        fs.mkdirSync(storageDir, { recursive: true });
        const storedDB = path.join(storageDir, "db.json");

        if (!fs.existsSync(storedDB)) {
            if (fs.existsSync(bundledDB)) {
                fs.copyFileSync(bundledDB, storedDB);
            } else {
                fs.writeFileSync(storedDB, JSON.stringify({ allcommands: [] }, null, 2));
            }
        }
        pathDB = storedDB;
    } catch (err) {
        console.log("failed to init global storage, using bundled db.json", err);
    }
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
        fs.writeFile(pathDB, JSON.stringify(data, null, 2), (err) => {
            if (err) console.log(err);
        });
    } catch (failed) {
        console.log("failed to write db.json");
        console.log(pathDB);
    }
};

const openTerminal = async (curCommandArr) => {
    try {
        // single command: reuse the active terminal instead of opening a new one
        if (curCommandArr.length === 1 && vscode.window.activeTerminal) {
            const terminal = vscode.window.activeTerminal;
            terminal.show();
            terminal.sendText(curCommandArr[0]);
            return;
        }

        // multiple commands (or no terminal open yet): each command gets its own new terminal
        for (const command of curCommandArr) {
            await vscode.commands.executeCommand("workbench.action.terminal.new");
            vscode.window.terminals[vscode.window.terminals.length - 1].sendText(command);
        }
    } catch (err) { }
};

module.exports = {
    initDB, getDB, postDB, openTerminal
}
