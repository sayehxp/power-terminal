//@ts-check
const fs = require("fs");
const Os = require("os");
const path = require("path");

// A typed line can be more than a bare command name: `pull main` has to resolve to the
// saved command `pull` with `main` handed over as an argument. Names created by this
// extension never contain spaces, but commands saved by older versions do, so the longest
// saved name that prefixes the line wins.
const matchCommandLine = (allcommands, line) => {
    const input = (line || "").trim();
    let match = null;

    for (const command of allcommands) {
        const name = (command.name || "").toString().trim();
        if (!name) continue;
        if (input !== name && !input.startsWith(name + " ")) continue;
        if (!match || name.length > match.name.length) {
            match = { command, name };
        }
    }

    if (!match) return null;

    return {
        targetCommand: match.command,
        args: input.slice(match.name.length).trim(),
    };
};

const PLACEHOLDER = /\$(\*|@|[1-9])/;

// Builds the lines that actually reach the terminal.
// `$*` / `$@` stand for the whole argument string, `$1`..`$9` for a single argument.
// With no placeholder anywhere, the arguments are appended to the last entry, so typing
// `pull main` on a command holding `git pull origin` runs `git pull origin main`.
const applyArgs = (commands, args) => {
    const rest = (args || "").trim();
    const argv = rest ? rest.split(/\s+/) : [];

    if (commands.some((command) => PLACEHOLDER.test(command))) {
        return commands.map((command) =>
            command
                .replace(/\$(\*|@|[1-9])/g, (_, token) =>
                    token === "*" || token === "@" ? rest : argv[Number(token) - 1] || ""
                )
                .trim()
        );
    }

    if (!rest) return [...commands];

    return commands.map((command, i) =>
        i === commands.length - 1 ? `${command} ${rest}` : command
    );
};

const ARGS_MAX_AGE_MS = 5000;

const shortcutArgsPath = (commandId) =>
    path.join(Os.tmpdir(), `powerterminal-args-${commandId}.txt`);

// The .vbs launcher drops whatever was typed after the command name here before it fires the
// keyboard shortcut, which is how arguments survive the trip through the terminal. A file
// older than a few seconds is a leftover (the shortcut was pressed by hand) and is ignored.
const takeShortcutArgs = (commandId) => {
    const argsPath = shortcutArgsPath(commandId);
    try {
        const stat = fs.statSync(argsPath);
        const args = fs.readFileSync(argsPath, "utf8").trim();
        fs.unlinkSync(argsPath);
        if (Date.now() - stat.mtimeMs > ARGS_MAX_AGE_MS) return "";
        return args;
    } catch (err) {
        return "";
    }
};

module.exports = {
    matchCommandLine, applyArgs, shortcutArgsPath, takeShortcutArgs
}
