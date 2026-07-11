
//@ts-check
const { NewCommand } = require("./src/RegisterCommands/NewCommand");
const { ShortcutKeys } = require("./src/RegisterCommands/ShortcutKeys");
const { RunCommand } = require("./src/RegisterCommands/RunCommand");
const { DeleteCommand } = require("./src/RegisterCommands/DeleteCommand");
const { initDB } = require("./src/utilites/functions");
//______________________________________________________________
function activate(context) {
    initDB(context);
    context.subscriptions.push(
        NewCommand,
        RunCommand,
        DeleteCommand,
        ShortcutKeys
    );
}

exports.activate = activate;
