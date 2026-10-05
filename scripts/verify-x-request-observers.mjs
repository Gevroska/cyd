import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import electron from "electron";
import ts from "typescript";

// Test real Electron request-body handling using an isolated profile and a
// loopback server. No personal Cyd profile or platform service is accessed.
const tempRoot = fs.realpathSync(os.tmpdir());
const fixture = fs.mkdtempSync(path.join(tempRoot, "cyd-network-check-"));
assert.ok(fixture.startsWith(path.join(tempRoot, "cyd-network-check-")));
for (const [source, destination] of [
  ["src/account_x/web_request_filter.ts", "web_request_filter.js"],
  ["src/local_debug.ts", "local_debug.js"],
  ["src/local_crash_dumps.ts", "local_crash_dumps.js"],
]) {
  fs.writeFileSync(
    path.join(fixture, destination),
    ts.transpileModule(fs.readFileSync(source, "utf8"), {
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
    name: "cyd-network-check",
    version: "1.0.0",
    main: "main.cjs",
  }),
);
fs.writeFileSync(
  path.join(fixture, "main.cjs"),
  `const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const {app, BrowserWindow, session} = require("electron");
const {X_API_REQUEST_FILTER} = require("./web_request_filter.js");
const mark = phase => fs.writeFileSync(path.join(__dirname, "phase.txt"), phase);
process.on("uncaughtException", error => { mark(error.stack || String(error)); console.error(error); app.exit(1); });
mark("starting");
app.disableHardwareAcceleration();
const profile = path.join(__dirname, "profile");
fs.mkdirSync(profile, {recursive: true});
app.setPath("userData", profile);
mark("profile configured");
app.whenReady().then(async () => {
  mark("ready");
  let uploads = 0;
  const observations = [];
  const server = http.createServer((req, res) => {
    if (req.method === "POST") uploads++;
    req.resume();
    req.on("end", () => {
      if (req.url.startsWith("/i/api/graphql/")) {
        res.writeHead(429, {"x-rate-limit-reset": "1791199999"});
      } else { res.writeHead(200, {"Content-Type": "text/html"}); }
      res.end("<html><body>Local fixture</body></html>");
    });
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  mark("server listening");
  const origin = "http://127.0.0.1:" + server.address().port;
  // First validate production patterns using Electron's own URL parser.
  session.defaultSession.webRequest.onCompleted(X_API_REQUEST_FILTER, () => {});
  const filter = {urls: [...new Set(X_API_REQUEST_FILTER.urls.map(url => url.replace(/^https:\\/\\/[^/]+/, origin)))]};
  if (process.env.CYD_REPRO_LEGACY === "1") {
    session.defaultSession.webRequest.onSendHeaders(() => {});
    session.defaultSession.webRequest.onCompleted(() => {});
  } else {
    session.defaultSession.webRequest.onCompleted(filter, details => {
      observations.push({url: details.url, status: details.statusCode, reset: details.responseHeaders["x-rate-limit-reset"]});
    });
  }
  const win = new BrowserWindow({show: false, webPreferences: {sandbox: true, contextIsolation: true, nodeIntegration: false}});
  mark("window created");
  await win.loadURL(origin + "/");
  mark("page loaded");
  await win.webContents.executeJavaScript(
    "(async () => { for (let i=0;i<8;i++) { await fetch('/unrelated-upload', {method:'POST', body:new Blob(['body'.repeat(4096)])}); } await fetch('/i/api/graphql/current/UserTweets'); await new Promise(resolve=>setTimeout(resolve,100)); })()"
  );
  mark("requests completed");
  fs.writeFileSync(path.join(__dirname, "result.json"), JSON.stringify({uploads, observations}));
  server.close();
  app.exit(0);
}).catch(error => { console.error(error); app.exit(1); });
`,
);

try {
  new vm.Script(fs.readFileSync(path.join(fixture, "main.cjs"), "utf8"));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  if (process.argv.includes("--legacy")) env.CYD_REPRO_LEGACY = "1";
  const result = spawnSync(electron, ["--no-sandbox", fixture], {
    env,
    encoding: "utf8",
    timeout: 90000,
  });
  if (result.error) {
    const phase = fs.existsSync(path.join(fixture, "phase.txt"))
      ? fs.readFileSync(path.join(fixture, "phase.txt"), "utf8")
      : "before startup";
    throw new Error(
      `${result.error.message}; phase: ${phase}; ${result.stderr}`,
    );
  }
  if (process.argv.includes("--legacy")) {
    process.stdout.write(
      `Legacy request observer exit status: ${result.status}.\n`,
    );
  } else {
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(
      fs.readFileSync(path.join(fixture, "result.json"), "utf8"),
    );
    assert.equal(report.uploads, 8, "The Blob upload fixture did not run");
    assert.equal(
      report.observations.length,
      1,
      "Unrelated upload reached the observer",
    );
    assert.equal(report.observations[0].status, 429);
    assert.deepEqual(report.observations[0].reset, ["1791199999"]);
    process.stdout.write(
      "Verified X API observation and Blob uploads without the native crash observer.\n",
    );
  }
} catch (error) {
  process.stderr.write(`${error.stack}\n`);
  throw error;
} finally {
  fs.rmSync(fixture, {
    recursive: true,
    force: true,
    maxRetries: 20,
    retryDelay: 250,
  });
}
