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

// cmd reads a batch file, and writes files, in the console's code page (437, 720...), so Arabic
// or any other non-ASCII text arrives as mojibake or `?`. Switching to UTF-8 (65001) fixes both.
// The old code page is read back from `chcp` (`%%~n` drops the trailing dot some languages
// print) and restored at the end, so the console the user typed in is left as it was.
const UTF8_ON = [
    `for /f "tokens=*" %%a in ('chcp') do for %%b in (%%a) do set "PT_CP=%%~nb"`,
    `chcp 65001 >nul`,
];

const isAscii = (text) => /^[\x00-\x7f]*$/.test(text);

// A single command needs nothing from VS Code: you are already standing in a terminal, so the
// launcher just runs it. ASCII commands stay a bare one-liner. The others restore the code page
// and keep the exit code on one line, which cmd expands before running, so the variables can be
// cleared without leaking into the caller's session. A last part that is itself a .cmd (npm)
// never returns, and then the console simply stays on UTF-8.
const cmdDirectScript = (command) => {
    if (isAscii(command)) {
        return [`@echo off`, callChain(cmdWithArgs(command)), ``].join("\r\n");
    }
    return [
        `@echo off`,
        ...UTF8_ON,
        callChain(cmdWithArgs(command)),
        `set PT_EXIT=%errorlevel%`,
        `chcp %PT_CP% >nul & set "PT_CP=" & set "PT_EXIT=" & exit /b %PT_EXIT%`,
        ``,
    ].join("\r\n");
};

// Several commands mean one new terminal each, which only VS Code can do. The launcher leaves
// a request behind and the extension picks it up; no focus, no keystrokes, no keyboard layout.
// Writing to .tmp and moving into place keeps the watcher from reading a half-written file.
// The arguments are stored while delayed expansion is off and printed with it on, so `&`, `|`,
// `>` and `!` inside them are written as text instead of being run. The typed arguments are
// unknown ahead of time, so this one always writes in UTF-8.
const cmdRequestScript = (commandName, dir) => [
    `@echo off`,
    `setlocal DisableDelayedExpansion`,
    ...UTF8_ON,
    `set PT_ARGS=%*`,
    `if not exist "${dir}" mkdir "${dir}" >nul 2>&1`,
    // the separator is written by hand; a path.join here would turn %RANDOM% into a file name
    `set "PT_REQ=${dir.replace(/[\\/]+$/, "")}\\%RANDOM%-%RANDOM%-%TIME:~9,2%.req"`,
    `setlocal EnableDelayedExpansion`,
    `> "!PT_REQ!.tmp" (echo(${commandName}& echo(!PT_ARGS!)`,
    `move /y "!PT_REQ!.tmp" "!PT_REQ!" >nul`,
    `chcp !PT_CP! >nul`,
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

// The `pt` CLI runs on the editor's own executable instead of needing Node installed:
// ELECTRON_RUN_AS_NODE turns Code.exe (or Cursor.exe...) into plain Node, which is how VS Code's
// own `code` command works.
const cliScripts = (execPath, script) => ({
    cmd: [
        `@echo off`,
        `setlocal`,
        `set ELECTRON_RUN_AS_NODE=1`,
        `"${execPath}" "${script}" %*`,
        ``,
    ].join("\r\n"),
    sh: [
        `#!/bin/sh`,
        `ELECTRON_RUN_AS_NODE=1 exec ${shQuote(shPath(execPath))} ${shQuote(shPath(script))} "$@"`,
        ``,
    ].join("\n"),
});

module.exports = {
    cmdWithArgs, shWithArgs, launcherScripts, cliScripts
}
