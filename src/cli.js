//@ts-check
// `pt` creates, deletes and lists commands from any terminal, so a shell or an AI CLI like
// Claude Code can make one without opening the editor. It edits the same shared db.json and
// writes the same launchers the editor does, so every editor sees the change straight away.
const fs = require("fs");
const path = require("path");
const { sharedDir, readJSON, writeJSON } = require("./utilites/storage");
const { validateName, powershellHint } = require("./utilites/names");
const { createShim, deleteShim, launcherDir } = require("./utilites/shim");
const { runTogether } = require("./utilites/together");
const { nameKey, matchCommandLine, applyArgs } = require("./utilites/arguments");
const { reclaimRequest } = require("./utilites/requests");

const USAGE = [
    `usage:`,
    `  pt add <name> <command/s>    save a command, one quoted argument per entry`,
    `  pt remove <name>             delete a command`,
    `  pt list                      list saved commands`,
].join("\n");

const defaults = () => ({
    dbFile: path.join(sharedDir(), "db.json"),
    dir: launcherDir(),
    validate: validateName,
    create: createShim,
    remove: deleteShim,
    take: reclaimRequest,
    together: runTogether,
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
    const hint = powershellHint(commandName);
    if (hint) lines.push(hint);
    return { code: 0, out: lines.join("\n") };
};

const remove = ([name], { dbFile, remove: deleteLaunchers }) => {
    const commandName = (name || "").trim();
    if (!commandName) return { code: 1, out: USAGE };

    const jsonDB = load(dbFile);
    const allcommands = jsonDB.allcommands || [];
    // any spelling of the name finds it (ابدا for ابدأ); the launcher goes by the saved one
    const found = allcommands.find((command) => nameKey(command.name) === nameKey(commandName));
    if (!found) {
        return { code: 1, out: `Command "${commandName}" not found` };
    }
    save(dbFile, { ...jsonDB, allcommands: allcommands.filter((command) => command !== found) });
    deleteLaunchers(found.name);
    return { code: 0, out: `${found.name} deleted` };
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

// Not for people: a multi-entry launcher calls this with the request it just left. When an open
// editor took the request, the editor opens the terminals and there is nothing to do. Otherwise
// the launcher was typed with no editor around, so all the entries run together right here.
// That keeps going after this returns: `pending` settles with their exit code.
const request = ([file], { dbFile, take, together }) => {
    const line = file ? take(file) : null;
    if (!line) return { code: 0, out: "" };

    const match = matchCommandLine(load(dbFile).allcommands || [], line);
    if (!match) return { code: 1, out: `Command "${line.split(/\s+/)[0]}" not found` };

    const { name, commands } = match.targetCommand;
    return { code: 0, out: "", pending: together(String(name), applyArgs(commands, match.args)) };
};

// Returns what to print and the exit code instead of printing, so the tests can check both.
// Actions can be typed in Arabic too, folded like names so أضف and اضف are the same.
const run = (argv, options = {}) => {
    const deps = { ...defaults(), ...options };
    const [action, ...rest] = argv;
    switch (nameKey(action)) {
        case "add":
        case "ضيف":
        case "اضف":
            return add(rest, deps);
        case "remove":
        case "delete":
        // the 1.6.0 names, kept so scripts written for them still work
        case "rm":
        case "امسح":
        case "احذف":
            return remove(rest, deps);
        case "list":
        case "ls":
        case "اعرض":
        case "قائمه":
            return list(deps);
        case "__request":
            return request(rest, deps);
        case "":
        case "help":
        case "مساعده":
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
