import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import electron from "electron";
import ts from "typescript";

// Exercise the real Crashpad handler in an isolated, windowless application.
// It cannot open the user's Cyd profile or social-platform sessions.
const tempRoot = fs.realpathSync(os.tmpdir());
const fixture = fs.mkdtempSync(path.join(tempRoot, "cyd-crash-check-"));
assert.ok(fixture.startsWith(path.join(tempRoot, "cyd-crash-check-")));
for (const module of ["local_debug", "local_crash_dumps"]) {
  fs.writeFileSync(
    path.join(fixture, `${module}.js`),
    ts.transpileModule(fs.readFileSync(`src/${module}.ts`, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
  );
}
fs.writeFileSync(
  path.join(fixture, "package.json"),
  JSON.stringify({
    name: "cyd-crash-check",
    version: "1.0.0",
    main: "main.cjs",
  }),
);
fs.writeFileSync(
  path.join(fixture, "main.cjs"),
  `const fs = require("node:fs");
const path = require("node:path");
const { app, crashReporter } = require("electron");
const { startLocalCrashDumps } = require("./local_crash_dumps.js");
app.disableHardwareAcceleration();
const profile = path.join(__dirname, "profile");
fs.mkdirSync(profile, {recursive: true});
app.setPath("userData", profile);
const directory = startLocalCrashDumps(app, crashReporter);
if (directory && crashReporter.getUploadToServer()) throw new Error("Crash uploads enabled");
fs.writeFileSync(path.join(__dirname, "enabled.json"), JSON.stringify({enabled: Boolean(directory), directory, uploads: false}));
if (!directory) app.exit(0);
else app.whenReady().then(() => process.crash());
`,
);

function findDumps(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory()
      ? findDumps(filename)
      : entry.name.endsWith(".dmp")
        ? [filename]
        : [];
  });
}

try {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const defaultResult = spawnSync(electron, ["--no-sandbox", fixture], {
    env,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.ifError(defaultResult.error);
  assert.equal(defaultResult.status, 0, defaultResult.stderr);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(fixture, "enabled.json"), "utf8"))
      .enabled,
    false,
  );
  assert.ok(!fs.existsSync(path.join(fixture, "profile", "crash-dumps")));
  process.stdout.write(
    "Verified native crash capture is disabled by default.\n",
  );
  const result = spawnSync(electron, ["--no-sandbox", fixture, "-debug"], {
    env,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.ifError(result.error);
  assert.ok(
    result.status !== 0 || result.signal,
    "The isolated native crash did not occur",
  );
  const enabled = JSON.parse(
    fs.readFileSync(path.join(fixture, "enabled.json"), "utf8"),
  );
  assert.equal(enabled.uploads, false);
  assert.equal(enabled.directory, path.join(fixture, "profile", "crash-dumps"));

  let dumps = [];
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    dumps = findDumps(enabled.directory);
    if (dumps.length) break;
    await setTimeout(250);
  }
  assert.ok(dumps.length, "The native crash did not produce a local dump");
  const dump = fs.readFileSync(dumps[0]);
  assert.equal(dump.subarray(0, 4).toString(), "MDMP", "Invalid minidump");
  const streamCount = dump.readUInt32LE(8);
  const streamDirectory = dump.readUInt32LE(12);
  const streamTypes = Array.from({ length: streamCount }, (_, index) =>
    dump.readUInt32LE(streamDirectory + index * 12),
  );
  assert.ok(
    streamTypes.includes(6),
    "Minidump lacks a native exception stream",
  );
  process.stdout.write(
    "Verified a local native crash dump with uploads disabled.\n",
  );
} finally {
  // The temporary root above is resolved and the generated prefix is checked.
  fs.rmSync(fixture, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 250,
  });
}
