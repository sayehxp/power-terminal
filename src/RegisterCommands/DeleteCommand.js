const vscode = require("vscode");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
const { getDB, postDB } = require("../utilites/functions");
const { deleteShim } = require("../utilites/shim");
const { nameKey } = require("../utilites/arguments");


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
        // any spelling of the name finds it (ابدا for ابدأ); the launcher goes by the saved one
        let isExist = allcommands.find(command => nameKey(command.name) === nameKey(commandName));
        if (isExist) {
            allcommands = allcommands.filter(command => command !== isExist);
            jsonDB = { ...jsonDB, allcommands };
            postDB(jsonDB)
            deleteShim(isExist.name);
            vscodeMessageBox(`${isExist.name} deleted`)
        } else {
            vscodeMessageBox(`Command "${commandName}" not found`)
        }




    }
    catch (err) {
        vscodeMessageBox(err.toString())
    }
}


module.exports = {
    DeleteCommand
}
