/**
 * Copy the framework-free files from the web frontend into the mobile app.
 *
 * Run with `--check` to compare instead of write; that is what
 * `npm run check-sync` does and what tells you a copy has drifted.
 *
 * Each destination gets a provenance header so the next person to open the file
 * knows it is a copy before they edit it. The header is not part of the
 * comparison, so adding it does not make every file look out of date.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COPIED_FILES } from "./copied-files.mjs";

const MOBILE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FRONTEND = resolve(MOBILE, "..", "frontend", "src");

const MARKER = "// COPIED FROM";

/** Two comment lines and one blank line, so HEADER_LINES below stays true. */
function header(relative) {
  return [
    `// COPIED FROM frontend/src/${relative}`,
    "// Keep in sync manually: run `npm run check-sync`. See mobile/README.md.",
    "",
    "",
  ].join("\n");
}

const HEADER_LINES = 3;

/** Strip the provenance header so copies compare on their real content. */
function body(text) {
  if (!text.startsWith(MARKER)) return text;
  return text.split("\n").slice(HEADER_LINES).join("\n");
}

const check = process.argv.includes("--check");
const drifted = [];

for (const relative of COPIED_FILES) {
  const from = join(FRONTEND, relative);
  const to = join(MOBILE, relative);
  const source = readFileSync(from, "utf8");

  if (check) {
    if (!existsSync(to)) {
      drifted.push(`${relative} (missing in mobile/)`);
      continue;
    }
    if (body(readFileSync(to, "utf8")) !== source) drifted.push(relative);
    continue;
  }

  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, header(relative) + source);
  console.log(`copied ${relative}`);
}

if (check) {
  if (drifted.length === 0) {
    console.log(`All ${COPIED_FILES.length} copied files match frontend/src.`);
  } else {
    console.error("Copied files have drifted from frontend/src:");
    for (const file of drifted) console.error(`  ${file}`);
    console.error("\nRun `node scripts/sync-copied.mjs` to re-copy, then re-check the diff.");
    process.exit(1);
  }
}
