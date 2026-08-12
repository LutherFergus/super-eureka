import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "src/app/api");
const stashDir = join(root, ".pages-api-stash");
const stashApi = join(stashDir, "api");

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    // Throw so the finally block can restore src/app/api before exit.
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status ?? 1}`,
    );
  }
}

function restoreApiIfNeeded(moved) {
  if (!moved || !existsSync(stashApi)) return;
  if (existsSync(apiDir)) {
    rmSync(apiDir, { recursive: true, force: true });
  }
  renameSync(stashApi, apiDir);
  rmSync(stashDir, { recursive: true, force: true });
}

let moved = false;
let exitCode = 0;

try {
  if (existsSync(apiDir)) {
    rmSync(stashDir, { recursive: true, force: true });
    mkdirSync(stashDir, { recursive: true });
    renameSync(apiDir, stashApi);
    moved = true;
  }

  run("npx", ["next", "build"], {
    GITHUB_PAGES: "1",
    NEXT_PUBLIC_GITHUB_PAGES: "1",
  });
} catch (error) {
  exitCode = 1;
  console.error(error instanceof Error ? error.message : error);
} finally {
  restoreApiIfNeeded(moved);
}

process.exit(exitCode);
