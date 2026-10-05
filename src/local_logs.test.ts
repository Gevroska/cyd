import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import log from "electron-log/node";
import { filterLocalLog, getLocalLogPath, rotateLocalLog } from "./local_logs";

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

  test("repetitive database reads cannot crowd errors out of the file history", () => {
    const logger = log.create({ logId: path.basename(directory) });
    logger.transports.console.level = false;
    logger.transports.file.level = "debug";
    logger.transports.file.resolvePathFn = () => getLocalLogPath(directory);
    logger.hooks.push(filterLocalLog);

    for (let i = 0; i < 1000; i++) {
      logger.debug("Executing SQL:", "SELECT * FROM account WHERE id = ?");
      logger.debug("Returning existing XAccountController for accountID", 1);
      logger.debug("Controller.refreshAccount: accountUUID=example");
    }
    logger.debug("MITMController: got response", { status: 200 });
    logger.warn("Executing SQL:", "slow statement");
    logger.error("SQL statement failed:", "missing table");

    const content = fs.readFileSync(getLocalLogPath(directory), "utf8");
    expect(content).not.toContain("SELECT * FROM account");
    expect(content).not.toContain("Returning existing");
    expect(content).not.toContain("refreshAccount");
    expect(content).toContain("MITMController: got response");
    expect(content).toContain("slow statement");
    expect(content).toContain("SQL statement failed:");
    expect(Buffer.byteLength(content)).toBeLessThan(1024);
  });

  test("file filtering leaves other debug transports available", () => {
    const message = {
      date: new Date(),
      level: "debug" as const,
      data: ["Executing SQL:", "SELECT 1"],
    };
    expect(filterLocalLog(message, undefined, "console")).toBe(message);
    expect(filterLocalLog(message, undefined, "file")).toBe(false);
  });
});
