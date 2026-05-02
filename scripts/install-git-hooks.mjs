#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const gitDir = join(root, ".git");

if (!existsSync(gitDir)) {
  process.exit(0);
}

const hooksDir = join(gitDir, "hooks");
mkdirSync(hooksDir, { recursive: true });
copyFileSync(join(root, ".githooks", "pre-commit"), join(hooksDir, "pre-commit"));
