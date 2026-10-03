/**
 * Ruling-force table — the declared policy that turns "did the ruling survive?"
 * into a table lookup instead of a judgement call.
 *
 * This file is a POLICY ENCODING, not a source of Sharia rulings. It records
 * how the operator has decided that a given Arabic modality term may be carried
 * into a target language. Every entry needs sign-off from the specialist who
 * owns the content, and the table travels inside the audit record so any reader
 * can see exactly which policy produced a finding.
 *
 * Why this exists: three of the four drift classes the audit targets (a ruling
 * weakened, a ruling strengthened, a command turned into a prohibition) are
 * changes of *force*, and force is checkable by lookup. Leaving them to a
 * generative model would make them probabilistic and unreproducible for no
 * gain. The tables cover what they cover; whatever falls outside them is
 * reported as outside coverage rather than guessed at.
 */

export type RulingForce = "prohibition" | "obligation" | "recommendation" | "dislike" | "permission";

export interface ForceProfile {
  /** Binding forces make something required or forbidden; the rest do not. */
  readonly binding: boolean;
  readonly polarity: "negative" | "positive" | "neutral";
  readonly label: string;
}

export const FORCE_PROFILES: Readonly<Record<RulingForce, ForceProfile>> = {
  prohibition: { binding: true, polarity: "negative", label: "منع" },
  obligation: { binding: true, polarity: "positive", label: "إيجاب" },
  recommendation: { binding: false, polarity: "positive", label: "استحباب" },
  dislike: { binding: false, polarity: "negative", label: "كراهة" },
  permission: { binding: false, polarity: "neutral", label: "إباحة" },
};

export interface RulingTerm {
  readonly id: string;
  /** Arabic surface forms in the source. Matched longest-first. */
  readonly arabic: readonly string[];
  readonly force: RulingForce;
  /** Approved renderings carrying the SAME force, keyed by language code. */
  readonly targets: Readonly<Record<string, readonly string[]>>;
  /** Where this mapping is stated. */
  readonly origin: string;
}

export const RULING_POLICY_ORIGIN =
  "سياسة قوة الحكم المعتمدة — تُراجع من المختص صاحب المحتوى قبل النشر";

export const RULING_TERMS: readonly RulingTerm[] = [
  {
    id: "ruling-prohibition",
    arabic: ["لا يجوز", "لا يحل", "لا يباح", "منهي عنه", "محرم", "حرام", "محظور"],
    force: "prohibition",
    targets: {
      en: [
        "forbidden",
        "prohibited",
        "impermissible",
        "unlawful",
        "not permitted",
        "not allowed",
        "haram",
        "disallowed",
        "banned",
        "it is not permissible",
      ],
      fr: ["interdit", "illicite", "non permis"],
    },
    origin: RULING_POLICY_ORIGIN,
  },
  {
    id: "ruling-obligation",
    arabic: ["يجب", "واجب", "فرض", "لا بد", "يلزم", "يتعين", "مفروض"],
    force: "obligation",
    targets: {
      en: ["obligatory", "mandatory", "required", "must", "incumbent", "binding", "it is a duty", "fard", "wajib"],
      fr: ["obligatoire", "il faut"],
    },
    origin: RULING_POLICY_ORIGIN,
  },
  {
    id: "ruling-recommendation",
    arabic: ["يستحب", "مستحب", "مندوب", "يسن", "من السنة", "الأولى", "الأفضل"],
    force: "recommendation",
    targets: {
      en: [
        "recommended",
        "encouraged",
        "preferred",
        "desirable",
        "meritorious",
        "it is better to",
        "sunnah",
        "good practice",
        "advisable",
      ],
      fr: ["recommandé", "préférable"],
    },
    origin: RULING_POLICY_ORIGIN,
  },
  {
    id: "ruling-dislike",
    arabic: ["يكره", "مكروه", "لا يستحب", "خلاف الأولى"],
    force: "dislike",
    targets: {
      en: [
        "disliked",
        "discouraged",
        "reprehensible",
        "not recommended",
        "not advised",
        "better to avoid",
        "makruh",
        "it is disliked",
        "should be avoided",
      ],
      fr: ["déconseillé", "réprouvé"],
    },
    origin: RULING_POLICY_ORIGIN,
  },
  {
    id: "ruling-permission",
    arabic: ["يجوز", "مباح", "حلال", "لا بأس", "جائز", "مشروع"],
    force: "permission",
    targets: {
      en: [
        "permitted",
        "allowed",
        "permissible",
        "lawful",
        "halal",
        "optional",
        "there is no harm",
        "acceptable",
        "fine to",
        "no objection",
      ],
      fr: ["permis", "licite", "autorisé"],
    },
    origin: RULING_POLICY_ORIGIN,
  },
];

/**
 * Two forces conflict when the derived text changed what the source obligated.
 *
 * A change between binding and non-binding is the dangerous class (a
 * prohibition rendered as a mere preference). A change of polarity at the same
 * binding level is the second class (a command rendered as a prohibition).
 */
export function forcesConflict(source: RulingForce, target: RulingForce): boolean {
  if (source === target) return false;
  const a = FORCE_PROFILES[source];
  const b = FORCE_PROFILES[target];
  if (a.binding !== b.binding) return true;
  if (a.polarity !== b.polarity) return true;
  return false;
}
