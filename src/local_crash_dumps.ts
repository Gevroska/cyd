import fs from "fs";
import path from "path";
import type { App, CrashReporter } from "electron";
import { isLocalDebugEnabled } from "./local_debug";

export const CRASH_DUMP_MAX_AGE = 24 * 60 * 60 * 1000;
export const CRASH_DUMP_CLEANUP_INTERVAL = 60 * 1000;

export function pruneLocalCrashDumps(
  directory: string,
  now = Date.now(),
): void {
  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
    return;
  }
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    // Never follow links or remove Crashpad's database/settings files.
    if (entry.isDirectory()) {
      pruneLocalCrashDumps(filename, now);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".dmp")) {
      if (now - fs.statSync(filename).mtimeMs >= CRASH_DUMP_MAX_AGE) {
        fs.unlinkSync(filename);
      }
    }
  }
}

export function startCrashDumpCleanup(
  userData: string,
  onError: (error: unknown) => void,
): () => void {
  const prune = () => {
    try {
      pruneLocalCrashDumps(path.join(userData, "crash-dumps"));
    } catch (error) {
      onError(error);
    }
  };
  // Clean up old opt-in reports even during a normal, non-debug launch.
  prune();
  const timer = setInterval(prune, CRASH_DUMP_CLEANUP_INTERVAL);
  timer.unref?.();
  return () => clearInterval(timer);
}

export function startLocalCrashDumps(
  app: Pick<App, "getPath" | "setPath">,
  reporter: Pick<CrashReporter, "start">,
  args: readonly string[] = process.argv,
): string | undefined {
  if (!isLocalDebugEnabled(args)) {
    return undefined;
  }
  const directory = path.join(app.getPath("userData"), "crash-dumps");
  fs.mkdirSync(directory, { recursive: true });
  app.setPath("crashDumps", directory);
  // Crashpad monitors the main process and subsequently created child processes.
  // No server URL or extra account data is supplied.
  reporter.start({
    uploadToServer: false,
    ignoreSystemCrashHandler: true,
  });
  return directory;
}
