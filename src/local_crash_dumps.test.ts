import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { isLocalDebugEnabled } from "./local_debug";
import {
  CRASH_DUMP_MAX_AGE,
  pruneLocalCrashDumps,
  startCrashDumpCleanup,
  startLocalCrashDumps,
} from "./local_crash_dumps";

const directories: string[] = [];
function profile(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cyd-dump-test-"));
  directories.push(directory);
  return directory;
}
afterEach(() => {
  vi.useRealTimers();
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("opt-in local diagnostics", () => {
  test.each(
    [[], ["Cyd.exe"], ["--debug=false"], ["cyd://open?debug=1"]].map(
      (args) => ({ args }),
    ),
  )("does not enable diagnostics for $args", ({ args }) =>
    expect(isLocalDebugEnabled(args)).toBe(false),
  );
  test.each(["-debug", "--debug"])("accepts the explicit %s flag", (arg) => {
    expect(isLocalDebugEnabled(["Cyd.exe", arg])).toBe(true);
  });
  test("normal startup neither creates a dump directory nor starts Crashpad", () => {
    const directory = profile();
    const app = { getPath: () => directory, setPath: vi.fn() };
    const reporter = { start: vi.fn() };
    expect(startLocalCrashDumps(app, reporter, [])).toBeUndefined();
    expect(app.setPath).not.toHaveBeenCalled();
    expect(reporter.start).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(directory, "crash-dumps"))).toBe(false);
  });
  test("debug startup uses local Crashpad with uploads disabled", () => {
    const directory = profile();
    const app = { getPath: () => directory, setPath: vi.fn() };
    const reporter = { start: vi.fn() };
    expect(startLocalCrashDumps(app, reporter, ["-debug"])).toBe(
      path.join(directory, "crash-dumps"),
    );
    expect(reporter.start).toHaveBeenCalledWith({
      uploadToServer: false,
      ignoreSystemCrashHandler: true,
    });
  });
});

describe("24-hour dump retention", () => {
  test("expires reports and pending dumps while preserving new dumps and metadata", () => {
    const directory = profile();
    const now = Date.now();
    for (const folder of ["reports", "pending"]) {
      fs.mkdirSync(path.join(directory, folder));
      for (const [name, age] of [
        ["old.dmp", CRASH_DUMP_MAX_AGE + 1000],
        ["boundary.dmp", CRASH_DUMP_MAX_AGE],
        ["new.dmp", CRASH_DUMP_MAX_AGE - 1000],
        ["settings.dat", CRASH_DUMP_MAX_AGE + 1000],
      ] as const) {
        const filename = path.join(directory, folder, name);
        fs.writeFileSync(filename, "fixture");
        fs.utimesSync(filename, new Date(now - age), new Date(now - age));
      }
    }
    pruneLocalCrashDumps(directory, now);
    for (const folder of ["reports", "pending"]) {
      expect(fs.readdirSync(path.join(directory, folder)).sort()).toEqual([
        "new.dmp",
        "settings.dat",
      ]);
    }
  });
  test("does not follow a link outside the dump directory", () => {
    const directory = profile();
    const external = profile();
    const filename = path.join(external, "keep.dmp");
    fs.writeFileSync(filename, "fixture");
    fs.utimesSync(filename, new Date(0), new Date(0));
    fs.symlinkSync(external, path.join(directory, "outside"), "junction");
    pruneLocalCrashDumps(directory);
    expect(fs.existsSync(filename)).toBe(true);
  });
  test("cleans up on startup and once per minute, without enabling diagnostics", () => {
    vi.useFakeTimers();
    const directory = profile();
    const reports = path.join(directory, "crash-dumps", "reports");
    fs.mkdirSync(reports, { recursive: true });
    const filename = path.join(reports, "recent.dmp");
    fs.writeFileSync(filename, "fixture");
    const time = Date.now() - CRASH_DUMP_MAX_AGE + 30000;
    fs.utimesSync(filename, new Date(time), new Date(time));
    const onError = vi.fn();
    const stop = startCrashDumpCleanup(directory, onError);
    expect(fs.existsSync(filename)).toBe(true);
    vi.advanceTimersByTime(60000);
    expect(fs.existsSync(filename)).toBe(false);
    stop();
    expect(vi.getTimerCount()).toBe(0);
    expect(onError).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(directory, "logs"))).toBe(false);
  });
});
