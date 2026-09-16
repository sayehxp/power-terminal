const vscode = require("vscode");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
const { getDB, postDB } = require("../utilites/functions");
const { deleteShim } = require("../utilites/shim");


let DeleteCommand = vscode.commands.registerCommand(
    "extension.delete",
    async () => {
        let commandName = await showInputBox("Enter command you want to Delete", "Command Name to Delete");
        if (commandName) {
            deleteCommand(commandName);
        }
    }
);

const deleteCommand = async (commandName) => {


    try {
        //save
        let jsonDB = await getDB();
        let allcommands = jsonDB.allcommands || [];
        let isExist = allcommands.find(command => command.name == commandName);
        if (isExist) {
            allcommands = allcommands.filter(command => command.name != commandName);
            jsonDB = { ...jsonDB, allcommands };
            postDB(jsonDB)
            deleteShim(commandName);
            vscodeMessageBox(`${commandName} deleted`)
        }




    }
    catch (err) {
        vscodeMessageBox(err.toString())
    }
}


module.exports = {
    DeleteCommand
}
