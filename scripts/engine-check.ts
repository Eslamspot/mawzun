/**
 * Engine check — the proof that the audit engine behaves as the spec says.
 *
 * Run with:  bun scripts/engine-check.ts
 *
 * Every case asserts a behaviour, not a string. The two cases that matter most
 * are the drift case (a prohibition rendered as a preference must be caught) and
 * the hostile-model case (a model inventing a location must be rejected).
 */

import { runAudit, buildConstraintBank, verifyRecord, modelProvider } from "../src/lib/audit/index";
import type { AuditInput } from "../src/lib/audit/types";

const bank = buildConstraintBank();

let failures = 0;
let checks = 0;

function assert(label: string, condition: boolean, detail = "") {
  checks++;
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function baseInput(over: Partial<AuditInput>): AuditInput {
  return {
    sourceText: "",
    derivedText: "",
    workType: "translate",
    contentLevel: "B",
    targetLanguage: "en",
    bank,
    reviewerDecision: null,
    ...over,
  };
}

const case1 = baseInput({
  sourceText: "لا يجوز بيع الطعام قبل قبضه، ويجب على البائع بيانه للمشتري.",
  derivedText:
    "It is not recommended to sell food before taking possession, and the seller must clarify it to the buyer.",
});

const case2 = baseInput({
  sourceText: "قال النبي ﷺ: «إنما الأعمال بالنيات»، رواه البخاري (رقم 1).",
  derivedText: "The Prophet said: Actions are judged by their intentions.",
});

const case3 = baseInput({
  sourceText: "يستحب للمسلم إخلاص النية، ويجب عليه أداء الصلاة.",
  derivedText: "It is recommended for a Muslim to be sincere in intention, and he must perform the prayer.",
});

const case4 = baseInput({
  sourceText: "هل يجب علي إخراج زكاة هذا المال؟",
  derivedText: "Do I have to pay zakat on this money?",
  contentLevel: "D",
});

const run = async () => {
  console.log("\n=== 1. drift: prohibition rendered as a preference ===");
  {
    const { result, record } = await runAudit(case1, { now: "2026-10-03T00:00:00.000Z" });
    const shift = result.findings.find((f) => f.cls === "shifted" && f.kind === "ruling");
    console.log(`  verdict: ${result.verdict}`);
    console.log(`  reason : ${result.reason.slice(0, 160)}`);
    assert("verdict is needs_revision", result.verdict === "needs_revision", result.verdict);
    assert("a shifted ruling finding exists", Boolean(shift));
    assert("the shifted span is the bad rendering", shift?.span.toLowerCase().includes("not recommended") === true, shift?.span);
    assert("the finding carries evidence of both forces", Boolean(shift?.evidence.note.includes("ملزم")));
    assert("the finding has a non-zero location in the derived text", (shift?.end ?? 0) > (shift?.start ?? 0));
    assert("the record was sealed", record.digest.length === 64, record.digest);
  }

  console.log("\n=== 2. dropped isnad and dropped number ===");
  {
    const { result } = await runAudit(case2, { now: "2026-10-03T00:00:00.000Z" });
    console.log(`  verdict: ${result.verdict}`);
    assert("verdict is needs_revision", result.verdict === "needs_revision", result.verdict);
    assert(
      "a missing isnad finding exists",
      result.findings.some((f) => f.kind === "isnad" && f.cls === "missing"),
    );
    assert(
      "a missing number finding exists",
      result.findings.some((f) => f.kind === "number" && f.cls === "missing"),
    );
    assert("layer 1 is the layer that caught both", result.layerSummary.L1.missing >= 2, JSON.stringify(result.layerSummary));
  }

  console.log("\n=== 3. faithful transfer ===");
  {
    const { result } = await runAudit(case3, { now: "2026-10-03T00:00:00.000Z" });
    console.log(`  verdict: ${result.verdict}`);
    assert("verdict is faithful", result.verdict === "faithful", result.verdict);
    assert(
      "no shifted or missing findings",
      result.findings.every((f) => f.cls === "preserved"),
      JSON.stringify(result.findings.map((f) => f.cls)),
    );
  }

  console.log("\n=== 4. level د stops without judging ===");
  {
    const { result } = await runAudit(case4, { now: "2026-10-03T00:00:00.000Z" });
    console.log(`  verdict: ${result.verdict}`);
    assert("verdict is refer", result.verdict === "refer", result.verdict);
    assert("no findings were produced", result.findings.length === 0);
  }

  console.log("\n=== 5. hostile model output is rejected ===");
  {
    const fabricated = JSON.stringify({
      findings: [
        {
          question: "ruling_force",
          cls: "shifted",
          source_quote: "لا يجوز",
          derived_quote: "this phrase is not in the derived text at all",
          note: "invented",
        },
        {
          question: "condition",
          cls: "shifted",
          source_quote: "كلام لا وجود له في الأصل",
          derived_quote: "It is not recommended",
          note: "invented source quote",
        },
      ],
    });

    const provider = modelProvider(async () => ({ raw: fabricated, model: "test-model", promptHash: "abc" }));
    const { result, rejected } = await runAudit(case1, { semantic: provider, now: "2026-10-03T00:00:00.000Z" });

    assert("both fabricated findings were rejected", rejected.length === 2, JSON.stringify(rejected));
    assert("no layer 3 finding survived", result.findings.every((f) => f.layer !== "L3"));
  }

  console.log("\n=== 6. a truthful model finding is accepted and locatable ===");
  {
    const truthful = JSON.stringify({
      findings: [
        {
          question: "ruling_force",
          cls: "shifted",
          source_quote: "لا يجوز",
          derived_quote: "not recommended",
          note: "المنع في الأصل ظهر في المشتق بلفظ أولوية أقل",
        },
      ],
    });
    const provider = modelProvider(async () => ({ raw: truthful, model: "test-model", promptHash: "abc" }));
    const { result, record } = await runAudit(case1, { semantic: provider, now: "2026-10-03T00:00:00.000Z" });
    const l3 = result.findings.find((f) => f.layer === "L3");

    assert("the finding was accepted", Boolean(l3));
    assert("it points at a real span", (l3?.end ?? 0) > (l3?.start ?? 0));
    assert("the record names the model", record.model.id === "test-model" && record.model.promptHash === "abc");
  }

  console.log("\n=== 7. record integrity and replay ===");
  {
    const { record } = await runAudit(case1, { now: "2026-10-03T00:00:00.000Z" });

    const good = await verifyRecord(record);
    assert("an untouched record verifies", good.ok, JSON.stringify(good.notes));

    const tampered = {
      ...record,
      findings: record.findings.map((f, i) => (i === 0 ? { ...f, note: "edited after the fact" } : f)),
    };
    const bad = await verifyRecord(tampered);
    assert("a tampered record fails", !bad.ok);
    assert("it fails on the digest", !bad.digestMatches);

    const trimmed = { ...record, findings: record.findings.filter((f) => f.cls === "preserved") };
    const replay = await verifyRecord(trimmed);
    assert("a record with the drift removed fails the verdict replay", !replay.verdictReproduces);

    const again = await runAudit(case1, { now: "2026-10-03T00:00:00.000Z" });
    assert("re-running the same input yields the same digest", again.record.digest === record.digest);
  }

  console.log("\n=== 8. normalizer keys ===");
  {
    const { arabicKey } = await import("../src/lib/audit/normalize");
    assert("alef variants collapse", arabicKey("أحمد") === arabicKey("احمد"));
    assert("ta-marbuta maps to ha", arabicKey("صلاة") === arabicKey("صلاه"));
    assert("yeh-with-hamza maps to yeh", arabicKey("حائل") === arabicKey("حايل"), arabicKey("حائل"));
    assert("tashkeel is dropped", arabicKey("النِّيَّة") === arabicKey("النيه"), arabicKey("النِّيَّة"));
  }

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("engine check passed");
};

run().catch((error) => {
  console.error("engine check crashed:", error);
  process.exit(1);
});
