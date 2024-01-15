const Os = require("os");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { showInputBox, vscodeMessageBox } = require("../utilites/vscode");
const { getDB, postDB } = require("../utilites/functions");
let appDataPath = path.join(Os.homedir(), "AppData\\Local\\Microsoft\\WindowsApps");


let NewCommand = vscode.commands.registerCommand(
    "extension.createnew",
    async () => {
        let commandName = await showInputBox("Enter your command name , spaces are not allowed", "Command Name");

        if (commandName.includes(' ')) {
            vscodeMessageBox('space is not allowed please retry again');
            return;
        }
        if (!commandName) {
            return
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
            createVBS(commandName, commandId);

        }
    } catch (err) {
        vscodeMessageBox(err.toString());
    }
};





const createVBS = (commandName, commandId) => {
    let path1 = appDataPath;
    //older verison of windows
    if (fs.existsSync(path1)) {
        path1 = path.join(appDataPath, commandName.toString() + ".vbs");
    } else {
        path1 = path.join(Os.homedir(), commandName.toString() + ".vbs");
    }

    let convertTochar = String.fromCharCode(commandId);
    let script = `set x = CreateObject("WScript.Shell") \n x.SendKeys "^+%${convertTochar}"`;
    fs.writeFile(path1, script, (err) => {
        if (err) vscode.window.activeTerminal.sendText(`echo ${err}`);
    });
    vscodeMessageBox(`your command has been sucessuful inserted`);
}


module.exports = {
    NewCommand
}