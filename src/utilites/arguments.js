//@ts-check

// One Arabic word gets typed several ways: ابدأ, ابدا and إبدأ, with or without tashkeel, ة or
// ه at the end, ى or ي. Names are compared in this folded form so every spelling finds the
// same command. Case is folded too, as names always were.
const nameKey = (name) =>
    (name || "")
        .toString()
        .trim()
        .normalize("NFC")
        .replace(/[ً-ٰٟـ]/g, "")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .toLowerCase();

// A typed line can be more than a bare command name: `pull main` has to resolve to the
// saved command `pull` with `main` handed over as an argument. Names created by this
// extension never contain spaces, but commands saved by older versions do, so the longest
// saved name that prefixes the line wins. The comparison is word by word on the folded
// form, since folding can change a name's length; the arguments are cut from the line as
// typed.
const matchCommandLine = (allcommands, line) => {
    const input = (line || "").trim();
    let match = null;

    for (const command of allcommands) {
        const name = (command.name || "").toString().trim();
        if (!name) continue;
        const words = name.split(/\s+/).length;
        const head = input.match(new RegExp(`^(\\S+(\\s+|$)){${words}}`));
        if (!head || nameKey(head[0].replace(/\s+/g, " ")) !== nameKey(name.replace(/\s+/g, " "))) continue;
        if (!match || name.length > match.name.length) {
            match = { command, name, typed: head[0].length };
        }
    }

    if (!match) return null;

    return {
        targetCommand: match.command,
        args: input.slice(match.typed).trim(),
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
    matchCommandLine, applyArgs, hasPlaceholder, nameKey
}
