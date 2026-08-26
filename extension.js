//@ts-check
const { NewCommand } = require("./src/RegisterCommands/NewCommand");
const { ShortcutKeys } = require("./src/RegisterCommands/ShortcutKeys");
const { RunCommand } = require("./src/RegisterCommands/RunCommand");
const { DeleteCommand } = require("./src/RegisterCommands/DeleteCommand");
const { initDB, getDB } = require("./src/utilites/functions");
const { refreshVBS } = require("./src/utilites/vbs");
//______________________________________________________________
function activate(context) {
    initDB(context);
    // bring launchers saved by older versions up to date so they forward typed arguments
    getDB().then((jsonDB) => refreshVBS(jsonDB.allcommands || []));
    context.subscriptions.push(
        NewCommand,
        RunCommand,
        DeleteCommand,
        ShortcutKeys
    );
}

exports.activate = activate;
