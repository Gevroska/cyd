import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { extractFile, listPackage } from "@electron/asar";
import unzipper from "unzipper";

function findFiles(directory, matches) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory()
      ? findFiles(filename, matches)
      : matches(filename)
        ? [filename]
        : [];
  });
}

const packages = findFiles("out", (filename) => filename.endsWith("app.asar"));
assert.equal(packages.length, 1, "Expected exactly one packaged application");
const archive = packages[0];
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
assert.equal(JSON.parse(extractFile(archive, "package.json")).version, version);

const main = extractFile(archive, path.join(".vite", "build", "main.js")).toString();
assert.ok(main.includes("deleteTweetsKeepReplies"), "Missing reply protection");
assert.ok(main.includes("deleteTweetsKeepPinned"), "Missing pinned protection");
assert.ok(main.includes("likedAt"), "Missing the fork's likes date metadata");
assert.ok(!main.includes("It uses the dev server and it might contain bugs"));

const renderer = listPackage(archive)
  .map((filename) => filename.replaceAll("\\", "/").replace(/^\//, ""))
  .filter(
    (filename) =>
      filename.startsWith(".vite/renderer/") && filename.endsWith(".js"),
  )
  .map((filename) => extractFile(archive, path.normalize(filename)).toString())
  .join("\n");
assert.ok(
  renderer.includes("Do not delete my reply tweets"),
  "Missing checkbox label",
);
assert.ok(
  renderer.includes("replyTweetsWillBeKept"),
  "Missing review confirmation",
);

if (process.platform === "win32") {
  const packages = findFiles("out/make", (filename) =>
    filename.endsWith("-full.nupkg"),
  );
  assert.equal(
    packages.length,
    1,
    "Expected exactly one full Squirrel package",
  );
  const installerPackage = await unzipper.Open.file(packages[0]);
  const embeddedArchive = installerPackage.files.find((file) =>
    file.path.endsWith("/resources/app.asar"),
  );
  assert.ok(embeddedArchive, "Squirrel package does not contain app.asar");
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  assert.equal(
    digest(await embeddedArchive.buffer()),
    digest(fs.readFileSync(archive)),
    "Squirrel bundled a different application from the current build",
  );
}

process.stdout.write(
  `Verified packaged Cyd ${version}: reply protection, fork settings, and startup presentation.\n`,
);

