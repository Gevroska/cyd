import fs from "fs";
import path from "path";

export const LOCAL_LOG_FILE_SIZE = 1024 * 1024;
export const LOCAL_LOG_BACKUPS = 9;

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
