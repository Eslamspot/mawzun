/**
 * Dictionary integrity check: every Arabic UI string must have an English
 * twin, or the language toggle ships a half-translated interface.
 *
 * Run with: `bun run i18n:check`
 */
import { dictionaryGaps } from "../src/lib/i18n";

const gaps = dictionaryGaps();
if (gaps.length > 0) {
  console.error(`\n✖ i18n:check failed — ${gaps.length} key(s) missing an English twin:\n`);
  for (const key of gaps) console.error(`  - ${key}`);
  console.error("");
  process.exit(1);
}

console.log("✓ i18n:check passed — every Arabic chrome string has an English twin.");
