//@ts-check
const vscode = require("vscode");
const { getDB, openTerminal } = require("../utilites/functions");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
let RunCommand = vscode.commands.registerCommand(
    "extension.execute",
    async () => {
        const jsonDB = await getDB();
        const allcommands = jsonDB.allcommands || [];
        let commandName = await showInputBox(
            `Enter your command name :`,
            `Enter Your Command name or Press Enter`
        );

        if (!commandName) {
            return;
        }

        const targetCommand = allcommands.find((e) => e.name == commandName);
        if (!targetCommand) {
            vscodeMessageBox(`Command "${commandName}" not found`);
            return;
        }
        openTerminal([...targetCommand.commands]);
    }
);

module.exports = {
    RunCommand
}