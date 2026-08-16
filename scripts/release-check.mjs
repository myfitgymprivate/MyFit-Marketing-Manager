import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(target) : [target];
    }),
  );
  return nested.flat();
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function inspectRelease(root) {
  const nextDirectory = path.join(root, "apps/web/.next");
  const sourceDirectory = path.join(root, "apps/web/app");
  if (!(await exists(nextDirectory)))
    return {
      ok: true,
      message: "Release check: čistá zdrojová kopie bez .next artefaktů.",
    };

  const nextFiles = await filesBelow(nextDirectory);
  if (!nextFiles.length)
    return {
      ok: true,
      message: "Release check: čistá zdrojová kopie s prázdnou .next.",
    };

  const collisions = nextFiles.filter((file) => / \d+\.[^.]+$/.test(file));
  if (collisions.length)
    return {
      ok: false,
      message: "Release check: nalezeny konfliktní kopie v .next:",
      details: collisions.map((file) => path.relative(root, file)),
    };

  const buildId = path.join(nextDirectory, "BUILD_ID");
  if (!(await exists(buildId)))
    return {
      ok: false,
      message: "Release check: .next neobsahuje BUILD_ID.",
    };

  const sourceFiles = await filesBelow(sourceDirectory);
  const sourceTimes = await Promise.all(
    sourceFiles.map(async (file) => (await stat(file)).mtimeMs),
  );
  const newestSource = Math.max(...sourceTimes);
  const buildTime = (await stat(buildId)).mtimeMs;
  if (buildTime < newestSource)
    return {
      ok: false,
      message: "Release check: BUILD_ID je starší než zdrojové soubory.",
    };

  return {
    ok: true,
    message: "Release check: build je aktuální a bez konfliktních kopií.",
  };
}

async function main() {
  const result = await inspectRelease(process.cwd());
  const output = result.ok ? console.log : console.error;
  output(result.message);
  result.details?.forEach((detail) => console.error(detail));
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
