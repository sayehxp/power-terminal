//@ts-check
// `pt` creates, deletes and lists commands from any terminal, so a shell or an AI CLI like
// Claude Code can make one without opening the editor. It edits the same shared db.json and
// writes the same launchers the editor does, so every editor sees the change straight away.
const fs = require("fs");
const path = require("path");
const { sharedDir, readJSON, writeJSON } = require("./utilites/storage");
const { validateName } = require("./utilites/names");
const { createShim, deleteShim, launcherDir } = require("./utilites/shim");

const USAGE = [
    `usage:`,
    `  pt add <name> <command> [command...]   save a command, one quoted argument per entry`,
    `  pt rm <name>                           delete a command`,
    `  pt ls                                  list saved commands`,
    ``,
    `examples:`,
    `  pt add dev "npm run dev"`,
    `  pt add stack "npm run api" "npm run web"`,
    `  pt add co "git checkout -b $1 origin/$2"`,
].join("\n");

const defaults = () => ({
    dbFile: path.join(sharedDir(), "db.json"),
    dir: launcherDir(),
    validate: validateName,
    create: createShim,
    remove: deleteShim,
});

const load = (dbFile) => readJSON(dbFile) || { allcommands: [] };

const save = (dbFile, jsonDB) => {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    writeJSON(dbFile, jsonDB);
};

const add = ([name, ...entries], { dbFile, dir, validate, create }) => {
    const commandName = (name || "").trim();
    const commands = entries.map((entry) => entry.trim()).filter(Boolean);
    if (!commandName || !commands.length) return { code: 1, out: USAGE };

    const jsonDB = load(dbFile);
    const allcommands = jsonDB.allcommands || [];
    // the name becomes a launcher on PATH, so it must not hide a real program
    const problem = validate(commandName, { allcommands, launcherDir: dir });
    if (problem) return { code: 1, out: problem };

    const command = {
        id: allcommands[allcommands.length - 1]?.id + 1 || 65,
        name: commandName,
        commands,
    };
    save(dbFile, { ...jsonDB, allcommands: [...allcommands, command] });
    create(command);

    const lines = [`${commandName} saved`];
    if (commands.length > 1) {
        lines.push(`it opens one terminal per entry, so it only runs while VS Code, Cursor or Antigravity is open`);
    }
    return { code: 0, out: lines.join("\n") };
};

const remove = ([name], { dbFile, remove: deleteLaunchers }) => {
    const commandName = (name || "").trim();
    if (!commandName) return { code: 1, out: USAGE };

    const jsonDB = load(dbFile);
    const allcommands = jsonDB.allcommands || [];
    if (!allcommands.some((command) => command.name == commandName)) {
        return { code: 1, out: `Command "${commandName}" not found` };
    }
    save(dbFile, { ...jsonDB, allcommands: allcommands.filter((command) => command.name != commandName) });
    deleteLaunchers(commandName);
    return { code: 0, out: `${commandName} deleted` };
};

const list = ({ dbFile }) => {
    const allcommands = load(dbFile).allcommands || [];
    if (!allcommands.length) return { code: 0, out: `no commands saved yet, add one with: pt add <name> <command>` };
    const width = Math.max(...allcommands.map((command) => String(command.name).length));
    const lines = [];
    for (const command of allcommands) {
        (command.commands || []).forEach((entry, i) => {
            lines.push(`${(i ? "" : String(command.name)).padEnd(width)}  ${entry}`);
        });
    }
    return { code: 0, out: lines.join("\n") };
};

// Returns what to print and the exit code instead of printing, so the tests can check both.
const run = (argv, options = {}) => {
    const deps = { ...defaults(), ...options };
    const [action, ...rest] = argv;
    switch (action) {
        case "add":
            return add(rest, deps);
        case "rm":
        case "delete":
            return remove(rest, deps);
        case "ls":
        case "list":
            return list(deps);
        case undefined:
        case "help":
        case "-h":
        case "--help":
            return { code: 0, out: USAGE };
        default:
            return { code: 1, out: `unknown action "${action}"\n\n${USAGE}` };
    }
};

module.exports = {
    run
}
