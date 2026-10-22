#!/usr/bin/env node
//@ts-check
const { run } = require("../src/cli");
const { useSharedStorage } = require("../src/utilites/requests");

// multi-entry launchers have to drop their requests where the editors are watching
useSharedStorage();

const { code, out } = run(process.argv.slice(2));
(code ? process.stderr : process.stdout).write(out + "\n");
process.exitCode = code;
