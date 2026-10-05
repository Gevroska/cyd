import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import electron from "electron";

// A deliberately failing, isolated test must fail the actual Electron runner.
// This catches teardown code that accidentally turns a failed suite green.
const fixture = "src/.ci-test-exit.test.ts";
fs.writeFileSync(
  fixture,
  'import { it } from "vitest"; it("CI failure sentinel", () => { throw new Error("CI failure sentinel"); });\n',
  { flag: "wx" },
);
try {
  const result = spawnSync(
    electron,
    [
      "--no-sandbox",
      "node_modules/vitest/vitest.mjs",
      "run",
      "--silent=true",
      fixture,
    ],
    { encoding: "utf8", timeout: 90000, env: { ...process.env, CI: "true" } },
  );
  assert.ok(
    `${result.stdout}${result.stderr}`.includes("CI failure sentinel"),
    "The deliberate failure did not run",
  );
  assert.ok(
    result.status !== null && result.status !== 0,
    "Electron/Vitest masked a failed test with exit code zero",
  );
  process.stdout.write(
    "Verified that a failing Electron test returns a failure status.\n",
  );
} finally {
  fs.unlinkSync(fixture);
}
