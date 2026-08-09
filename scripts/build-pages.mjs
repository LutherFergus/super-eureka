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
    process.exit(result.status ?? 1);
  }
}

let moved = false;

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
} finally {
  if (moved && existsSync(stashApi)) {
    if (existsSync(apiDir)) {
      rmSync(apiDir, { recursive: true, force: true });
    }
    renameSync(stashApi, apiDir);
    rmSync(stashDir, { recursive: true, force: true });
  }
}
