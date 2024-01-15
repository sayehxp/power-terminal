const Os = require("os");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
const { getDB, postDB } = require("../utilites/functions");
let appDataPath = path.join(Os.homedir(), "AppData\\Local\\Microsoft\\WindowsApps");


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
            deleteVBS(commandName);
            vscodeMessageBox(`${commandName} deleted`)
        }





    }
    catch (err) {
        vscodeMessageBox(err.toString())
    }
}




const deleteVBS = (commandName) => {
    let path1 = appDataPath;

    //older verison of windows
    if (fs.existsSync(path1)) {
        path1 = path.join(appDataPath, commandName.toString() + ".vbs");
    } else {
        path1 = path.join(Os.homedir(), commandName.toString() + ".vbs");
    }




    fs.unlink(path1, (err) => {
        if (err) {
            console.error(`Error deleting file: ${err}`);
        } else {
            console.log(`File ${path1} deleted successfully`);
        }
    });



    vscodeMessageBox(`your command has been sucessuful inserted`);
}


module.exports = {
    DeleteCommand
}