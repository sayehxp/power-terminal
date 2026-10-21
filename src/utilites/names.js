//@ts-check
const path = require("path");
const { execFileSync } = require("child_process");

// A launcher lands on PATH, so a careless name can hide a real program in every shell:
// a command called `git` would turn every `git` into the saved command.
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

// Shell built-ins never show up in `where`, but a launcher named after one still gets in the
// way in the shells that do look at PATH for it. The tools at the end are blocked even when
// they are not installed yet.
const RESERVED = new Set([
    // cmd
    "assoc", "break", "call", "cd", "chdir", "cls", "color", "copy", "date", "del", "dir", "echo",
    "endlocal", "erase", "exit", "for", "ftype", "goto", "if", "md", "mkdir", "mklink", "move",
    "path", "pause", "popd", "prompt", "pushd", "rd", "rem", "ren", "rename", "rmdir", "set",
    "setlocal", "shift", "start", "time", "title", "type", "ver", "verify", "vol",
    // sh
    "alias", "bg", "command", "eval", "exec", "export", "fg", "hash", "history", "jobs", "kill",
    "ls", "pwd", "read", "return", "source", "test", "trap", "ulimit", "umask", "unalias",
    "unset", "wait",
    // tools
    "git", "npm", "npx", "node", "yarn", "pnpm", "code", "python", "pip", "docker", "wsl",
]);

// Launchers this extension wrote itself are not a conflict: re-creating a deleted command
// must still work. Real programs can live in the same folder (WindowsApps holds winget and
// python aliases as .exe), so only the launcher file types count as ours.
const isOurLauncher = (found, launcherDir) => {
    if (path.dirname(found).toLowerCase() !== launcherDir.toLowerCase()) return false;
    return ["", ".cmd", ".vbs"].includes(path.extname(found).toLowerCase());
};

const findOnPath = (name) => {
    try {
        return execFileSync("where", [name], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    } catch (err) {
        // `where` exits with 1 when nothing matches
        return [];
    }
};

// Returns the reason a name cannot be used, or null when it is fine.
const validateName = (name, { allcommands = [], launcherDir = "", lookup = findOnPath } = {}) => {
    const value = (name || "").trim();
    if (!value) return "Command name is empty";
    if (!NAME_PATTERN.test(value)) {
        return `"${value}" can only use letters, numbers, "-" and "_", and must start with a letter or number`;
    }
    if (RESERVED.has(value.toLowerCase())) {
        return `"${value}" is a built-in shell command or a common tool, choose another name`;
    }
    if (allcommands.some((command) => (command.name || "").toString().toLowerCase() === value.toLowerCase())) {
        return `"${value}" already exists`;
    }
    const clash = lookup(value).find((found) => !isOurLauncher(found, launcherDir));
    if (clash) {
        return `"${value}" would hide ${clash}, choose another name`;
    }
    return null;
};

module.exports = {
    validateName
}
