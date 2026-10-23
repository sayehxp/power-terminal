//@ts-check
const Os = require("os");
const fs = require("fs");
const path = require("path");
const { launcherScripts, cliScripts } = require("./launchers");
const { requestsDir } = require("./requests");
const { findOnPath, isOurLauncher } = require("./names");

const appDataPath = path.join(Os.homedir(), "AppData", "Local", "Microsoft", "WindowsApps");

// Launchers are a Windows-only convenience: WindowsApps is on PATH out of the box and
// .CMD is in PATHEXT, so a file dropped there is callable by name from any shell.
const isWindows = () => Os.platform() === "win32";

// WindowsApps is on PATH by default; older Windows versions fall back to the home dir
const launcherDir = () => (fs.existsSync(appDataPath) ? appDataPath : Os.homedir());

const shimPath = (commandName) => path.join(launcherDir(), commandName.toString() + ".cmd");

// Git Bash ignores PATHEXT and looks for the bare name, so it gets an extensionless sh script
// next to the .cmd. That is also what `! name` in Claude Code ends up running.
const shPath = (commandName) => path.join(launcherDir(), commandName.toString());

// Launchers written before 1.4.0 fired a keyboard shortcut at whatever window happened to
// have focus. They are deleted on sight, and would shadow the .cmd anyway: .VBS comes
// before .CMD in the default PATHEXT.
const legacyPath = (commandName) => path.join(launcherDir(), commandName.toString() + ".vbs");

// Only an existing file is rewritten, so a launcher nobody changed keeps its timestamp.
const writeIfChanged = (target, content) => {
    if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === content) return;
    fs.writeFileSync(target, content);
};

const writeLaunchers = (command) => {
    const scripts = launcherScripts(command, requestsDir());
    writeIfChanged(shimPath(command.name), scripts.cmd);
    writeIfChanged(shPath(command.name), scripts.sh);
    // an old .vbs under the same name would win the PATHEXT race
    if (fs.existsSync(legacyPath(command.name))) fs.unlinkSync(legacyPath(command.name));
};

const createShim = (command) => {
    if (!isWindows()) return;
    try {
        writeLaunchers(command);
    } catch (err) {
        console.log("failed to write the launcher", err);
    }
};

const deleteShim = (commandName) => {
    if (!isWindows()) return;
    for (const target of [shimPath(commandName), shPath(commandName), legacyPath(commandName)]) {
        try {
            if (fs.existsSync(target)) fs.unlinkSync(target);
        } catch (err) {
            console.log("failed to delete the launcher", err);
        }
    }
};

// Brings launchers saved by older versions over to the new mechanism on activate, so nobody
// has to re-create their commands. Names holding a space were never callable from a shell and
// commands with no launcher on disk are left alone.
const refreshShims = (allcommands) => {
    if (!isWindows()) return;

    for (const command of allcommands || []) {
        const name = command && command.name;
        if (!name || name.toString().includes(" ")) continue;
        try {
            const onDisk = [legacyPath(name), shimPath(name), shPath(name)].some((target) =>
                fs.existsSync(target)
            );
            if (onDisk) writeLaunchers(command);
        } catch (err) {
            console.log("failed to refresh the launcher", err);
        }
    }
};

// Puts `pt` on PATH next to the command launchers. Rewritten on every start, since the editor
// and extension paths it points at change with each update. A `pt` installed from npm wins:
// ours is removed, so the two never fight over which one PATH finds first.
const installCli = (execPath, script, lookup = findOnPath) => {
    if (!isWindows()) return;
    try {
        if (lookup("pt").some((found) => !isOurLauncher(found, launcherDir()))) {
            for (const target of [shimPath("pt"), shPath("pt")]) {
                if (fs.existsSync(target)) fs.unlinkSync(target);
            }
            return;
        }
        const scripts = cliScripts(execPath, script);
        writeIfChanged(shimPath("pt"), scripts.cmd);
        writeIfChanged(shPath("pt"), scripts.sh);
    } catch (err) {
        console.log("failed to install the pt launcher", err);
    }
};

module.exports = {
    createShim, deleteShim, refreshShims, installCli, shimPath, shPath, legacyPath, launcherDir
}
