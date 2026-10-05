import fs from "fs";
import path from "path";
import type { App, CrashReporter } from "electron";

export function startLocalCrashDumps(
  app: Pick<App, "getPath" | "setPath">,
  reporter: Pick<CrashReporter, "start">,
): string {
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
