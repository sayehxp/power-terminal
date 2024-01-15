const vscode = require("vscode");

const showInputBox = (prompt, placeHolder) => {
    return vscode.window
        .showInputBox({ prompt: prompt, placeHolder: placeHolder })
        .then((res) => res)
        .catch((err) => console.log(err));
};

const vscodeMessageBox = (message) => {
    return vscode.window.showInformationMessage(message.toString());
}
module.exports = {
    showInputBox , vscodeMessageBox
}