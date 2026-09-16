//@ts-check
const { NewCommand } = require("./src/RegisterCommands/NewCommand");
const { ShortcutKeys } = require("./src/RegisterCommands/ShortcutKeys");
const { RunCommand } = require("./src/RegisterCommands/RunCommand");
const { DeleteCommand } = require("./src/RegisterCommands/DeleteCommand");
const { initDB, getDB } = require("./src/utilites/functions");
const { useGlobalStorage, watchRequests } = require("./src/utilites/requests");
const { refreshShims } = require("./src/utilites/shim");
//______________________________________________________________
function activate(context) {
    initDB(context);
    // both sides have to agree on the request dir before any launcher is written
    useGlobalStorage(context);
    // replace launchers saved by older versions, which pressed keys at the focused window
    getDB()
        .then((jsonDB) => refreshShims(jsonDB.allcommands || []))
        .catch((err) => console.log("failed to refresh launchers", err));
    context.subscriptions.push(
        NewCommand,
        RunCommand,
        DeleteCommand,
        ShortcutKeys,
        watchRequests()
    );
}
exports.activate = activate;

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
