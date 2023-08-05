const Os = require('os');
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const pathDB = path.join(__dirname, 'db.json');
//___________________________________________________________
function activate (context) {
    let commandName;
    let commandArr = [];
    let curCommandArr = [];
    let curCommandArrLenght = 0;
    let jsonDB;
    let allcommands;
    let appDataPath = path.join(Os.homedir(), 'AppData\\Local\\Microsoft\\WindowsApps');
    let clearPerviousTerminals = false;

const showInputBox = async(prompt , placeHolder , value) => {
await vscode.window.showInputBox({prompt: prompt,placeHolder : placeHolder})
.then((e) => value = e);
return value;
}
const vscodeMessageBox = (message) => vscode.window.showInformationMessage(message.toString());
const readDB = async()=>{

try {
    let data = await fs.promises.readFile(pathDB, 'utf8');
    jsonDB = JSON.parse(data);
    if(!jsonDB){throw failed}
} catch (failed) {
    jsonDB = {}
}





}
const getID =  ()=> {
const id = [];
allcommands.forEach((e) => id.push(e.id));
for(let x=1;x<=10;x++) if(!id.includes(x)) return x
return 1
}



const runTerminal = async ()=>{
    try {
        await vscode.commands.executeCommand('workbench.action.terminal.new');
        vscode.window.terminals[vscode.window.terminals.length - 1].sendText(curCommandArr.shift());

        if(curCommandArr.length > 0){
            runTerminal();
        }
        else{
            
            if(clearPerviousTerminals){
                for (let i = 0; i < vscode.window.terminals.length - curCommandArrLenght ; i++) 
                {vscode.window.terminals[i].dispose();}
            }
            
        }

        }
        catch(err){

        }
}


let createNew = vscode.commands.registerCommand('extension.createnew',  async() => {
    let name = await showInputBox('Enter your command name','Command Name')
    if (!name) return;
    name.includes(' -x') ? clearPerviousTerminals = true : clearPerviousTerminals = false;
    commandName = name.replace(' -x','');
    commandArr = [];
    insertNewCommand();
});



const insertNewCommand =  async ()=> {
    
try {
    
    let command =  await showInputBox('Enter your command :',`Enter Your ${commandArr.length + 1} Command or Press Enter`)
    if(command.length > 0){
        commandArr.push(command);
        insertNewCommand();
    }
    else{                                                 //save

        await readDB()
        allcommands = jsonDB.allcommands || [];
        let id = getID();
        allcommands.push({
            "id": id , "name" : commandName,"commands" : commandArr,"clear": clearPerviousTerminals
        })
        jsonDB = {...jsonDB,allcommands}
    
    
    
    //write jsonDB____________________________________________
        fs.writeFile(pathDB, JSON.stringify(jsonDB,null,2), err => {
            if (err) vscodeMessageBox(err.toString())})
    
    
    
    //Shortcut
        
        let appDataPath ;
        let path1 = path.join(Os.homedir(), 'AppData\\Local\\Microsoft\\WindowsApps')
        if (fs.existsSync(path1)){
            appDataPath = path.join(Os.homedir(), 'AppData\\Local\\Microsoft\\WindowsApps',commandName.toString() + ".vbs");
        }else{
            appDataPath = path.join(Os.homedir(),commandName.toString() + ".vbs");
        }
        let str = `set x = CreateObject("WScript.Shell") \n x.SendKeys "^+%${id.toString()}"`

        fs.writeFile(appDataPath, str, err => {
            if (err) vscode.window.activeTerminal.sendText(`echo ${err}`)})
    
        vscodeMessageBox(`your command has been sucessuful inserted`);
    }
    
    
    
    }catch (err) {
    vscodeMessageBox(err.toString());
    }
    
    
    
}


let execute  = vscode.commands.registerCommand('extension.execute',  async() => {
    await readDB();
    allcommands = jsonDB.allcommands || [];    
    let commandName = await showInputBox(`Enter your command name :`,`Enter Your Command name or Press Enter`);

    curCommandArr = allcommands.find((e)=> e.name == commandName).commands;
    clearPerviousTerminals = jsonDB.clear || false;
    runTerminal();
})


let catcharg = vscode.commands.registerCommand('extension.catcharg',  async(argument) => {
    await readDB();
    allcommands = jsonDB.allcommands || [];    
    let targetCommand = allcommands.find((e)=> e.id == argument) 
    curCommandArr = targetCommand.commands;
    curCommandArrLenght = curCommandArr.length;
    clearPerviousTerminals = targetCommand.clear || false;
    runTerminal();
})

let sync = vscode.commands.registerCommand('extension.sync',  async(argument) => {
//===========================vbsFiles==================================================
    await readDB();
    allcommands = jsonDB.allcommands || [];    

   //read 
    const files = await fs.promises.readdir(appDataPath)
    //del 
    files.forEach((file) => {
    if (fs.existsSync(path.join(appDataPath , file))) {
        try {fs.unlinkSync(path.join(appDataPath , file))} catch (err) {}}
    })
    //write
    allcommands.forEach((command) => {
        let id = command.id || 0
        let str = `set x = CreateObject("WScript.Shell") \n x.SendKeys "^+%${id.toString()}"`
        fs.writeFile(path.join(appDataPath , command.name + '.vbs'), str, err => {
        if (err) vscode.window.activeTerminal.sendText(`echo ${err}`)
        });
    })


vscodeMessageBox('sucessfully')



})

context.subscriptions.push(createNew , execute , catcharg , sync);



}





exports.activate = activate;