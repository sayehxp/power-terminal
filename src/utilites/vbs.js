//@ts-check
const Os = require("os");
const fs = require("fs");
const path = require("path");
const { shortcutArgsPath } = require("./arguments");

const appDataPath = path.join(Os.homedir(), "AppData", "Local", "Microsoft", "WindowsApps");

// The .vbs launcher is what makes typing the command name straight into the terminal work,
// and only Windows can run it.
const isWindows = () => Os.platform() === "win32";

const launcherPath = (commandName) => {
    // WindowsApps is on PATH by default; older Windows versions fall back to the home dir
    const dir = fs.existsSync(appDataPath) ? appDataPath : Os.homedir();
    return path.join(dir, commandName.toString() + ".vbs");
};

const vbsString = (value) => `"${value.toString().replace(/"/g, '""')}"`;

// Everything typed after the command name is written next to the launcher before the
// keyboard shortcut is fired, which is how `pull main` reaches the extension as `main`.
const launcherScript = (commandId) => [
    `args = ""`,
    `For Each arg In WScript.Arguments`,
    `  If Len(args) > 0 Then args = args & " "`,
    `  args = args & arg`,
    `Next`,
    `On Error Resume Next`,
    `set fso = CreateObject("Scripting.FileSystemObject")`,
    `set out = fso.CreateTextFile(${vbsString(shortcutArgsPath(commandId))}, True)`,
    `out.Write args`,
    `out.Close`,
    `On Error GoTo 0`,
    `set x = CreateObject("WScript.Shell")`,
    `x.SendKeys "^+%${String.fromCharCode(commandId)}"`,
    ``,
].join("\r\n");

const createVBS = (commandName, commandId) => {
    if (!isWindows()) return;
    try {
        fs.writeFileSync(launcherPath(commandName), launcherScript(commandId));
    } catch (err) {
        console.log("failed to write the .vbs launcher", err);
    }
};

const deleteVBS = (commandName) => {
    if (!isWindows()) return;
    try {
        fs.unlinkSync(launcherPath(commandName));
    } catch (err) {
        console.log("failed to delete the .vbs launcher", err);
    }
};

// Commands saved before argument support have a launcher that throws away everything typed
// after the name. Rewriting the outdated ones on activate keeps `pull main` working without
// asking anyone to re-create their commands. Launchers that do not exist are left alone.
const refreshVBS = (allcommands) => {
    if (!isWindows()) return;

    for (const command of allcommands) {
        const name = command && command.name;
        if (!name || name.toString().includes(" ")) continue;
        try {
            const target = launcherPath(name);
            if (!fs.existsSync(target)) continue;
            const wanted = launcherScript(command.id);
            if (fs.readFileSync(target, "utf8") === wanted) continue;
            fs.writeFileSync(target, wanted);
        } catch (err) {
            console.log("failed to refresh the .vbs launcher", err);
        }
    }
};

module.exports = {
    createVBS, deleteVBS, refreshVBS
}
