import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { getLocalLogPath, rotateLocalLog } from "./local_logs";

describe("local log history", () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "cyd-local-log-"));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  test("a restart retains the last writes before a crash", () => {
    const current = getLocalLogPath(directory);
    fs.appendFileSync(current, "collecting replies\nlast write before crash\n");
    fs.appendFileSync(getLocalLogPath(directory), "new session\n");
    expect(fs.readFileSync(current, "utf8")).toBe(
      "collecting replies\nlast write before crash\nnew session\n",
    );
  });

  test("size rotations retain the ten newest files in chronological order", () => {
    const current = getLocalLogPath(directory);
    for (let session = 1; session <= 12; session++) {
      fs.writeFileSync(current, `${session}\n`);
      rotateLocalLog(current);
    }
    fs.writeFileSync(current, "13\n");

    expect(fs.readdirSync(directory)).toHaveLength(10);
    expect(fs.readFileSync(current, "utf8")).toBe("13\n");
    for (let index = 1; index <= 9; index++) {
      expect(
        fs.readFileSync(path.join(directory, `main.${index}.log`), "utf8"),
      ).toBe(`${13 - index}\n`);
    }
  });

  test("upgrading preserves the legacy log backup", () => {
    fs.writeFileSync(path.join(directory, "main.old.log"), "older history\n");
    fs.writeFileSync(path.join(directory, "main.log"), "recent history\n");
    getLocalLogPath(directory);

    expect(fs.readFileSync(path.join(directory, "main.1.log"), "utf8")).toBe(
      "older history\n",
    );
    expect(fs.readFileSync(path.join(directory, "main.log"), "utf8")).toBe(
      "recent history\n",
    );
    expect(fs.existsSync(path.join(directory, "main.old.log"))).toBe(false);
  });
});
