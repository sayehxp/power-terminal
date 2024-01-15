//@ts-check
const vscode = require("vscode");
const { openTerminal, getDB } = require("../utilites/functions");

let ShortcutKeys = vscode.commands.registerCommand(
    "extension.catcharg",
    async (argument) => {
        const jsonDB = await getDB();
        const allcommands = jsonDB.allcommands || [];
        const targetCommand = allcommands.find((e) => e.id == argument);
        const curCommandArr = targetCommand.commands;
        openTerminal(curCommandArr);
    }
);


module.exports = {
    ShortcutKeys
}