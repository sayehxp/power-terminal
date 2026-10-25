const test = require("node:test");
const assert = require("node:assert");
const { validateName, powershellHint } = require("../src/utilites/names");

const launcherDir = "C:\\Users\\me\\AppData\\Local\\Microsoft\\WindowsApps";
const nothingOnPath = () => [];

test("accepts a plain name", () => {
    assert.strictEqual(validateName("dev-server_2", { launcherDir, lookup: nothingOnPath }), null);
});

test("rejects empty names, spaces and shell characters", () => {
    for (const name of ["", "   ", "my dev", "a&b", "a@b", "x=", "(x)", "dev.cmd", "ابدأ الآن", "ابدأ!"]) {
        assert.ok(validateName(name, { launcherDir, lookup: nothingOnPath }), name);
    }
});

test("accepts +, - and _ anywhere, alone or mixed", () => {
    for (const name of ["+", "-", "++", "c++", "+x", "x+", "-x", "_x", "+🚀", "ابدأ+", "+-"]) {
        assert.strictEqual(validateName(name, { launcherDir, lookup: nothingOnPath }), null, name);
    }
});

test("powershellHint: only names PowerShell reads as math need &", () => {
    for (const name of ["+", "++", "+x", "-", "--", "-1", "-🚀", "-ابدأ", "1+", "12-x"]) {
        assert.strictEqual(powershellHint(name), `in PowerShell, run it as: & '${name}'`, name);
    }
    for (const name of ["dev", "c++", "x+", "-x", "-dev", "1a+", "🚀+", "ابدأ+", "_x"]) {
        assert.strictEqual(powershellHint(name), null, name);
    }
});

test("accepts names in other languages, tashkeel included", () => {
    for (const name of ["ابدأ", "شغل-السيرفر", "رفع_2", "ابْدَأْ", "démarrer", "ä"]) {
        assert.strictEqual(validateName(name, { launcherDir, lookup: nothingOnPath }), null, name);
    }
});

test("accepts emoji names: single, mixed, skin tones, joined, flags, keycaps", () => {
    for (const name of ["🚀", "deploy🔥", "🚀-prod", "ابدأ🚀", "👍🏽", "👨‍💻", "🇪🇬", "1️⃣", "❤️", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"]) {
        assert.strictEqual(validateName(name, { launcherDir, lookup: nothingOnPath }), null, name);
    }
});

test("still rejects symbols that are not emoji", () => {
    for (const name of ["🚀 now", "🚀!", "$🚀", "🚀.cmd", "#️⃣"]) {
        assert.ok(validateName(name, { launcherDir, lookup: nothingOnPath }), name);
    }
});

test("rejects an emoji saved with or without its variation selector", () => {
    const allcommands = [{ name: "❤️", commands: ["echo love"] }];
    assert.strictEqual(
        validateName("❤", { allcommands, launcherDir, lookup: nothingOnPath }),
        `"❤" already exists as "❤️"`
    );
});

test("rejects another spelling of a saved Arabic name", () => {
    const allcommands = [{ name: "ابدأ", commands: ["npm start"] }];
    for (const name of ["ابدا", "إبدأ", "ابْدَأْ"]) {
        assert.strictEqual(
            validateName(name, { allcommands, launcherDir, lookup: nothingOnPath }),
            `"${name}" already exists as "ابدأ"`
        );
    }
});

test("rejects shell built-ins and common tools in any case", () => {
    for (const name of ["cd", "DIR", "git", "Npm", "export"]) {
        assert.match(validateName(name, { launcherDir, lookup: nothingOnPath }), /built-in/);
    }
});

test("rejects a name that is already saved", () => {
    const allcommands = [{ name: "Dev", commands: ["npm run dev"] }];
    assert.match(validateName("dev", { allcommands, launcherDir, lookup: nothingOnPath }), /already exists/);
});

test("rejects a name that would hide a program on PATH", () => {
    const lookup = () => ["C:\\Program Files\\Go\\bin\\go.exe"];
    assert.match(validateName("go", { launcherDir, lookup }), /would hide/);
});

test("rejects an app alias living next to the launchers", () => {
    const lookup = () => [`${launcherDir}\\winget.exe`];
    assert.match(validateName("winget", { launcherDir, lookup }), /would hide/);
});

test("ignores launchers this extension left behind", () => {
    const lookup = () => [`${launcherDir}\\dev`, `${launcherDir}\\dev.cmd`, `${launcherDir.toLowerCase()}\\dev.vbs`];
    assert.strictEqual(validateName("dev", { launcherDir, lookup }), null);
});

test("rejects a name Git Bash already has a program for", () => {
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    const git = fs.mkdtempSync(path.join(os.tmpdir(), "pt-git-"));
    fs.mkdirSync(path.join(git, "cmd"));
    fs.mkdirSync(path.join(git, "usr", "bin"), { recursive: true });
    fs.writeFileSync(path.join(git, "usr", "bin", "yes.exe"), "");
    fs.writeFileSync(path.join(git, "usr", "bin", "bashbug"), "");
    // where finds git.exe in Git\cmd, and nothing for the name itself
    const lookup = (name) => (name === "git" ? [path.join(git, "cmd", "git.exe")] : []);

    assert.match(validateName("yes", { launcherDir, lookup }), /Git Bash program/);
    assert.match(validateName("bashbug", { launcherDir, lookup }), /Git Bash program/);
    assert.strictEqual(validateName("deploy", { launcherDir, lookup }), null);
});
