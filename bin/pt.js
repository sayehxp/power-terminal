#!/usr/bin/env node
//@ts-check
const { run } = require("../src/cli");
const { useSharedStorage } = require("../src/utilites/requests");

// multi-entry launchers have to drop their requests where the editors are watching
useSharedStorage();

const { code, out, pending } = run(process.argv.slice(2));
if (out) (code ? process.stderr : process.stdout).write(out + "\n");
process.exitCode = code;
// a multi-entry command running here ends when its entries do
if (pending) pending.then((exit) => { process.exitCode = exit; });
