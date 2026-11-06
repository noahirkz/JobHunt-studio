// Leads view: the inbox on the left and the five-step workspace for the selected lead.

import { esc, fmtDate, safeUrl } from "../util.js";
import { stages, groupLeads, appliedHit } from "../store.js";
import { SCORE } from "../config.js";
import { scoreClass, ul, runBtn, emptyState, errorBox, demoBanner } from "./shared.js";

const TABS = [["ad", "Ad"], ["analysis", "Analysis"], ["match", "Score"], ["cv", "Tailored CV"], ["letter", "Cover letter"]];

export function viewLeads(S, ui, active) {
  const leads = S.leads;
  const g = groupLeads(leads);
  const l = leads.find((x) => x.id === S.selected) || leads[0];
  const ready = leads.filter((x) => x.cv && x.letter).length;
  const hour = new Date().getHours();
  const greet = hour < 10 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = String(S.user.name || "").trim().split(/\s+/)[0];
  const grp = (title, arr) => (arr.length ? `<div class="group"><div class="eyebrow"><span>${title}</span><span>${arr.length}</span></div>${arr.map((x) => leadCard(x, S)).join("")}</div>` : "");
  const high = leads.filter((x) => x.match && x.match.score >= SCORE.apply).length;

  return `${demoBanner(S)}<section class="hello">
      <h2>${greet}${first ? ", " + esc(first) : ""}</h2>
      <p>Your job hunt at a glance. Pick a lead, check the score, and send a tailored CV.</p>
      <div class="stats">
        <div class="stat"><b class="blue">${leads.length}</b><span>open leads</span></div>
        <div class="stat"><b>${high}</b><span>scored 7 or higher</span></div>
        <div class="stat"><b>${ready}</b><span>ready to send</span></div>
        <div class="stat"><b>${S.applied.length}</b><span>already applied</span></div>
      </div>
    </section>
    <div class="desk">
    <aside class="inbox" aria-label="Leads">
      <div class="inbox-head"><h2>Leads</h2><span class="eyebrow">${esc(fmtDate(ui.today))}</span></div>
      ${S._adding ? addForm() : ""}
      ${grp("New — not scored", g.fresh)}
      ${grp("Apply now · 7+", g.now)}
      ${grp("Suggestions · 10/10 or stretch", g.sugg)}
      ${g.below.length ? `<details class="below"><summary><span class="eyebrow">Below the bar · ${g.below.length} hidden</span></summary>${grp("Under 5", g.below)}</details>` : ""}
      ${!leads.length && !S._adding ? `<div class="empty"><h3>No leads yet</h3><p>Paste a job ad with “+ Add a job ad”, or search the boards under Find leads.</p><button type="button" class="btn primary" data-act="add-open">+ Add a job ad</button></div>` : ""}
    </aside>
    ${l ? workspace(l, S, ui, active) : ""}
  </div>`;
}

function leadCard(l, S) {
  const s = l.match ? l.match.score : null;
  const st = stages(l);
  const hit = appliedHit(l, S.applied);
  return `<button type="button" class="lead" data-act="select" data-id="${esc(l.id)}" aria-current="${l.id === S.selected}">
    <span class="t">${esc(l.title)}</span>
    <span class="pill ${scoreClass(s)}">${s == null ? "New" : s + "/10"}</span>
    <span class="c">${esc(l.company)}${l.location ? " · " + esc(l.location) : ""}</span>
    <span class="meta"><span class="chip">${esc(l.source || "Added by you")}</span>${hit ? `<span class="chip warn">Applied to ${esc(hit.company)} before</span>` : ""}
      <span class="dots" aria-label="${st.filter(Boolean).length} of 5 steps done">${st.map((d) => `<i class="${d ? "on" : ""}"></i>`).join("")}</span></span>
  </button>`;
}

function addForm() {
  return `<form class="card" id="addForm" style="display:flex;flex-direction:column;gap:12px;padding:16px">
    <div class="field"><label for="f-text">Job ad text</label><textarea id="f-text" rows="7" required placeholder="Paste the whole ad: role, tasks, requirements, how to apply."></textarea></div>
    <div class="field"><label for="f-url">Link to the ad</label><input id="f-url" type="url" placeholder="https://…"></div>
    <div class="formgrid">
      <div class="field"><label for="f-title">Role</label><input id="f-title" type="text" placeholder="Filled in by the analysis"></div>
      <div class="field"><label for="f-company">Company</label><input id="f-company" type="text" placeholder="Filled in by the analysis"></div>
    </div>
    <div class="row-actions"><button class="btn primary" type="submit">Add lead</button><button class="btn ghost" type="button" data-act="add-cancel">Cancel</button></div>
  </form>`;
}

function workspace(l, S, ui, active) {
  const st = stages(l);
  const isBusy = ui.busy && ui.busy.id === l.id;
  const hit = appliedHit(l, S.applied);
  const url = safeUrl(l.url);
  const alreadyMarked = S.applied.some((a) => a.leadId === l.id || (a.company === l.company && a.role === l.title));
  let next = "";
  if (!isBusy) {
    if (!l.analysis) next = runBtn(ui, "analyze", "Analyze & score", true);
    else if (!l.cv) next = runBtn(ui, "tailor", l.match && l.match.score < SCORE.apply ? "Tailor anyway" : "Tailor CV", l.match && l.match.score >= SCORE.apply);
    else if (!l.letter) next = runBtn(ui, "letter", "Write cover letter", true);
    else next = url ? `<a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener">Open ad to apply ↗</a>` : "";
  }
  const markBtn = l.cv && !alreadyMarked ? `<button type="button" class="btn small" data-act="mark-applied" data-id="${esc(l.id)}">Mark as applied</button>` : "";
  const tab = TABS.some((t) => t[0] === S.tab) ? S.tab : "ad";
  const body = tab === "ad" ? tabAd(l) : tab === "analysis" ? tabAnalysis(l, ui) : tab === "match" ? tabMatch(l, ui) : tab === "cv" ? tabCV(l, ui) : tabLetter(l, S, ui);

  return `<section class="ws" aria-label="Workspace">
    <div class="ws-head">
      <div class="ws-title">
        <div style="min-width:0">
          <div class="eyebrow">${esc(l.source || "Added by you")}${l.posted ? " · " + esc(l.posted) : ""}</div>
          <h2 style="margin-top:6px">${esc(l.title)}</h2>
          <div class="sub">${esc(l.company)}${l.location ? " · " + esc(l.location) : ""}${url ? ` · <a href="${esc(url)}" target="_blank" rel="noopener">Original ad ↗</a>` : ""}</div>
        </div>
        <div class="ws-actions">${next}${markBtn}<button type="button" class="btn small ghost" data-act="remove" data-id="${esc(l.id)}">${ui.removeArm === l.id ? "Click again to remove" : "Remove"}</button></div>
      </div>
      ${completeness(st)}
      <div class="steps">${["Found", "Analyzed", "Scored", "CV tailored", "Letter"].map((n, i) => `<span class="step ${st[i] ? "done" : ""}"><b></b><span class="sn">Step ${i + 1} •</span> ${n}</span>`).join("")}</div>
      <div class="profilebar">
        <label for="ws-profile">CV profile</label>
        <select id="ws-profile" ${isBusy ? "disabled" : ""}>${S.profiles.map((p) => `<option value="${esc(p.id)}" ${p.id === active.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
        ${l.profile ? `<span class="chip">Scored with: ${esc(l.profile)}</span>` : ""}${l.cv ? `<span class="chip">CV from: ${esc(l.cvProfile || l.profile || "")}</span>` : ""}
        ${l.match && l.profile && l.profile !== active.name && ui.ready && !isBusy ? `<button type="button" class="btn small ghost" data-act="run" data-k="analyze">Re-score with ${esc(active.name)}</button>` : ""}
      </div>
      ${hit ? `<div class="warnbar"><b>Seen before.</b><span>You applied to ${esc(hit.company)} (${esc(hit.role)})${hit.when ? " on " + esc(hit.when) : ""}${hit.status ? " — " + esc(hit.status) : ""}. Check this is a different role before applying.</span></div>` : ""}
      ${isBusy ? `<div class="runbox"><span class="spin" aria-hidden="true"></span><span id="runtext" style="flex:1;min-width:0">Thinking…</span><button type="button" class="btn small" data-act="stop">Stop</button></div>` : ""}
      ${errorBox(ui, l.id)}
      <div class="tabs" role="tablist">${TABS.map(([k, n]) => `<button type="button" role="tab" data-act="tab" data-t="${k}" aria-selected="${tab === k}">${n}${k === "match" && l.match ? `<span class="n">${l.match.score}/10</span>` : ""}</button>`).join("")}</div>
    </div>
    <div class="ws-body">${body}</div>
  </section>`;
}

function completeness(st) {
  const pct = st.filter(Boolean).length * 20;
  const cls = pct < 50 ? "lo" : pct < 100 ? "mid" : "hi";
  const next = !st[1] ? "+40% Analyze & score" : !st[3] ? "+20% Tailor your CV" : !st[4] ? "+20% Write the cover letter" : "Ready to apply";
  return `<div class="complete" aria-label="Application ${pct}% complete">
    <div class="complete-top"><span class="pct ${cls}">${pct}%</span><span>Application completeness</span><span class="muted" style="margin-left:auto">${next}</span></div>
    <div class="ctrack"><div class="cfill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}

function tabAd(l) {
  return `<div class="stack">
    <dl class="kv">
      <div><dt class="eyebrow">Type</dt><dd>${esc(l.type || "—")}</dd></div>
      <div><dt class="eyebrow">Posted</dt><dd>${esc(l.posted || "—")}</dd></div>
      <div><dt class="eyebrow">Deadline</dt><dd>${esc(l.deadline || (l.analysis && l.analysis.deadline) || "—")}</dd></div>
      <div><dt class="eyebrow">Source</dt><dd>${esc(l.source || "Added by you")}</dd></div>
    </dl>
    <pre class="adtext">${esc(l.adText)}</pre>
  </div>`;
}

function tabAnalysis(l, ui) {
  const a = l.analysis;
  if (!a) return emptyState(ui, "Not analyzed yet", "The model reads the ad, pulls out what's required versus nice to have, and flags deadlines, tests and shifts.", "analyze", "Analyze & score");
  return `<div class="stack">
    <p class="lede">${esc(a.summary)}</p>
    <dl class="kv">
      <div><dt class="eyebrow">Role</dt><dd>${esc(a.title)}</dd></div>
      <div><dt class="eyebrow">Employer</dt><dd>${esc(a.company)}</dd></div>
      <div><dt class="eyebrow">Where</dt><dd>${esc(a.location)}</dd></div>
      <div><dt class="eyebrow">Deadline</dt><dd>${esc(a.deadline)}</dd></div>
    </dl>
    <div class="cols">
      <div><div class="eyebrow">Must have</div>${ul(a.mustHave)}</div>
      <div><div class="eyebrow">Nice to have</div>${ul(a.niceToHave)}</div>
      <div><div class="eyebrow">Watch out</div>${ul(a.flags)}</div>
    </div>
    <div><div class="eyebrow">Keywords the ad repeats</div><div class="tags">${(a.keywords || []).map((k) => `<span class="tag">${esc(k)}</span>`).join("")}</div></div>
  </div>`;
}

function tabMatch(l, ui) {
  const m = l.match;
  if (!m) return emptyState(ui, "Not scored yet", "Every requirement is checked against your CV and marked met, partial or gap, with the evidence. 7 or more goes to “Apply now”.", "analyze", "Analyze & score");
  const b = m.breakdown || {};
  const verdict = m.score >= SCORE.perfect ? "Suggestion — obvious match" : m.score >= SCORE.apply ? "Apply now" : m.score >= SCORE.stretch ? "Suggestion — stretch" : "Below the bar";
  const bar = ([n, v]) => `<div class="bar"><div class="lbl">${n}<b>${esc(v ?? "–")}</b></div><div class="track"><div class="fill" style="width:${Math.max(0, Math.min(10, Number(v) || 0)) * 10}%"></div></div></div>`;
  return `<div class="stack">
    <div class="scorecard">
      <div class="rscore"><span class="box ${scoreClass(m.score)}">${m.score}/10</span><span class="lbl">Match<br>score</span></div>
      <div class="stack" style="gap:12px">
        <div><span class="pill ${scoreClass(m.score)}">${verdict}</span></div>
        <p class="lede" style="margin:0">${esc(m.verdict)}</p>
        <div class="bars">${[["Skills", b.skills], ["Experience", b.experience], ["Education", b.education], ["Logistics", b.logistics]].map(bar).join("")}</div>
      </div>
    </div>
    <div class="reqwrap"><table class="reqtable"><thead><tr><th>Requirement</th><th>Status</th><th>Evidence from your CV</th></tr></thead><tbody>
      ${(m.requirements || []).map((r) => { const s = /met/i.test(r.status) ? "met" : /partial/i.test(r.status) ? "partial" : "gap"; return `<tr><td>${esc(r.req)}</td><td><span class="st ${s}">${s}</span></td><td>${esc(r.evidence)}</td></tr>`; }).join("")}
    </tbody></table></div>
    <div class="cols">
      <div class="callout"><div class="eyebrow">Lead with</div><p>${esc(m.pitch)}</p></div>
      <div><div class="eyebrow">Risks</div>${ul(m.risks)}</div>
    </div>
  </div>`;
}

export function paperCV(cv) {
  return `<article class="paper" aria-label="Tailored CV">
    <h3 class="nm">${esc(cv.name)}</h3>
    <div class="hl">${esc(cv.headline)}</div>
    <div class="ct">${esc(cv.contact)}</div>
    ${cv.summary ? `<p class="sum">${esc(cv.summary)}</p>` : ""}
    ${(cv.sections || []).map((s) => `<section class="sec"><h4>${esc(s.title)}</h4>
      ${(s.entries || []).map((e) => `<div class="ent"><div class="ent-h"><b>${esc(e.role)}${e.org ? " — " + esc(e.org) : ""}</b><span>${esc(e.dates)}</span></div>${e.place ? `<div class="ent-s">${esc(e.place)}</div>` : ""}${(e.bullets || []).filter(Boolean).length ? `<ul>${e.bullets.filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div>`).join("")}
      ${(s.rows || []).map((r) => `<div class="row">${r.label ? `<b>${esc(r.label)}:</b> ` : ""}${esc(r.text)}</div>`).join("")}
    </section>`).join("")}
  </article>`;
}

function docButtons(kind, ui) {
  return `<div class="row-actions">
    <button type="button" class="btn small primary" data-act="dl" data-k="${kind}">Download .docx</button>
    <button type="button" class="btn small" data-act="copy" data-k="${kind}">Copy text</button>
    ${ui.ready ? `<button type="button" class="btn small ghost" data-act="run" data-k="${kind === "cv" ? "tailor" : "letter"}" ${ui.busy ? "disabled" : ""}>Redo</button>` : ""}
  </div>`;
}

function tabCV(l, ui) {
  if (!l.cv) {
    if (!l.analysis) return emptyState(ui, "Score the lead first", "Tailoring uses the analysis to decide what to lead with and what to cut.", "analyze", "Analyze & score");
    return emptyState(ui, "CV not tailored yet", "The model rewrites your CV for this ad: new headline and summary, reordered experience, the ad's keywords where they're true. It never adds anything your CV doesn't support.", "tailor", l.match && l.match.score < SCORE.apply ? "Tailor anyway" : "Tailor CV");
  }
  return `<div class="docbar"><span class="eyebrow">Tailored for ${esc(l.company)}</span>${docButtons("cv", ui)}</div>
  <div class="docgrid">
    <div class="paper-shell">${paperCV(l.cv)}</div>
    <aside class="notes">
      <div><h3>What changed</h3><ul>${(l.changes || []).map((c) => `<li><b>${esc(c.what)}.</b> <span class="muted">${esc(c.why)}</span></li>`).join("") || "<li>No notes.</li>"}</ul></div>
      <div><h3>Left out on purpose</h3><p class="muted" style="margin:4px 0 0">The ad asks for these, but your CV doesn't back them up, so they aren't claimed.</p>${ul(l.notClaimed)}</div>
    </aside>
  </div>`;
}

function paperLetter(l, S, ui) {
  const L = l.letter;
  const cv = l.cv || {};
  const who = cv.name || S.user.name;
  return `<article class="paper letter" aria-label="Cover letter">
    <div class="lh"><h3 class="nm" style="font-size:20px">${esc(who)}</h3><div class="ct">${esc(cv.contact || "")}</div><div class="ct" style="margin-top:10px">${esc(fmtDate(ui.today))}</div></div>
    ${L.subject ? `<p><b>${esc(L.subject)}</b></p>` : ""}
    <p>${esc(L.greeting)}</p>
    ${(L.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}
    <p style="margin-top:18px">${esc(L.closing)}<br>${esc(L.signature || S.user.name)}</p>
  </article>`;
}

function tabLetter(l, S, ui) {
  if (!l.letter) {
    if (!l.cv) return emptyState(ui, "Tailor the CV first", "The letter is written from the tailored CV so the two tell the same story.", l.analysis ? "tailor" : "analyze", l.analysis ? "Tailor CV" : "Analyze & score");
    return emptyState(ui, "No cover letter yet", "The model first decides whether this application needs a letter (required, recommended or optional), then writes one in the ad's language.", "letter", "Write cover letter");
  }
  const need = /required/i.test(l.need) ? "required" : /recommended/i.test(l.need) ? "recommended" : "optional";
  return `<div class="docbar"><span class="eyebrow">Cover letter for ${esc(l.company)}</span>${docButtons("letter", ui)}</div>
  <div class="docgrid">
    <div class="paper-shell">${paperLetter(l, S, ui)}</div>
    <aside class="notes">
      <div><h3>Is a letter needed?</h3><div style="margin-top:6px"><span class="need ${need}">${need}</span></div><p class="muted" style="margin:8px 0 0">${esc(l.needReason || "")}</p></div>
      <div><h3>Check before sending</h3>${ul(l.checks)}</div>
    </aside>
  </div>`;
}
