import { test } from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize, loadState, saveState, saveKey, loadKey, exportBackup, parseBackup, parseLeadsImport, mergeLeads, groupLeads, appliedHit, normalizeLead } from "../src/store.js";
import { readFileSync } from "node:fs";

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

test("first visit shows demo data", () => {
  const s = loadState(memStorage());
  assert.equal(s.demo, true);
  assert.ok(s.leads.length >= 3);
});

test("save and load round-trip, dropping temporary _fields", () => {
  const st = memStorage();
  const s = freshState({ demo: false });
  s.user.name = "Kim";
  s._adding = true;
  saveState(st, s);
  const back = loadState(st);
  assert.equal(back.user.name, "Kim");
  assert.equal(back._adding, undefined);
});

test("normalize repairs broken data", () => {
  const s = normalize({ leads: [{ adText: "short" }, { adText: "x".repeat(50), url: "javascript:alert(1)" }], profiles: [], view: "hack" });
  assert.equal(s.leads.length, 1);
  assert.equal(s.leads[0].url, "");
  assert.equal(s.view, "leads");
  assert.equal(s.profiles.length, 1);
});

test("API key is kept apart and backups never include it", () => {
  const local = memStorage(), session = memStorage();
  saveKey(local, session, "secret", false);
  assert.equal(loadKey(local, session), "secret");
  assert.equal(local.getItem("jobhunt-studio-apikey"), null);
  saveKey(local, session, "secret", true);
  assert.equal(session.getItem("jobhunt-studio-apikey"), null);
  const b = JSON.stringify(exportBackup(freshState()));
  assert.ok(!b.includes("secret"));
});

test("backup round-trip", () => {
  const s = freshState({ demo: false });
  s.user.name = "Kim";
  const back = parseBackup(JSON.parse(JSON.stringify(exportBackup(s))));
  assert.equal(back.user.name, "Kim");
  assert.throws(() => parseBackup({ foo: 1 }));
});

test("leads import accepts the example file and skips duplicates", () => {
  const json = JSON.parse(readFileSync(new URL("../workflow/examples/leads.example.json", import.meta.url)));
  const leads = parseLeadsImport(json);
  assert.ok(leads.length >= 2);
  const once = mergeLeads([], leads);
  const twice = mergeLeads(once.leads, parseLeadsImport(json));
  assert.equal(twice.added, 0);
  assert.throws(() => parseLeadsImport({ nope: 1 }));
});

test("imported pre-scored leads keep a clamped score", () => {
  const l = normalizeLead({ adText: "x".repeat(40), analysis: {}, match: { score: 99 } });
  assert.equal(l.match.score, 10);
});

test("groupLeads follows the 7+/10/stretch rules", () => {
  const mk = (score) => ({ match: score == null ? undefined : { score } });
  const g = groupLeads([mk(null), mk(8), mk(10), mk(6), mk(3), mk(9)]);
  assert.equal(g.fresh.length, 1);
  assert.deepEqual(g.now.map((l) => l.match.score), [9, 8]);
  assert.equal(g.sugg.length, 2);
  assert.equal(g.below.length, 1);
});

test("appliedHit matches company names", () => {
  assert.ok(appliedHit({ company: "Nordlys Data Centers AB" }, [{ company: "Nordlys Data Centers" }]));
  assert.equal(appliedHit({ company: "" }, [{ company: "x" }]), null);
});
