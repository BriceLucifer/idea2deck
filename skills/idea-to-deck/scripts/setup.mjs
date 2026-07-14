#!/usr/bin/env node

import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = dirname(dirname(fileURLToPath(import.meta.url)));
const requireFromSkill = createRequire(join(skillDir, "package.json"));
const requiredPackages = ["jszip", "pdf-lib", "pptxgenjs", "sharp", "zod"];

function assertNodeVersion() {
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  if (!Number.isFinite(major) || major < 20) {
    throw new Error(`Idea to Deck requires Node.js 20 or newer; found ${process.versions.node}.`);
  }
}

async function missingPackages() {
  const missing = [];
  for (const packageName of requiredPackages) {
    try {
      requireFromSkill.resolve(packageName);
    } catch {
      missing.push(packageName);
    }
  }
  return missing;
}

async function assertPackageFiles() {
  await Promise.all([
    access(join(skillDir, "package.json")),
    access(join(skillDir, "package-lock.json")),
  ]);
}

function runNpmCi() {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["ci", "--omit=dev"], {
      cwd: skillDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`npm ci failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}.`));
    });
  });
}

async function main() {
  assertNodeVersion();
  await assertPackageFiles();
  const mode = process.argv[2] ?? "--check";
  if (!["--check", "--install"].includes(mode)) {
    throw new Error("Usage: setup.mjs --check | --install");
  }

  let missing = await missingPackages();
  if (missing.length === 0) {
    process.stdout.write(`${JSON.stringify({ ready: true, node: process.versions.node, skillDir })}\n`);
    return;
  }

  if (mode === "--check") {
    process.stderr.write(`${JSON.stringify({ ready: false, missing, skillDir })}\n`);
    process.exitCode = 2;
    return;
  }

  await runNpmCi();
  missing = await missingPackages();
  if (missing.length > 0) throw new Error(`Runtime dependencies are still missing: ${missing.join(", ")}`);
  process.stdout.write(`${JSON.stringify({ ready: true, installed: true, node: process.versions.node, skillDir })}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
