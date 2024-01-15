
//@ts-check
const { NewCommand } = require("./src/RegisterCommands/NewCommand");
const { ShortcutKeys } = require("./src/RegisterCommands/ShortcutKeys");
const { RunCommand } = require("./src/RegisterCommands/RunCommand");
const { DeleteCommand } = require("./src/RegisterCommands/DeleteCommand");
//______________________________________________________________
function activate(context) {
    context.subscriptions.push(
        NewCommand,
        RunCommand,
        DeleteCommand,
        ShortcutKeys
    );
}

exports.activate = activate;
