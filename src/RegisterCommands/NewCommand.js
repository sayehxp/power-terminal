const vscode = require("vscode");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
const { getDB, postDB } = require("../utilites/functions");
const { createShim, launcherDir } = require("../utilites/shim");
const { validateName } = require("../utilites/names");


let NewCommand = vscode.commands.registerCommand(
    "extension.createnew",
    async () => {
        let commandName = await showInputBox("Enter your command name , spaces are not allowed", "Command Name");

        if (!commandName) {
            return
        }
        commandName = commandName.trim();
        const jsonDB = await getDB();
        // the name becomes a launcher on PATH, so it must not hide a real program
        const problem = validateName(commandName, {
            allcommands: jsonDB.allcommands || [],
            launcherDir: launcherDir(),
        });
        if (problem) {
            vscodeMessageBox(problem);
            return;
        }

        insertNewCommand([], commandName);
    }
);

const insertNewCommand = async (commandArr, commandName) => {


    try {

        let command = await showInputBox(
            "Enter your command :",
            `Enter Your ${commandArr.length + 1} Command or Press Enter`
        );


        if (command) {
            commandArr.push(command);
            insertNewCommand(commandArr, commandName);
        } else if (!commandArr.length) {
            vscodeMessageBox(`${commandName} was not saved, it needs at least one command`);
        } else {
            //save
            let jsonDB = await getDB();
            let allcommands = jsonDB.allcommands || [];

            let commandId = allcommands[allcommands.length - 1]?.id + 1 || 65;
            const newCommnand = {
                id: commandId,
                name: commandName,
                commands: commandArr,
            }
            allcommands.push(newCommnand);
            jsonDB = { ...jsonDB, allcommands };


            postDB(jsonDB)
            createShim(newCommnand);
            vscodeMessageBox(`${commandName} saved`);

        }
    } catch (err) {
        vscodeMessageBox(err.toString());
    }
};


module.exports = {
    NewCommand
}
