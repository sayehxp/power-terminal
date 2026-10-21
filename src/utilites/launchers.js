//@ts-check
// Builds the text of the launchers dropped on PATH. Nothing in here touches the disk or
// VS Code, so the tests can check every script without either.
const { hasPlaceholder } = require("./arguments");

const PLACEHOLDERS = /\$(\*|@|[1-9])/g;

// `$1`..`$9` and `$*` / `$@` are the extension's own placeholder spelling; batch already has
// the same idea as `%1`..`%9` and `%*`, so the translation is one for one. A command with no
// placeholder gets `%*` appended, which is what makes `dev --port 3000` work.
const cmdWithArgs = (command) => {
    if (hasPlaceholder(command)) {
        return command.replace(PLACEHOLDERS, (_, token) =>
            token === "*" || token === "@" ? "%*" : `%${token}`
        );
    }
    return `${command} %*`;
};

// Same idea for sh: `"$@"` hands every argument over with its quoting intact, like `%*` does.
const shWithArgs = (command) => {
    if (hasPlaceholder(command)) {
        return command.replace(PLACEHOLDERS, (_, token) =>
            token === "*" || token === "@" ? `"$@"` : `$${token}`
        );
    }
    return `${command} "$@"`;
};

const shQuote = (value) => `'${value.toString().replace(/'/g, `'\\''`)}'`;

// Git Bash reads C:/x fine, but a backslash inside the script would need escaping everywhere.
const shPath = (value) => value.toString().replace(/\\/g, "/");

// npm, yarn and friends are themselves .cmd files, and running one without `call` never returns,
// so in `npm i && npm start` the second half would be lost. `call` also expands `%` a second
// time and doubles `^`, which would mangle typed arguments like `--format=%an`. The last part
// of the line has nothing after it to return to, and it is where the arguments go, so every
// part gets `call` except that one.
const callChain = (line) => {
    let out = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === "^" && !quoted) {
            out += char + (line[i + 1] || "");
            i++;
            continue;
        }
        if (char === '"') quoted = !quoted;
        const operator = quoted ? null : ["&&", "||", "&"].find((op) => line.startsWith(op, i));
        if (!operator) {
            out += char;
            continue;
        }
        out = `${out.trimEnd()} ${operator} `;
        i += operator.length - 1;
        while (line[i + 1] === " ") i++;
        out += "\u0000";
    }
    const parts = out.split("\u0000");
    return parts.map((part, i) => (i < parts.length - 1 ? `call ${part}` : part)).join("");
};

// A single command needs nothing from VS Code: you are already standing in a terminal, so the
// launcher just runs it.
const cmdDirectScript = (command) => [
    `@echo off`,
    callChain(cmdWithArgs(command)),
    ``,
].join("\r\n");

// Several commands mean one new terminal each, which only VS Code can do. The launcher leaves
// a request behind and the extension picks it up; no focus, no keystrokes, no keyboard layout.
// Writing to .tmp and moving into place keeps the watcher from reading a half-written file.
// The arguments are stored while delayed expansion is off and printed with it on, so `&`, `|`,
// `>` and `!` inside them are written as text instead of being run.
const cmdRequestScript = (commandName, dir) => [
    `@echo off`,
    `setlocal DisableDelayedExpansion`,
    `set PT_ARGS=%*`,
    `if not exist "${dir}" mkdir "${dir}" >nul 2>&1`,
    // the separator is written by hand; a path.join here would turn %RANDOM% into a file name
    `set "PT_REQ=${dir.replace(/[\\/]+$/, "")}\\%RANDOM%-%RANDOM%-%TIME:~9,2%.req"`,
    `setlocal EnableDelayedExpansion`,
    `> "!PT_REQ!.tmp" (echo(${commandName}& echo(!PT_ARGS!)`,
    `move /y "!PT_REQ!.tmp" "!PT_REQ!" >nul`,
    ``,
].join("\r\n");

const shDirectScript = (command) => [
    `#!/bin/sh`,
    shWithArgs(command),
    ``,
].join("\n");

const shRequestScript = (commandName, dir) => [
    `#!/bin/sh`,
    `dir=${shQuote(shPath(dir))}`,
    `mkdir -p "$dir"`,
    `req="$dir/$$-$(date +%s%N).req"`,
    `printf '%s\\n%s\\n' ${shQuote(commandName)} "$*" > "$req.tmp" && mv -f "$req.tmp" "$req"`,
    ``,
].join("\n");

// `cmd` serves cmd and PowerShell, `sh` serves Git Bash and anything that shells out through it,
// like `! name` in Claude Code.
const launcherScripts = (command, dir) => {
    const commands = (command && command.commands) || [];
    if (commands.length === 1) {
        return { cmd: cmdDirectScript(commands[0]), sh: shDirectScript(commands[0]) };
    }
    return { cmd: cmdRequestScript(command.name, dir), sh: shRequestScript(command.name, dir) };
};

module.exports = {
    cmdWithArgs, shWithArgs, launcherScripts
}
