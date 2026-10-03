/**
 * Normalization for Arabic and Latin matching, with position mapping.
 *
 * Two jobs live here:
 *
 * 1. `arabicKey` / `latinKey` — the comparison key. Arabic writes the same
 *    word several ways and every equality test treats those spellings as
 *    different values, so matching goes through a key rather than through the
 *    raw string. The character classes are written as `\uXXXX` escapes on
 *    purpose: a mis-typed member is invisible in review. The replacement order
 *    is load-bearing — ta-marbuta runs on its own before the yeh forms, or a
 *    yeh-with-hamza is rewritten to ha first and the yeh rule never sees it.
 *
 * 2. `normalizeWithMap` / `findPhrase` — the same normalization, but keeping a
 *    map from every kept character back to its index in the input, so a match
 *    found in the key can be reported as a span in the original text. Every
 *    finding in the audit must carry a location, so this is not optional.
 */

const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ALEF_VARIANTS = /[\u0623\u0625\u0622\u0671]/g;
const TA_MARBUTA = /\u0629/g;
const YEH_FORMS = /[\u0649\u0626]/g;
const WAW_WITH_HAMZA = /\u0624/g;
const HAMZA_ALONE = /\u0621/g;
const TATWEEL = /\u0640/g;
const LAYOUT_NOISE = /[\s\-\u00AD\u2010-\u2015.,\u060C\u061B;:!?()\[\]{}«»\u201C\u201D\u2018\u2019"'`~*_/+\\|]/g;

/** Characters that count as part of a word when checking match boundaries. */
const WORD_CHAR = /[0-9A-Za-z\u0600-\u06FF]/;

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD_CHAR.test(ch);
}

/** Arabic comparison key: strips what carries no meaning, keeps one spelling. */
export function arabicKey(input: string): string {
  return input
    .replace(TASHKEEL, "")
    .replace(ALEF_VARIANTS, "\u0627")
    .replace(TA_MARBUTA, "\u0647")
    .replace(YEH_FORMS, "\u064A")
    .replace(WAW_WITH_HAMZA, "\u0648")
    .replace(HAMZA_ALONE, "")
    .replace(TATWEEL, "")
    .replace(LAYOUT_NOISE, "")
    .toLowerCase();
}

/** Latin comparison key. Case- and punctuation-insensitive, position preserving. */
export function latinKey(input: string): string {
  return input.replace(LAYOUT_NOISE, " ").toLowerCase();
}

export interface NormalizedText {
  /** The normalized string that matching runs against. */
  readonly key: string;
  /** `map[i]` is the index of `key[i]` in the original input. */
  readonly map: readonly number[];
  /** Which alphabet the key was built for. */
  readonly script: "arabic" | "latin";
}

/**
 * Normalize while keeping a map back to the original offsets.
 *
 * Deletions are allowed here (unlike a naive replace chain) because every kept
 * character records where it came from, so a span in `key` converts straight
 * back to a span in the input.
 */
export function normalizeWithMap(input: string, script: "arabic" | "latin"): NormalizedText {
  const keptChars: string[] = [];
  const map: number[] = [];

  // Walk the input once. Each character is rewritten to at most one output
  // character, or dropped.
  for (let i = 0; i < input.length; i++) {
    const raw = input[i];

    if (script === "arabic") {
      if (/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(raw)) continue; // tashkeel
      if (/\u0640/.test(raw)) continue; // tatweel
      if (/[\u0621]/.test(raw)) continue; // hamza alone
      if (/[\u0623\u0625\u0622\u0671]/.test(raw)) {
        keptChars.push("\u0627");
        map.push(i);
        continue;
      }
      if (/\u0629/.test(raw)) {
        keptChars.push("\u0647");
        map.push(i);
        continue;
      }
      if (/[\u0649\u0626]/.test(raw)) {
        keptChars.push("\u064A");
        map.push(i);
        continue;
      }
      if (/\u0624/.test(raw)) {
        keptChars.push("\u0648");
        map.push(i);
        continue;
      }
      if (/[\s\-\u00AD\u2010-\u2015.,\u060C\u061B;:!?()\[\]{}«»\u201C\u201D\u2018\u2019"'`~*_/+\\|]/.test(raw)) {
        keptChars.push(" ");
        map.push(i);
        continue;
      }
      keptChars.push(raw.toLowerCase());
      map.push(i);
      continue;
    }

    // Latin
    if (/[\s\-\u00AD\u2010-\u2015.,\u060C\u061B;:!?()\[\]{}«»\u201C\u201D\u2018\u2019"'`~*_/+\\|]/.test(raw)) {
      keptChars.push(" ");
      map.push(i);
      continue;
    }
    keptChars.push(raw.toLowerCase());
    map.push(i);
  }

  return { key: keptChars.join(""), map, script };
}

/** A span in both key space and original input space. */
export interface Match {
  readonly keyStart: number;
  readonly keyEnd: number;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * Find every occurrence of `phrase` in a normalized text, with boundaries.
 *
 * Multi-word phrases match across any run of separators (the normalizer turns
 * every punctuation mark into a single space, so "not  recommended," and
 * "not recommended" both match).
 */
export function findPhrase(
  normalized: NormalizedText,
  original: string,
  phrase: string,
): Match[] {
  const phraseKey = normalizeWithMap(phrase, normalized.script).key.trim();
  if (!phraseKey) return [];

  const tokens = phraseKey.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const pattern = tokens.map(escapeRegExp).join("\\s+");
  const rx = new RegExp(pattern, "g");

  const out: Match[] = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(normalized.key)) !== null) {
    const keyStart = m.index;
    const keyEnd = keyStart + m[0].length;

    // Boundary check against the surrounding key characters.
    if (isWordChar(normalized.key[keyStart - 1])) continue;
    if (isWordChar(normalized.key[keyEnd])) continue;

    const start = normalized.map[keyStart];
    const lastIdx = normalized.map[keyEnd - 1];
    if (start === undefined || lastIdx === undefined) continue;
    const end = lastIdx + 1;

    out.push({ keyStart, keyEnd, start, end, text: original.slice(start, end) });

    if (m[0].length === 0) rx.lastIndex++;
  }
  return out;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
