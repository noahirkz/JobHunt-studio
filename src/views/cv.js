// My CV view: CV profiles, the facts-and-limits list, and the already-applied list.

import { esc } from "../util.js";
import { demoBanner } from "./shared.js";

export function viewCV(S, ui, active) {
  const sel = S.profiles.find((p) => p.id === S._cvProfile) || active;
  const isActive = sel.id === active.id;
  return `${demoBanner(S)}<div class="page">
    <div class="page-intro"><h2>My CV profiles</h2><p>Keep one CV per direction and pick which one the model scores and tailors from. The facts list applies to every profile and wins whenever a CV disagrees with it. Everything saves in this browser only.</p></div>
    <div class="cvlayout">
      <div class="stack" style="gap:12px">
        <div class="eyebrow">${S.profiles.length} profile${S.profiles.length === 1 ? "" : "s"}</div>
        <div class="ptabs">${S.profiles.map((p) => `<button type="button" class="ptab" data-act="pick-profile" data-id="${esc(p.id)}" aria-current="${p.id === sel.id}">
          <span class="t">${esc(p.name)}${p.id === active.id ? `<span class="badge">In use</span>` : ""}</span>
          <span class="f">${esc(p.file || "Added by you")}</span></button>`).join("")}</div>
        <div class="upload">
          <span>Add a CV from a PDF, Word (.docx), OpenDocument (.odt) or text file, or start from a blank one.</span>
          <div class="row-actions"><label class="btn small" for="cv-file">Upload CV</label><input id="cv-file" type="file" accept=".pdf,.docx,.odt,.txt,.md"><button type="button" class="btn small ghost" data-act="profile-new">Blank profile</button></div>
        </div>
      </div>
      <div class="card stack">
        <div class="row-actions" style="justify-content:space-between">
          <div class="field" style="flex:1;min-width:200px"><label for="pname">Profile name</label><input id="pname" type="text" value="${esc(sel.name)}"></div>
          ${isActive ? `<span class="chip">Used for new runs</span>` : `<button type="button" class="btn small primary" data-act="use-profile" data-id="${esc(sel.id)}">Use for new runs</button>`}
        </div>
        <div class="field"><label for="ptext">CV text</label><textarea id="ptext" class="cvtext" spellcheck="false" placeholder="Paste your full CV here: contact line, experience with dates, skills, education, languages.">${esc(sel.text)}</textarea></div>
        <div class="row-actions">
          ${S.profiles.length > 1 ? `<button type="button" class="btn small ghost" data-act="profile-remove" data-id="${esc(sel.id)}">${ui.removeArm === sel.id ? "Click again to remove" : "Remove profile"}</button>` : ""}
        </div>
      </div>
      <div class="stack side">
        <div class="card stack"><div class="field"><label for="guard">Facts and limits · all profiles</label><textarea id="guard" rows="18" spellcheck="false">${esc(S.guard)}</textarea><small>The model follows these exactly when it scores and writes. This is what keeps it from inventing skills.</small></div></div>
        <div class="card"><div class="eyebrow">Already applied · used to flag repeats</div>
          ${S.applied.length ? `<ul class="checked">${S.applied.map((a, i) => `<li><b>${esc(a.company)}</b><span>${esc(a.role)}</span><span class="muted">${esc([a.when, a.status].filter(Boolean).join(" · "))}</span><button type="button" class="x" data-act="applied-remove" data-i="${i}" aria-label="Remove ${esc(a.company)}">✕</button></li>`).join("")}</ul>` : `<p class="muted" style="margin:8px 0 0">Nothing yet. Use “Mark as applied” on a lead, or add one here.</p>`}
          <form class="applied-form" id="appliedForm">
            <input type="text" id="ap-company" placeholder="Company" aria-label="Company" required>
            <input type="text" id="ap-role" placeholder="Role" aria-label="Role">
            <input type="text" id="ap-status" placeholder="Status" aria-label="Status">
            <button class="btn small" type="submit">Add</button>
          </form>
        </div>
      </div>
    </div>
  </div>`;
}
