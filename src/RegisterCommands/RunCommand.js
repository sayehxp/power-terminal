//@ts-check
const vscode = require("vscode");
const { getDB, openTerminal } = require("../utilites/functions");
const { matchCommandLine, applyArgs } = require("../utilites/arguments");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
let RunCommand = vscode.commands.registerCommand(
    "extension.execute",
    async () => {
        const jsonDB = await getDB();
        const allcommands = jsonDB.allcommands || [];
        let commandLine = await showInputBox(
            `Enter your command name, plus any arguments :`,
            `Enter Your Command name or Press Enter`
        );

        if (!commandLine) {
            return;
        }

        // the whole line counts: the name picks the command, the rest becomes its arguments
        const match = matchCommandLine(allcommands, commandLine);
        if (!match) {
            vscodeMessageBox(`Command "${commandLine.trim()}" not found`);
            return;
        }
        openTerminal(applyArgs(match.targetCommand.commands, match.args), match.targetCommand.name);
    }
);

module.exports = {
    RunCommand
}
