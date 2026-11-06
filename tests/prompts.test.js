import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzePrompt, tailorPrompt, letterPrompt, industriesPrompt, checkAnalysis, checkTailor, checkLetter, checkIndustries } from "../src/prompts.js";

const ctx = { today: "2026-11-06", location: "Göteborg", profileName: "IT", cv: "MY CV TEXT", guard: "NEVER CLAIM X" };
const lead = { adText: "AD TEXT", url: "https://example.com/job", analysis: { language: "sv" }, match: { score: 8 } };

test("prompts carry the ad, CV, notes and honesty rules", () => {
  const a = analyzePrompt(lead, ctx);
  for (const s of ["AD TEXT", "MY CV TEXT", "NEVER CLAIM X", "2026-11-06", "Göteborg", "https://example.com/job"]) assert.ok(a.includes(s), s);
  const t = tailorPrompt(lead, ctx);
  assert.ok(t.includes("Never invent anything"));
  assert.ok(t.includes("Write the CV in Swedish"));
  assert.ok(letterPrompt(lead, ctx).includes("in Swedish"));
  assert.ok(industriesPrompt(ctx).includes("Göteborg"));
});

test("prompts work without a location", () => {
  assert.ok(!analyzePrompt(lead, { ...ctx, location: "" }).includes("based in"));
});

test("reply checks accept good shapes and reject bad ones", () => {
  assert.ok(checkAnalysis({ analysis: {}, match: {} }));
  assert.throws(() => checkAnalysis({ analysis: {} }), { code: "invalid_json" });
  assert.deepEqual(checkTailor({ cv: { sections: [] }, changes: ["a", null] }).changes, ["a"]);
  assert.throws(() => checkTailor({ cv: {} }), { code: "invalid_json" });
  assert.equal(checkLetter({ letter: { paragraphs: [] }, reason: "r" }).needReason, "r");
  assert.equal(checkIndustries({ industries: [{ industry: "A" }] }).length, 1);
  assert.throws(() => checkIndustries([]), { code: "invalid_json" });
});
