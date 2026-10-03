/**
 * Print the sealed digest for the shipped example, with a frozen timestamp.
 *
 * The deck and the documentation quote a digest; this is the tool that produced
 * it, so a reviewer can reproduce the exact value instead of trusting the copy.
 * A fixed `now` is what makes it reproducible — the timestamp is part of what the
 * digest covers, so a live run legitimately yields a different one.
 *
 *     bun scripts/record-digest.ts
 */
import { runAudit, buildConstraintBank, verifyRecord } from "../src/lib/audit/index";
const bank = buildConstraintBank();
const input = {
  sourceText: "لا يجوز بيع الطعام قبل قبضه، ويجب على البائع بيانه للمشتري.",
  derivedText: "It is not recommended to sell food before taking possession, and the seller must clarify it to the buyer.",
  workType: "translate" as const,
  contentLevel: "B" as const,
  targetLanguage: "en",
  bank,
  reviewerDecision: null,
};
const { result, record } = await runAudit(input, { now: "2026-10-03T00:00:00.000Z" });
console.log("DIGEST=" + record.digest);
console.log("BANK_VERSION=" + record.bank.version);
console.log("ENGINE_VERSION=" + record.engineVersion);
console.log("MODEL=" + JSON.stringify(record.model));
console.log("VERDICT=" + result.verdict);
const v = await verifyRecord(record);
console.log("VERIFY_OK=" + v.ok);
console.log("FINDINGS=" + result.findings.length + " L1=" + result.layerSummary.L1.checked + " L2=" + result.layerSummary.L2.checked);
