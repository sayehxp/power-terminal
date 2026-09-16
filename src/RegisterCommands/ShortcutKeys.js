//@ts-check
const vscode = require("vscode");
const { openTerminal, getDB } = require("../utilites/functions");

let ShortcutKeys = vscode.commands.registerCommand(
    "extension.catcharg",
    async (argument) => {
        const jsonDB = await getDB();
        const allcommands = jsonDB.allcommands || [];
        const targetCommand = allcommands.find((e) => e.id == argument);
        if (!targetCommand) {
            return;
        }
        // a keybinding carries no arguments; type the name in a terminal to pass some
        openTerminal([...targetCommand.commands]);
    }
);


module.exports = {
    ShortcutKeys
}
