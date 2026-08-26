//@ts-check
const vscode = require("vscode");
const { openTerminal, getDB } = require("../utilites/functions");
const { applyArgs, takeShortcutArgs } = require("../utilites/arguments");

let ShortcutKeys = vscode.commands.registerCommand(
    "extension.catcharg",
    async (argument) => {
        const jsonDB = await getDB();
        const allcommands = jsonDB.allcommands || [];
        const targetCommand = allcommands.find((e) => e.id == argument);
        if (!targetCommand) {
            return;
        }
        // arguments are only there when the .vbs launcher forwarded a typed terminal line
        const args = takeShortcutArgs(targetCommand.id);
        openTerminal(applyArgs(targetCommand.commands, args));
    }
);


module.exports = {
    ShortcutKeys
}
