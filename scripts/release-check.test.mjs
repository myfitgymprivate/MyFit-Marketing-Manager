import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { inspectRelease } from "./release-check.mjs";

async function createRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "myfit-release-check-"));
  await mkdir(path.join(root, "apps/web/app"), { recursive: true });
  await writeFile(
    path.join(root, "apps/web/app/page.tsx"),
    "export default null;",
  );
  return root;
}

async function withRoot(run) {
  const root = await createRoot();
  try {
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("accepts missing and empty .next as a clean source handoff", async () => {
  await withRoot(async (root) => {
    assert.equal((await inspectRelease(root)).ok, true);
    await mkdir(path.join(root, "apps/web/.next"), { recursive: true });
    assert.equal((await inspectRelease(root)).ok, true);
  });
});

test("rejects non-empty .next without BUILD_ID", async () => {
  await withRoot(async (root) => {
    const cacheFile = path.join(root, "apps/web/.next/cache/data");
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, "cached");
    const result = await inspectRelease(root);
    assert.equal(result.ok, false);
    assert.match(result.message, /BUILD_ID/);
  });
});

test("rejects a stale build and accepts a current one", async () => {
  await withRoot(async (root) => {
    const buildId = path.join(root, "apps/web/.next/BUILD_ID");
    await mkdir(path.dirname(buildId), { recursive: true });
    await writeFile(buildId, "test-build");
    const oldTime = new Date("2020-01-01T00:00:00.000Z");
    await utimes(buildId, oldTime, oldTime);
    assert.equal((await inspectRelease(root)).ok, false);

    const currentTime = new Date(Date.now() + 1_000);
    await utimes(buildId, currentTime, currentTime);
    assert.equal((await inspectRelease(root)).ok, true);
  });
});

test("rejects conflicting generated file copies", async () => {
  await withRoot(async (root) => {
    const buildId = path.join(root, "apps/web/.next/BUILD_ID");
    const collision = path.join(root, "apps/web/.next/types/routes 2.ts");
    await mkdir(path.dirname(collision), { recursive: true });
    await writeFile(buildId, "test-build");
    await writeFile(collision, "conflict");
    const result = await inspectRelease(root);
    assert.equal(result.ok, false);
    assert.match(result.message, /konfliktní/);
  });
});
