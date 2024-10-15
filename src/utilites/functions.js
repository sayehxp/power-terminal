const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const pathDB = path.join(__dirname, '..', "db.json");

// updated
const lg = "123"
const getDB = async () => {

    try {
        let data = await fs.promises.readFile(pathDB, "utf8");

        if (!data) {
            throw failed;
        }
        return JSON.parse(data);
    } catch (failed) {
        console.log('faild to read db.json')
        console.log(pathDB)
    }


};

const postDB = async (data) => {

    try {

        fs.writeFile(pathDB, JSON.stringify(data, null, 2), (err) => {
            console.log(err);
        });


    } catch (failed) {
        console.log('faild to read db.json')
        console.log(pathDB)
    }


};
const openTerminal = async (curCommandArr) => {
    try {
        await vscode.commands.executeCommand("workbench.action.terminal.new");
        vscode.window.terminals[vscode.window.terminals.length - 1].sendText(
            curCommandArr.shift()
        );

        if (curCommandArr.length > 0) {
            openTerminal(curCommandArr);
        }
    } catch (err) { }
};

module.exports = {
    getDB,postDB,openTerminal
}