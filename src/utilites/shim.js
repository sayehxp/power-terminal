//@ts-check
const Os = require("os");
const fs = require("fs");
const path = require("path");
const { hasPlaceholder } = require("./arguments");
const { requestsDir } = require("./requests");

const appDataPath = path.join(Os.homedir(), "AppData", "Local", "Microsoft", "WindowsApps");

// Launchers are a Windows-only convenience: WindowsApps is on PATH out of the box and
// .CMD is in PATHEXT, so a file dropped there is callable by name from any shell.
const isWindows = () => Os.platform() === "win32";

// WindowsApps is on PATH by default; older Windows versions fall back to the home dir
const launcherDir = () => (fs.existsSync(appDataPath) ? appDataPath : Os.homedir());

const shimPath = (commandName) => path.join(launcherDir(), commandName.toString() + ".cmd");

// Launchers written before 1.4.0 fired a keyboard shortcut at whatever window happened to
// have focus. They are deleted on sight, and would shadow the .cmd anyway: .VBS comes
// before .CMD in the default PATHEXT.
const legacyPath = (commandName) => path.join(launcherDir(), commandName.toString() + ".vbs");

const batchQuote = (value) => value.toString().replace(/%/g, "%%").replace(/\^/g, "^^");

// `$1`..`$9` and `$*` / `$@` are the extension's own placeholder spelling; batch already has
// the same idea as `%1`..`%9` and `%*`, so the translation is one for one. A command with no
// placeholder gets `%*` appended, which is what makes `dev --port 3000` work.
const withArgs = (command) => {
    if (hasPlaceholder(command)) {
        return command.replace(/\$(\*|@|[1-9])/g, (_, token) =>
            token === "*" || token === "@" ? "%*" : `%${token}`
        );
    }
    return `${command} %*`;
};

// A single command needs nothing from VS Code: you are already standing in a terminal, so the
// launcher just runs it. `call` matters because npm, yarn and friends are themselves .cmd
// files, and without it they never return to this script.
const directScript = (command) => [
    `@echo off`,
    `call ${withArgs(command)}`,
    ``,
].join("\r\n");

// Several commands mean one new terminal each, which only VS Code can do. The launcher leaves
// a request behind and the extension picks it up; no focus, no keystrokes, no keyboard layout.
// Writing to .tmp and moving into place keeps the watcher from reading a half-written file.
const requestScript = (commandName, dir) => [
    `@echo off`,
    `setlocal`,
    `if not exist "${dir}" mkdir "${dir}" >nul 2>&1`,
    // path.join supplies the separator; a backslash written inline here would be eaten as an escape
    `set "PT_REQ=${path.join(dir, "%RANDOM%-%RANDOM%-%TIME:~9,2%.req")}"`,
    `> "%PT_REQ%.tmp" echo ${batchQuote(commandName)}`,
    `if "%*"=="" (>> "%PT_REQ%.tmp" echo.) else (>> "%PT_REQ%.tmp" echo %*)`,
    `move /y "%PT_REQ%.tmp" "%PT_REQ%" >nul`,
    ``,
].join("\r\n");

const shimScript = (command) => {
    const commands = (command && command.commands) || [];
    if (commands.length === 1) return directScript(commands[0]);
    return requestScript(command.name, requestsDir());
};

const createShim = (command) => {
    if (!isWindows()) return;
    try {
        fs.writeFileSync(shimPath(command.name), shimScript(command));
        // an old .vbs under the same name would win the PATHEXT race
        if (fs.existsSync(legacyPath(command.name))) fs.unlinkSync(legacyPath(command.name));
    } catch (err) {
        console.log("failed to write the launcher", err);
    }
};

const deleteShim = (commandName) => {
    if (!isWindows()) return;
    for (const target of [shimPath(commandName), legacyPath(commandName)]) {
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
            const legacy = legacyPath(name);
            const target = shimPath(name);
            const hadLegacy = fs.existsSync(legacy);
            if (!hadLegacy && !fs.existsSync(target)) continue;

            const wanted = shimScript(command);
            if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== wanted) {
                fs.writeFileSync(target, wanted);
            }
            if (hadLegacy) fs.unlinkSync(legacy);
        } catch (err) {
            console.log("failed to refresh the launcher", err);
        }
    }
};

module.exports = {
    createShim, deleteShim, refreshShims, shimPath, legacyPath
}
