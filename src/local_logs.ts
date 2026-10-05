import fs from "fs";
import path from "path";
import type { Hook } from "electron-log";

export const LOCAL_LOG_FILE_SIZE = 1024 * 1024;
export const LOCAL_LOG_BACKUPS = 9;

// These successful hot-path calls filled the history in a few minutes.
// Keep other debug messages and every warning/error available for diagnosis.
export const filterLocalLog: Hook = (message, _transport, transportName) => {
  if (transportName !== "file" || message.level !== "debug") {
    return message;
  }
  const label = message.data[0];
  if (
    typeof label === "string" &&
    (label.startsWith("Executing SQL:") ||
      label.startsWith("Returning existing XAccountController for accountID") ||
      label.includes(".refreshAccount: accountUUID="))
  ) {
    return false;
  }
  return message;
};

// Keep appending across restarts, including after a crash.
export function getLocalLogPath(logDirectory: string): string {
  fs.mkdirSync(logDirectory, { recursive: true });
  const legacyBackup = path.join(logDirectory, "main.old.log");
  const newestBackup = path.join(logDirectory, "main.1.log");
  if (fs.existsSync(legacyBackup) && !fs.existsSync(newestBackup)) {
    fs.renameSync(legacyBackup, newestBackup);
  }
  return path.join(logDirectory, "main.log");
}

export function rotateLocalLog(currentPath: string): void {
  const directory = path.dirname(currentPath);
  fs.rmSync(path.join(directory, `main.${LOCAL_LOG_BACKUPS}.log`), {
    force: true,
  });
  for (let index = LOCAL_LOG_BACKUPS; index > 1; index--) {
    const source = path.join(directory, `main.${index - 1}.log`);
    if (fs.existsSync(source)) {
      fs.renameSync(source, path.join(directory, `main.${index}.log`));
    }
  }
  fs.renameSync(currentPath, path.join(directory, "main.1.log"));
}
