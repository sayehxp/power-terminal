//@ts-check
const fs = require("fs");
const Os = require("os");
const path = require("path");
const { getDB, openTerminal } = require("./functions");
const { sharedDir } = require("./storage");
const { matchCommandLine, applyArgs } = require("./arguments");

// A request older than this was left behind while VS Code was closed. Running it now would
// fire a command the user typed minutes ago, so it is swept instead.
const MAX_AGE_MS = 15000;

let dir = path.join(Os.tmpdir(), "powerterminal-requests");

// Launchers for multi-command entries drop a file here instead of pressing keys at whatever
// window has focus. The directory has to be somewhere both sides agree on before any launcher
// is written, so activate() sets it first thing. It is shared by every editor, so whichever
// one is open picks the request up.
const requestsDir = () => dir;

const useSharedStorage = () => {
    try {
        dir = path.join(sharedDir(), "requests");
    } catch (err) {
        console.log("falling back to the temp dir for launcher requests", err);
    }
    try {
        fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
        console.log("failed to create the launcher request dir", err);
    }
    return dir;
};

// Every open window of every editor watches the same directory, so both see the file. The rename is atomic:
// whoever wins gets the request, the loser gets ENOENT and does nothing.
const claim = (name) => {
    const source = path.join(dir, name);
    const claimed = `${source}.taken`;
    try {
        const stat = fs.statSync(source);
        fs.renameSync(source, claimed);
        return { claimed, fresh: Date.now() - stat.mtimeMs <= MAX_AGE_MS };
    } catch (err) {
        return null;
    }
};

// First line is the command name, second line is whatever was typed after it.
const runRequest = async (name) => {
    const taken = claim(name);
    if (!taken) return;

    let line = "";
    try {
        const raw = fs.readFileSync(taken.claimed, "utf8").split(/\r?\n/);
        line = `${(raw[0] || "").trim()} ${(raw[1] || "").trim()}`.trim();
    } catch (err) {
        console.log("failed to read a launcher request", err);
    }
    try {
        fs.unlinkSync(taken.claimed);
    } catch (err) { }

    if (!taken.fresh || !line) return;

    const jsonDB = await getDB();
    const match = matchCommandLine(jsonDB.allcommands || [], line);
    if (!match) return;

    openTerminal(applyArgs(match.targetCommand.commands, match.args), match.targetCommand.name);
};

const sweep = () => {
    try {
        for (const name of fs.readdirSync(dir)) {
            if (!name.endsWith(".req") && !name.endsWith(".taken")) continue;
            try {
                const target = path.join(dir, name);
                if (Date.now() - fs.statSync(target).mtimeMs > MAX_AGE_MS) fs.unlinkSync(target);
            } catch (err) { }
        }
    } catch (err) { }
};

// Returns a disposable so the watcher dies with the extension.
const watchRequests = () => {
    sweep();
    try {
        const watcher = fs.watch(dir, (event, name) => {
            if (name && name.toString().endsWith(".req")) runRequest(name.toString());
        });
        watcher.on("error", (err) => console.log("launcher request watcher stopped", err));
        return { dispose: () => watcher.close() };
    } catch (err) {
        console.log("failed to watch for launcher requests", err);
        return { dispose: () => { } };
    }
};

module.exports = {
    requestsDir, useSharedStorage, watchRequests
}
