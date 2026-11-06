// Find leads view: open searches on job boards, import leads from a file, industry ideas.

import { esc } from "../util.js";
import { BOARDS } from "../config.js";
import { errorBox, demoBanner } from "./shared.js";

export function parseQueries(s) {
  return String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
}

export function boardTable(qs, loc) {
  if (!qs.length) return `<p class="muted">Add a search term above.</p>`;
  return `<table><thead><tr><th>Search</th>${BOARDS.map((b) => `<th>${esc(b.name)}</th>`).join("")}</tr></thead><tbody>
    ${qs.map((q) => `<tr><td><b>${esc(q)}</b></td>${BOARDS.map((b) => `<td><a href="${esc(b.url(q, loc))}" target="_blank" rel="noopener noreferrer">Open ↗</a></td>`).join("")}</tr>`).join("")}
  </tbody></table>`;
}

export function viewFind(S, ui) {
  const qs = parseQueries(S.queries);
  const busyInd = ui.busy && ui.busy.kind === "industries";
  return `${demoBanner(S)}<div class="page">
    <div class="page-intro"><h2>Find leads</h2><p>Search the boards from here, then paste any ad into Leads with “+ Add a job ad”. If you run the agent workflow (see the README), import the leads file it writes.</p></div>
    <div class="twocol">
      <div class="card stack">
        <div class="field"><label for="q-in">Search terms</label><textarea id="q-in" rows="3" placeholder="e.g. IT support, data center technician">${esc(S.queries)}</textarea><small>Separate with commas.</small></div>
        <div class="field"><label for="loc-in">Location</label><input id="loc-in" type="text" value="${esc(S.user.location)}" placeholder="e.g. Stockholm"></div>
      </div>
      <div class="card stack">
        <div><div class="eyebrow">Import leads</div><h3 style="font-size:18px;margin-top:6px">From a .json file</h3></div>
        <p class="fine">Accepts a list of job ads, each with at least <code>adText</code>, plus optional <code>title</code>, <code>company</code>, <code>location</code>, <code>url</code>, <code>deadline</code>. The agent workflow writes this format; see <code>workflow/examples/leads.example.json</code>.</p>
        <div class="row-actions"><label class="btn small" for="leads-file">Choose file</label><input id="leads-file" type="file" accept=".json,application/json" style="position:absolute;width:1px;height:1px;opacity:0"></div>
      </div>
    </div>
    <div class="card"><div class="eyebrow" style="margin-bottom:10px">Open a search on each board · last 7 days where the board supports it</div>
      <div class="boards" id="boards">${boardTable(qs, S.user.location)}</div></div>
    <div class="card stack">
      <div class="row-actions" style="justify-content:space-between"><div><div class="eyebrow">Other industries your CV fits</div><p class="muted" style="margin:6px 0 0;max-width:70ch">Click a search term to add it above.</p></div>
        ${ui.ready ? `<button type="button" class="btn small" data-act="industries" ${ui.busy ? "disabled" : ""}>${busyInd ? "Thinking…" : "Ask the model for ideas"}</button>` : ""}</div>
      ${errorBox(ui, "industries")}
      ${S.industries.length ? `<div class="inds">${S.industries.map((i) => `<div class="ind"><h3>${esc(i.industry)}</h3><p>${esc(i.why)}</p><p class="muted" style="font-size:13px">${esc((i.employers || []).join(" · "))}</p><div class="tags">${(i.queries || []).map((q) => `<button type="button" data-act="addq" data-q="${esc(q)}">+ ${esc(q)}</button>`).join("")}</div></div>`).join("")}</div>`
        : `<p class="muted">${ui.ready ? "No ideas yet. Ask the model, based on your CV." : "Connect a model in Settings to get ideas based on your CV."}</p>`}
    </div>
  </div>`;
}
