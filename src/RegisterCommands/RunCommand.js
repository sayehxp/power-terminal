//@ts-check
const vscode = require("vscode");
const { getDB, openTerminal } = require("../utilites/functions");
const { showInputBox } = require("../utilites/vscode");
let RunCommand = vscode.commands.registerCommand(
    "extension.execute",
    async () => {
        const jsonDB = await getDB();
        const allcommands = jsonDB.allcommands || [];
        let commandName = await showInputBox(
            `Enter your command name :`,
            `Enter Your Command name or Press Enter`
        );

        const curCommandArr = allcommands.find((e) => e.name == commandName).commands;
        openTerminal(curCommandArr);
    }
);

module.exports = {
    RunCommand
}