const test = require("node:test");
const assert = require("node:assert");
const { validateName } = require("../src/utilites/names");

const launcherDir = "C:\\Users\\me\\AppData\\Local\\Microsoft\\WindowsApps";
const nothingOnPath = () => [];

test("accepts a plain name", () => {
    assert.strictEqual(validateName("dev-server_2", { launcherDir, lookup: nothingOnPath }), null);
});

test("rejects empty names, spaces and shell characters", () => {
    for (const name of ["", "   ", "my dev", "a&b", "-x", "dev.cmd", "ä"]) {
        assert.ok(validateName(name, { launcherDir, lookup: nothingOnPath }), name);
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
