//@ts-check
// With no editor open, a multi-entry command runs all of its entries at once in the terminal it
// was typed in, the way `concurrently` does: every line of output is tagged with the number of
// the entry it came from, and Ctrl+C stops them all, since every process attached to a console
// receives it.
const { spawn, execFile } = require("child_process");

// cyan, magenta, yellow, green, blue, red: the tags stay apart in the scrolling output
const COLORS = [36, 35, 33, 32, 34, 31];

// cmd drops exactly the first and last quote after `/s /c`, so the entry runs as if typed at a
// cmd prompt: `&&`, `|`, `>` and quotes inside it all work.
const entryCommandLine = (entry) => `/d /s /c "${entry}"`;

const tagFor = (i, color) => (color ? `\x1b[${COLORS[i % COLORS.length]}m[${i + 1}]\x1b[0m ` : `[${i + 1}] `);

// Output arrives in chunks that cut lines anywhere. Whole lines get the tag right away, a cut-off
// end waits for the rest of its line, or for the end of the stream.
const lineTagger = (tag, write) => {
    let rest = "";
    return {
        push(chunk) {
            const lines = (rest + chunk).split("\n");
            rest = lines.pop() || "";
            for (const line of lines) write(`${tag}${line}\n`);
        },
        end() {
            if (rest) write(`${tag}${rest}\n`);
            rest = "";
        },
    };
};

// The `pt` running this may be Code.exe in Node mode; the entries must not inherit that, or an
// editor started from one would start Node instead. Output goes through a pipe, so tools would
// turn their colours off; FORCE_COLOR keeps them when the terminal shows colour anyway.
const spawnEntry = (entry, color) => {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    if (color) env.FORCE_COLOR = "1";
    return spawn(process.env.ComSpec || "cmd.exe", [entryCommandLine(entry)], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        windowsVerbatimArguments: true,
    });
};

// Kills an entry together with what it started: npm runs node, which may run more.
const killTree = (child) => {
    if (child.exitCode === null && child.pid) execFile("taskkill", ["/pid", String(child.pid), "/T", "/F"], () => { });
};

// Resolves with the exit code once every entry has ended: the first failing entry's code, or 0.
const runTogether = (name, entries, { stdout = process.stdout, stderr = process.stderr, start = spawnEntry } = {}) =>
    new Promise((resolve) => {
        const color = Boolean(stdout.isTTY);
        stdout.write(`${name}: running ${entries.length} entries here, Ctrl+C stops them all\n`);
        entries.forEach((entry, i) => stdout.write(`${tagFor(i, color)}${entry}\n`));

        let running = entries.length;
        let code = 0;
        const children = entries.map((entry, i) => {
            const tag = tagFor(i, color);
            const out = lineTagger(tag, (text) => stdout.write(text));
            const err = lineTagger(tag, (text) => stderr.write(text));
            const child = start(entry, color);
            child.stdout && child.stdout.on("data", (chunk) => out.push(chunk.toString()));
            child.stderr && child.stderr.on("data", (chunk) => err.push(chunk.toString()));
            let done = false;
            const finish = (exit) => {
                if (done) return;
                done = true;
                out.end();
                err.end();
                stdout.write(`${tag}exited with code ${exit}\n`);
                if (exit && !code) code = exit;
                if (--running === 0) {
                    process.removeListener("SIGINT", onInterrupt);
                    resolve(code);
                }
            };
            child.on("error", (error) => {
                stderr.write(`${tag}${error.message}\n`);
                finish(1);
            });
            child.on("close", (exit) => finish(exit === null ? 1 : exit));
            return child;
        });

        // The entries get Ctrl+C from the console themselves, so the first one only keeps `pt`
        // alive to print how they ended. A second Ctrl+C kills whatever is still running.
        let interrupts = 0;
        const onInterrupt = () => {
            if (++interrupts > 1) children.forEach(killTree);
        };
        process.on("SIGINT", onInterrupt);
    });

module.exports = {
    runTogether, lineTagger, entryCommandLine
}
