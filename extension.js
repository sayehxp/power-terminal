//@ts-check
const path = require("path");
const { NewCommand } = require("./src/RegisterCommands/NewCommand");
const { ShortcutKeys } = require("./src/RegisterCommands/ShortcutKeys");
const { RunCommand } = require("./src/RegisterCommands/RunCommand");
const { DeleteCommand } = require("./src/RegisterCommands/DeleteCommand");
const { initDB, getDB } = require("./src/utilites/functions");
const { useSharedStorage, watchRequests } = require("./src/utilites/requests");
const { refreshShims, installCli } = require("./src/utilites/shim");
const { vscodeMessageBox } = require("./src/utilites/vscode");
//______________________________________________________________
function activate(context) {
    reportImport(initDB(context));
    // both sides have to agree on the request dir before any launcher is written
    useSharedStorage();
    // replace launchers saved by older versions, which pressed keys at the focused window
    getDB()
        .then((jsonDB) => refreshShims(jsonDB.allcommands || []))
        .catch((err) => console.log("failed to refresh launchers", err));
    // `pt add` / `pt rm` from any terminal, so commands can be made without the editor
    installCli(process.execPath, path.join(context.extensionPath, "bin", "pt.js"));
    context.subscriptions.push(
        NewCommand,
        RunCommand,
        DeleteCommand,
        ShortcutKeys,
        watchRequests()
    );
}
exports.activate = activate;

// Only said once, on the start that moved the commands; later starts import nothing.
const reportImport = (result) => {
    if (!result || (!result.added.length && !result.skipped.length)) return;
    let message = `Power Terminal: your commands are now shared between VS Code, Cursor and Antigravity (${result.added.length} brought over).`;
    const skipped = [...new Set(result.skipped)];
    if (skipped.length) {
        message += ` Already saved under the same name, so not copied again: ${skipped.join(", ")}`;
    }
    vscodeMessageBox(message);
};

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
