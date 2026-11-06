// App state: shape, defaults, saving to the browser, backups and imports.
// Storage is passed in (localStorage in the app, a fake in tests), so this file has no DOM access.

import { STORE_KEY, KEY_STORE_KEY, SCORE } from "./config.js";
import { DEMO_CV, DEMO_GUARD, DEMO_INDUSTRIES, DEMO_APPLIED, DEMO_LEADS, DEMO_NAME } from "./demo.js";
import { clampScore, uid, safeUrl } from "./util.js";

export const VERSION = 1;

const BLANK_GUARD = `Facts to keep exactly:
- (employer names, dates and locations the model must not change)

Skill levels (never overstate):
- (tools you only know a little)

Never claim:
- (things you don't have: licences, certificates, tools)
- Any numbers or results not written in the CV`;

/** A brand-new state. demo=true fills it with the fictional example person. */
export function freshState({ demo = true } = {}) {
  const profileId = uid("p");
  return {
    version: VERSION,
    demo,
    view: "leads",
    tab: "ad",
    selected: demo ? DEMO_LEADS[0].id : null,
    user: { name: demo ? DEMO_NAME : "", location: demo ? "Stockholm" : "" },
    llm: { provider: "anthropic", model: "", baseUrl: "" },
    leads: demo ? structuredClone(DEMO_LEADS) : [],
    profiles: [{ id: profileId, name: demo ? "General IT" : "My CV", file: demo ? "Demo CV" : "Paste or upload yours", text: demo ? DEMO_CV : "" }],
    activeProfile: profileId,
    guard: demo ? DEMO_GUARD : BLANK_GUARD,
    queries: demo ? "IT support, IT-tekniker, data center technician, automationstekniker" : "",
    industries: demo ? structuredClone(DEMO_INDUSTRIES) : [],
    applied: demo ? structuredClone(DEMO_APPLIED) : [],
  };
}

const str = (v, max = 200000) => (typeof v === "string" ? v.slice(0, max) : v == null ? "" : String(v).slice(0, max));
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);

/** Clean one lead from storage or an import. Returns null if it has no ad text. */
export function normalizeLead(x) {
  if (!obj(x)) return null;
  const adText = str(x.adText || x.description || x.text).trim();
  if (adText.length < 20) return null;
  const lead = {
    id: str(x.id) || uid("lead"),
    title: str(x.title, 200) || adText.split("\n")[0].slice(0, 70),
    company: str(x.company, 200) || "Unknown employer",
    location: str(x.location, 200),
    source: str(x.source, 100) || "Imported",
    url: safeUrl(x.url),
    posted: str(x.posted, 100),
    deadline: str(x.deadline, 100),
    type: str(x.type, 100),
    adText,
  };
  // Generated results are kept only when they have the expected shape.
  if (obj(x.analysis) && obj(x.match)) {
    lead.analysis = x.analysis;
    lead.match = { ...x.match, score: clampScore(x.match.score) };
    lead.profile = str(x.profile, 200);
  }
  if (lead.analysis && obj(x.cv) && Array.isArray(x.cv.sections)) {
    Object.assign(lead, { cv: x.cv, cvProfile: str(x.cvProfile, 200), changes: Array.isArray(x.changes) ? x.changes : [], notClaimed: Array.isArray(x.notClaimed) ? x.notClaimed : [] });
    if (obj(x.letter) && Array.isArray(x.letter.paragraphs)) {
      Object.assign(lead, { letter: x.letter, need: str(x.need, 40), needReason: str(x.needReason, 500), checks: Array.isArray(x.checks) ? x.checks : [] });
    }
  }
  if (x.titleSet) lead.titleSet = true;
  if (x.companySet) lead.companySet = true;
  return lead;
}

/** Make any saved/imported object safe to use as state. Unknown fields are dropped. */
export function normalize(raw) {
  const base = freshState({ demo: false });
  if (!obj(raw)) return freshState({ demo: true });
  const s = { ...base };
  s.demo = !!raw.demo;
  s.view = ["leads", "find", "cv", "settings"].includes(raw.view) ? raw.view : "leads";
  s.tab = ["ad", "analysis", "match", "cv", "letter"].includes(raw.tab) ? raw.tab : "ad";
  s.user = { name: str(obj(raw.user)?.name, 120), location: str(obj(raw.user)?.location, 120) };
  const llm = obj(raw.llm) || {};
  s.llm = { provider: str(llm.provider, 40) || "anthropic", model: str(llm.model, 200), baseUrl: str(llm.baseUrl, 500) };
  s.leads = (Array.isArray(raw.leads) ? raw.leads : []).map(normalizeLead).filter(Boolean);
  const profiles = (Array.isArray(raw.profiles) ? raw.profiles : [])
    .filter(obj)
    .map((p) => ({ id: str(p.id, 80) || uid("p"), name: str(p.name, 120) || "Untitled profile", file: str(p.file, 200), text: str(p.text) }));
  s.profiles = profiles.length ? profiles : base.profiles;
  s.activeProfile = s.profiles.some((p) => p.id === raw.activeProfile) ? raw.activeProfile : s.profiles[0].id;
  s.guard = typeof raw.guard === "string" ? str(raw.guard, 20000) : base.guard;
  s.queries = str(raw.queries, 2000);
  s.industries = (Array.isArray(raw.industries) ? raw.industries : []).filter((i) => obj(i) && i.industry).slice(0, 12);
  s.applied = (Array.isArray(raw.applied) ? raw.applied : [])
    .filter(obj)
    .map((a) => ({ company: str(a.company, 200), role: str(a.role, 200), when: str(a.when, 40), status: str(a.status, 120), ...(a.leadId ? { leadId: str(a.leadId, 80) } : {}) }))
    .filter((a) => a.company);
  s.selected = s.leads.some((l) => l.id === raw.selected) ? raw.selected : s.leads[0]?.id ?? null;
  return s;
}

// ---------- browser storage ----------

export function loadState(storage) {
  try {
    const raw = storage && storage.getItem(STORE_KEY);
    return raw ? normalize(JSON.parse(raw)) : freshState({ demo: true });
  } catch {
    return freshState({ demo: true });
  }
}

/** Save everything except fields that start with "_" (temporary UI state). Returns false if storage is full or blocked. */
export function saveState(storage, S) {
  try {
    const out = {};
    for (const k of Object.keys(S)) if (!k.startsWith("_")) out[k] = S[k];
    storage.setItem(STORE_KEY, JSON.stringify(out));
    return true;
  } catch {
    return false;
  }
}

/** The API key lives apart from the rest so backups never include it. */
export function loadKey(local, session) {
  try {
    return (session && session.getItem(KEY_STORE_KEY)) || (local && local.getItem(KEY_STORE_KEY)) || "";
  } catch {
    return "";
  }
}
export function saveKey(local, session, key, remember) {
  try {
    local && local.removeItem(KEY_STORE_KEY);
    session && session.removeItem(KEY_STORE_KEY);
    if (key) (remember ? local : session).setItem(KEY_STORE_KEY, key);
  } catch {
    /* storage blocked: the key then lives only in memory for this visit */
  }
}
export function keyIsRemembered(local) {
  try {
    return !!(local && local.getItem(KEY_STORE_KEY));
  } catch {
    return false;
  }
}

// ---------- backup and import ----------

export function exportBackup(S, now = new Date()) {
  const data = {};
  for (const k of Object.keys(S)) if (!k.startsWith("_")) data[k] = S[k];
  return { app: "jobhunt-studio", version: VERSION, exportedAt: now.toISOString(), data };
}

/** Accepts a backup file object; returns a clean state or throws Error. */
export function parseBackup(obj_) {
  if (!obj(obj_) || obj_.app !== "jobhunt-studio" || !obj(obj_.data)) throw new Error("not_backup");
  return normalize({ ...obj_.data, demo: false });
}

/** Accepts [lead, …] or {leads:[…]} (the format the agent workflow writes). */
export function parseLeadsImport(json) {
  const list = Array.isArray(json) ? json : obj(json) && Array.isArray(json.leads) ? json.leads : null;
  if (!list) throw new Error("not_leads");
  const leads = list.map(normalizeLead).filter(Boolean);
  if (!leads.length) throw new Error("no_leads");
  return leads;
}

/** Add imported leads, skipping ones already present (same URL, or same title + company). */
export function mergeLeads(existing, incoming) {
  const key = (l) => (l.url ? `u:${l.url}` : `t:${l.title.toLowerCase()}|${l.company.toLowerCase()}`);
  const seen = new Set(existing.map(key));
  const ids = new Set(existing.map((l) => l.id));
  const added = [];
  for (const l of incoming) {
    if (seen.has(key(l))) continue;
    seen.add(key(l));
    added.push(ids.has(l.id) ? { ...l, id: uid("lead") } : l);
  }
  return { leads: [...added, ...existing], added: added.length };
}

// ---------- derived values used by the views ----------

/** Which of the five steps are done: found, analyzed, scored, CV, letter. */
export function stages(l) {
  return [true, !!l.analysis, !!l.match, !!l.cv, !!l.letter];
}

/** Split leads into the inbox groups. */
export function groupLeads(leads) {
  const scored = (l) => l.match && typeof l.match.score === "number";
  return {
    fresh: leads.filter((l) => !scored(l)),
    now: leads.filter((l) => scored(l) && l.match.score >= SCORE.apply && l.match.score < SCORE.perfect).sort((a, b) => b.match.score - a.match.score),
    sugg: leads.filter((l) => scored(l) && (l.match.score === SCORE.perfect || (l.match.score >= SCORE.stretch && l.match.score < SCORE.apply))),
    below: leads.filter((l) => scored(l) && l.match.score < SCORE.stretch),
  };
}

/** Earlier application to the same company, if any. */
export function appliedHit(l, applied) {
  const c = String(l.company || "").toLowerCase();
  if (!c) return null;
  return applied.find((a) => a.company && c.includes(a.company.toLowerCase())) || null;
}
