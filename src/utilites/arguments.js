//@ts-check

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

const hasPlaceholder = (command) => PLACEHOLDER.test(command || "");

// Builds the lines that actually reach the terminal.
// `$*` / `$@` stand for the whole argument string, `$1`..`$9` for a single argument.
// With no placeholder anywhere, the arguments are appended to the last entry, so typing
// `pull main` on a command holding `git pull origin` runs `git pull origin main`.
const applyArgs = (commands, args) => {
    const rest = (args || "").trim();
    const argv = rest ? rest.split(/\s+/) : [];

    if (commands.some(hasPlaceholder)) {
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

module.exports = {
    matchCommandLine, applyArgs, hasPlaceholder
}
