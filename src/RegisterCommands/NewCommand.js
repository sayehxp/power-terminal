const vscode = require("vscode");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
const { getDB, postDB } = require("../utilites/functions");
const { createShim } = require("../utilites/shim");


let NewCommand = vscode.commands.registerCommand(
    "extension.createnew",
    async () => {
        let commandName = await showInputBox("Enter your command name , spaces are not allowed", "Command Name");

        if (!commandName) {
            return
        }
        if (commandName.includes(' ')) {
            vscodeMessageBox('space is not allowed please retry again');
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
            vscodeMessageBox(`your command has been sucessuful inserted`);

        }
    } catch (err) {
        vscodeMessageBox(err.toString());
    }
};


module.exports = {
    NewCommand
}
