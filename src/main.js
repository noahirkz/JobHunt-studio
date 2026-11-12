// Entry point: holds the state, renders the current view and handles every click, input and file.
// Views are plain functions that return HTML strings (src/views/*). Clicks are routed by data-act.

import { loadState, saveState, freshState, loadKey, saveKey, keyIsRemembered, exportBackup, parseBackup, parseLeadsImport, mergeLeads } from "./store.js";
import { STORE_KEY, KEY_STORE_KEY } from "./config.js";
import { askJSON, notReadyReason, errorMessage, resolveSettings } from "./llm.js";
import { analyzePrompt, tailorPrompt, letterPrompt, industriesPrompt, checkAnalysis, checkTailor, checkLetter, checkIndustries } from "./prompts.js";
import { cvText, letterText, cvDocXml, letterDocXml, buildDocx, docxToText, odtToText, saveBlob } from "./documents.js";
import { esc, slug, todayISO, uid, clampScore, hostOf, safeUrl } from "./util.js";
import { viewLeads } from "./views/leads.js";
import { viewFind, boardTable, parseQueries } from "./views/find.js";
import { viewCV } from "./views/cv.js";
import { viewSettings } from "./views/settings.js";

const local = safeStorage(() => window.localStorage);
const session = safeStorage(() => window.sessionStorage);

let S = loadState(local);
let apiKey = loadKey(local, session);
let keyRemembered = keyIsRemembered(local);
let busy = null; // {id, kind, ctl}
let error = null; // {id, msg}
let removeArm = null; // id waiting for a second click
let test = null; // {ok, msg}

const app = document.getElementById("app");

function safeStorage(get) {
  try {
    const s = get();
    s.getItem("x");
    return s;
  } catch {
    return null;
  }
}

// ---------- helpers ----------

function llmSettings() {
  return { ...S.llm, apiKey };
}
function ui() {
  const notReady = notReadyReason(llmSettings());
  return { ready: !notReady, notReady, busy, error, removeArm, today: todayISO(), apiKey, keyRemembered, test };
}
function active() {
  return S.profiles.find((p) => p.id === S.activeProfile) || S.profiles[0];
}
function getLead(id) {
  return S.leads.find((l) => l.id === id);
}
function save() {
  if (!local) return;
  if (!saveState(local, S)) toast("Couldn't save: the browser's storage is full or blocked. Download a backup in Settings.");
}
let saveT;
function saveSoon() {
  clearTimeout(saveT);
  saveT = setTimeout(save, 400);
}

let toastT;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.hidden = true), 2600);
}

// ---------- rendering ----------

function render() {
  for (const v of ["leads", "find", "cv", "settings"]) document.getElementById("v-" + v).setAttribute("aria-pressed", String(S.view === v));
  const u = ui();
  app.innerHTML = S.view === "find" ? viewFind(S, u) : S.view === "cv" ? viewCV(S, u, active()) : S.view === "settings" ? viewSettings(S, u) : viewLeads(S, u, active());
  renderLive();
}

function renderLive() {
  const u = ui();
  const el = document.getElementById("live");
  el.className = "live " + (u.ready ? "on" : "off");
  el.querySelector("span").textContent = u.ready ? `Model: ${resolveSettings(llmSettings()).model}` : "No model connected";
  const chip = document.getElementById("llm-status");
  if (chip) chip.outerHTML = statusChip(u);
}
function statusChip(u) {
  return u.ready ? `<span class="chip" id="llm-status">Ready: ${esc(resolveSettings(llmSettings()).model)}</span>` : `<span class="chip warn" id="llm-status">${esc(u.notReady)}</span>`;
}

// ---------- model steps ----------

const LABELS = {
  analyze: "Reading the ad and scoring it against your CV",
  tailor: "Tailoring your CV to this ad",
  letter: "Writing the cover letter",
};

function context() {
  const p = active();
  return { today: todayISO(), location: S.user.location, profileName: p.name, cv: p.text, guard: S.guard };
}

function startTimer(label) {
  const t0 = Date.now();
  const tick = () => {
    const el = document.getElementById("runtext");
    if (el) el.textContent = `${label}… ${Math.round((Date.now() - t0) / 1000)} s`;
  };
  tick();
  return setInterval(tick, 1000);
}

async function run(kind, id) {
  const l = getLead(id);
  if (!l || busy) return;
  if (kind !== "analyze" && !l.analysis) return;
  if (!active().text.trim()) {
    error = { id, msg: "Your CV is empty. Paste it under My CV first." };
    return render();
  }
  const ctl = new AbortController();
  busy = { id, kind, ctl };
  error = null;
  render();
  const timer = startTimer(LABELS[kind]);
  try {
    const ctx = context();
    const prompt = kind === "analyze" ? analyzePrompt(l, ctx) : kind === "tailor" ? tailorPrompt(l, ctx) : letterPrompt(l, ctx);
    const out = await askJSON(llmSettings(), prompt, { signal: ctl.signal });
    if (kind === "analyze") {
      const r = checkAnalysis(out);
      r.match.score = clampScore(r.match.score);
      for (const k of ["cv", "cvProfile", "changes", "notClaimed", "letter", "need", "needReason", "checks"]) delete l[k];
      Object.assign(l, { analysis: r.analysis, match: r.match, profile: active().name });
      if (!l.titleSet && r.analysis.title) l.title = r.analysis.title;
      if (!l.companySet && r.analysis.company) l.company = r.analysis.company;
      if (r.analysis.location) l.location = r.analysis.location;
      S.tab = "match";
    } else if (kind === "tailor") {
      for (const k of ["letter", "need", "needReason", "checks"]) delete l[k];
      Object.assign(l, checkTailor(out), { cvProfile: active().name });
      S.tab = "cv";
    } else {
      Object.assign(l, checkLetter(out));
      S.tab = "letter";
    }
    save();
    toast(kind === "analyze" ? "Scored" : kind === "tailor" ? "CV tailored" : "Cover letter written");
  } catch (e) {
    if (!e || e.code !== "cancelled") error = { id, msg: errorMessage(e) };
  } finally {
    clearInterval(timer);
    busy = null;
    render();
  }
}

async function runIndustries() {
  if (busy) return;
  if (!active().text.trim()) {
    error = { id: "industries", msg: "Your CV is empty. Paste it under My CV first." };
    return render();
  }
  const ctl = new AbortController();
  busy = { id: "industries", kind: "industries", ctl };
  error = null;
  render();
  try {
    S.industries = checkIndustries(await askJSON(llmSettings(), industriesPrompt(context()), { signal: ctl.signal }));
    save();
    toast("New ideas added");
  } catch (e) {
    if (!e || e.code !== "cancelled") error = { id: "industries", msg: errorMessage(e) };
  } finally {
    busy = null;
    render();
  }
}

async function testConnection() {
  if (busy) return;
  const ctl = new AbortController();
  busy = { id: "test", kind: "test", ctl };
  test = null;
  render();
  try {
    const out = await askJSON(llmSettings(), 'Reply with only this JSON: {"ok": true}', { signal: ctl.signal });
    test = out && typeof out === "object" ? { ok: true } : { ok: false, msg: errorMessage({ code: "invalid_json" }) };
  } catch (e) {
    test = { ok: false, msg: errorMessage(e) };
  } finally {
    busy = null;
    render();
  }
}

// ---------- documents ----------

function docName(l, kind) {
  const who = (l.cv && l.cv.name) || S.user.name || "Me";
  const nameSlug = slug(String(who).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
  return `${nameSlug}_${kind === "cv" ? "CV" : "CoverLetter"}_${slug(l.company.split("(")[0])}_${slug(l.title)}.docx`;
}

async function download(kind) {
  const l = getLead(S.selected);
  if (!l || !(kind === "cv" ? l.cv : l.letter)) return;
  try {
    const xml = kind === "cv" ? cvDocXml(l.cv) : letterDocXml(l.letter, l.cv, { name: S.user.name, date: todayISO() });
    saveBlob(await buildDocx(xml), docName(l, kind));
    toast("Downloaded");
  } catch (e) {
    toast(e && e.message === "nozip" ? "The Word export didn't load. Use Copy text instead." : "Couldn't create the file. Use Copy text instead.");
  }
}

async function copy(kind) {
  const l = getLead(S.selected);
  if (!l) return;
  const text = kind === "cv" ? cvText(l.cv) : letterText(l.letter, l.cv, { name: S.user.name, date: todayISO() });
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied");
  } catch {
    toast("Copy was blocked. Select the text on the page and copy it manually.");
  }
}

function readJSONFile(file) {
  return file.text().then((t) => JSON.parse(t));
}

// ---------- events ----------

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  if (el.tagName === "A" && el.getAttribute("href") === "#") e.preventDefault();
  const armed = removeArm;
  if (!["remove", "profile-remove", "wipe", "load-demo"].includes(act)) removeArm = null;

  switch (act) {
    case "view":
      S.view = el.dataset.v;
      S._adding = false;
      test = null;
      save();
      render();
      window.scrollTo({ top: 0 });
      break;
    case "select": {
      S.selected = el.dataset.id;
      S.view = "leads";
      error = null;
      const l = getLead(S.selected);
      S.tab = l && l.cv ? "cv" : l && l.match ? "match" : "ad";
      save();
      render();
      if (window.innerWidth < 900) document.querySelector(".ws")?.scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
    case "tab":
      S.tab = el.dataset.t;
      save();
      render();
      break;
    case "run":
      run(el.dataset.k, S.selected);
      break;
    case "stop":
      busy && busy.ctl.abort();
      break;
    case "copy":
      copy(el.dataset.k);
      break;
    case "dl":
      download(el.dataset.k);
      break;
    case "add-open":
      S._adding = S.view === "leads" ? !S._adding : true;
      S.view = "leads";
      render();
      if (S._adding) {
        window.scrollTo({ top: 0 });
        document.getElementById("f-text")?.focus();
      }
      break;
    case "add-cancel":
      S._adding = false;
      render();
      break;
    case "remove":
      if (armed === el.dataset.id) {
        S.leads = S.leads.filter((x) => x.id !== el.dataset.id);
        S.selected = S.leads[0]?.id ?? null;
        removeArm = null;
        save();
        render();
        toast("Lead removed");
      } else {
        removeArm = el.dataset.id;
        render();
      }
      break;
    case "mark-applied": {
      const l = getLead(el.dataset.id);
      if (!l) break;
      S.applied.unshift({ company: l.company, role: l.title, when: todayISO(), status: "Applied", leadId: l.id });
      save();
      render();
      toast("Added to your applied list");
      break;
    }
    case "applied-remove":
      S.applied.splice(Number(el.dataset.i), 1);
      save();
      render();
      break;
    case "pick-profile":
      S._cvProfile = el.dataset.id;
      render();
      break;
    case "use-profile":
      S.activeProfile = el.dataset.id;
      save();
      render();
      toast(`“${active().name}” is now used for new runs`);
      break;
    case "profile-new":
      addProfile("New profile", "", "Added by you");
      break;
    case "profile-remove":
      if (armed === el.dataset.id) {
        S.profiles = S.profiles.filter((p) => p.id !== el.dataset.id);
        if (S.activeProfile === el.dataset.id) S.activeProfile = S.profiles[0].id;
        S._cvProfile = S.profiles[0].id;
        removeArm = null;
        save();
        render();
        toast("Profile removed");
      } else {
        removeArm = el.dataset.id;
        render();
      }
      break;
    case "addq": {
      const cur = parseQueries(S.queries);
      if (!cur.includes(el.dataset.q)) cur.push(el.dataset.q);
      S.queries = cur.join(", ");
      save();
      render();
      toast(`Added “${el.dataset.q}”`);
      break;
    }
    case "industries":
      runIndustries();
      break;
    case "test-llm":
      testConnection();
      break;
    case "start-fresh": {
      const own = S.leads.filter((l) => !l.id.startsWith("demo-"));
      const llm = S.llm;
      S = freshState({ demo: false });
      Object.assign(S, { llm, leads: own, selected: own[0]?.id ?? null, view: "cv" });
      save();
      render();
      toast("Demo data removed. Paste your CV to begin.");
      document.getElementById("ptext")?.focus();
      break;
    }
    case "load-demo":
      if (armed === "demo") {
        const llm = S.llm;
        S = freshState({ demo: true });
        S.llm = llm;
        removeArm = null;
        save();
        render();
        toast("Demo data loaded");
      } else {
        removeArm = "demo";
        render();
      }
      break;
    case "wipe":
      if (armed === "wipe") {
        try {
          local?.removeItem(STORE_KEY);
          local?.removeItem(KEY_STORE_KEY);
          session?.removeItem(KEY_STORE_KEY);
        } catch {
          /* ignore */
        }
        S = freshState({ demo: false });
        S.view = "settings";
        apiKey = "";
        keyRemembered = false;
        removeArm = null;
        save();
        render();
        toast("All data deleted from this browser");
      } else {
        removeArm = "wipe";
        render();
      }
      break;
    case "backup-export": {
      const blob = new Blob([JSON.stringify(exportBackup(S), null, 2)], { type: "application/json" });
      saveBlob(blob, `jobhunt-studio-backup-${todayISO()}.json`);
      toast("Backup downloaded");
      break;
    }
  }
});

document.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "addForm") {
    const text = document.getElementById("f-text").value.trim();
    if (text.length < 80) return toast("Paste the full ad text (at least a few lines).");
    const url = safeUrl(document.getElementById("f-url").value);
    const title = document.getElementById("f-title").value.trim();
    const company = document.getElementById("f-company").value.trim();
    const host = hostOf(url);
    const id = uid("lead");
    S.leads.unshift({
      id, title: title || text.split("\n")[0].slice(0, 70), titleSet: !!title, company: company || host || "Unknown employer", companySet: !!company,
      location: "", source: host || "Added by you", url, posted: "Added " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }), deadline: "", type: "", adText: text,
    });
    S.selected = id;
    S.tab = "ad";
    S._adding = false;
    save();
    render();
    toast("Lead added — run Analyze & score");
  } else if (e.target.id === "appliedForm") {
    const company = document.getElementById("ap-company").value.trim();
    if (!company) return;
    S.applied.unshift({ company, role: document.getElementById("ap-role").value.trim(), when: todayISO(), status: document.getElementById("ap-status").value.trim() || "Applied" });
    save();
    render();
  }
});

document.addEventListener("input", (e) => {
  const id = e.target.id;
  const v = e.target.value;
  const selP = () => S.profiles.find((p) => p.id === S._cvProfile) || active();
  switch (id) {
    case "ptext":
      selP().text = v;
      break;
    case "pname":
      selP().name = v || "Untitled profile";
      document.querySelectorAll('.ptab[aria-current="true"] .t').forEach((t) => {
        const b = t.querySelector(".badge");
        t.textContent = selP().name;
        if (b) t.appendChild(b);
      });
      break;
    case "guard":
      S.guard = v;
      break;
    case "q-in":
    case "loc-in":
      if (id === "q-in") S.queries = v;
      else S.user.location = v;
      document.getElementById("boards").innerHTML = boardTable(parseQueries(S.queries), S.user.location);
      break;
    case "user-name":
      S.user.name = v;
      break;
    case "user-loc":
      S.user.location = v;
      break;
    case "llm-key":
      apiKey = v.trim();
      saveKey(local, session, apiKey, keyRemembered);
      test = null;
      renderLive();
      return;
    case "llm-model":
      S.llm.model = v.trim();
      test = null;
      renderLive();
      break;
    case "llm-base":
      S.llm.baseUrl = v.trim();
      test = null;
      renderLive();
      break;
    default:
      return;
  }
  saveSoon();
});

function addProfile(name, text, file) {
  const id = uid("p");
  S.profiles.push({ id, name, text, file });
  S._cvProfile = id;
  save();
  render();
  document.getElementById(text ? "pname" : "ptext")?.focus();
  toast("Profile added");
}

/** Read the text of an uploaded CV. PDF support loads pdf.js only when a PDF is picked. */
async function readCVFile(f) {
  const ext = (f.name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || "";
  if (ext === "pdf") return (await import("./pdf.js")).pdfToText(f);
  if (ext === "docx") return docxToText(f);
  if (ext === "odt") return odtToText(f);
  if (ext === "txt" || ext === "md") {
    const text = await f.text();
    // A PDF or Word file renamed to .txt is binary: refuse it instead of saving garbage as the CV.
    if (text.includes("\u0000")) throw new Error("binary");
    return text;
  }
  throw new Error("unsupported");
}

function cvReadMessage(err) {
  const messages = {
    nozip: "The Word/OpenDocument reader didn't load. Paste the text into a blank profile instead.",
    password: "That PDF is password-protected. Remove the password, or paste the text instead.",
    scanned: "That PDF has no text layer (it's a scan). Paste the text, or use a text-based PDF.",
    notpdf: "That doesn't look like a valid PDF.",
    notdocx: "That doesn't look like a valid .docx file.",
    notodt: "That doesn't look like a valid .odt file.",
    binary: "That file isn't plain text. Upload a PDF, Word (.docx), OpenDocument (.odt) or text file instead.",
    unsupported: "That file type isn't supported. Upload a PDF, Word (.docx), OpenDocument (.odt) or text file, or paste the text.",
    empty: "That file has no text in it.",
  };
  return messages[err && err.message] || "Couldn't read that file. Try a PDF, .docx, .odt or .txt file.";
}

document.addEventListener("change", async (e) => {
  const id = e.target.id;
  if (id === "ws-profile") {
    S.activeProfile = e.target.value;
    save();
    render();
    return toast(`“${active().name}” will be used for the next step`);
  }
  if (id === "llm-provider") {
    S.llm = { provider: e.target.value, model: "", baseUrl: "" };
    test = null;
    save();
    return render();
  }
  if (id === "llm-remember") {
    keyRemembered = e.target.checked;
    saveKey(local, session, apiKey, keyRemembered);
    return toast(keyRemembered ? "Key will be remembered on this device" : "Key will be forgotten when you close the tab");
  }
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  e.target.value = "";
  if (id === "cv-file") {
    try {
      const text = await readCVFile(f);
      if (!text.trim()) throw new Error("empty");
      addProfile(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 60) || "Uploaded CV", text, f.name);
    } catch (err) {
      toast(cvReadMessage(err));
    }
  } else if (id === "leads-file") {
    try {
      const { leads, added } = mergeLeads(S.leads, parseLeadsImport(await readJSONFile(f)));
      S.leads = leads;
      if (added) S.selected = leads[0].id;
      save();
      render();
      toast(added ? `Imported ${added} lead${added === 1 ? "" : "s"}` : "No new leads: they were all already here");
    } catch {
      toast("That file isn't a leads list. See workflow/examples/leads.example.json for the format.");
    }
  } else if (id === "backup-file") {
    try {
      const llm = S.llm;
      S = parseBackup(await readJSONFile(f));
      S.llm = S.llm.provider ? S.llm : llm;
      S.view = "settings";
      save();
      render();
      toast("Backup restored");
    } catch {
      toast("That file isn't a Jobhunt Studio backup.");
    }
  }
});

window.addEventListener("storage", (e) => {
  // Another tab changed the data: reload it rather than overwrite it later.
  if (e.key === STORE_KEY && !busy) {
    S = loadState(local);
    render();
  }
});

render();
