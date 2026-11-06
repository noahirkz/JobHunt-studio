// Settings view: which model to use, your name and location, and your data.

import { esc } from "../util.js";
import { PROVIDERS } from "../config.js";
import { resolveSettings } from "../llm.js";
import { demoBanner } from "./shared.js";

export function viewSettings(S, ui) {
  const r = resolveSettings({ ...S.llm, apiKey: ui.apiKey });
  const preset = PROVIDERS[r.provider];
  const t = ui.test;
  return `${demoBanner(S)}<div class="page">
    <div class="page-intro"><h2>Settings</h2><p>Jobhunt Studio has no server. Your CV, leads and key stay in this browser. When you run a step, the job ad and your CV go straight from this browser to the model provider you pick here.</p></div>
    <div class="settings">
      <div class="card stack">
        <div><div class="eyebrow">Model</div><h3 style="font-size:20px;margin-top:6px">Connect Claude or any LLM</h3></div>
        <div class="field"><label for="llm-provider">Provider</label>
          <select id="llm-provider">${Object.entries(PROVIDERS).map(([k, p]) => `<option value="${k}" ${k === r.provider ? "selected" : ""}>${esc(p.label)}</option>`).join("")}</select></div>
        <div class="field"><label for="llm-key">API key${preset.needsKey ? "" : " (optional)"}</label>
          <input id="llm-key" type="password" autocomplete="off" spellcheck="false" value="${esc(ui.apiKey)}" placeholder="${preset.needsKey ? "Paste your key" : "Not needed"}">
          <small>${esc(preset.keyHint)}</small></div>
        <label class="check"><input type="checkbox" id="llm-remember" ${ui.keyRemembered ? "checked" : ""}> <span>Remember the key on this device. Leave off on shared computers: the key is then forgotten when you close the tab.</span></label>
        <div class="formgrid">
          <div class="field"><label for="llm-model">Model</label><input id="llm-model" type="text" spellcheck="false" value="${esc(S.llm.model)}" placeholder="${esc(preset.model || "e.g. the model name from your provider")}"></div>
          <div class="field"><label for="llm-base">API address</label><input id="llm-base" type="url" spellcheck="false" value="${esc(S.llm.baseUrl)}" placeholder="${esc(preset.baseUrl || "https://…/v1")}"></div>
        </div>
        <p class="fine">Leave a field empty to use the default shown in grey. Stronger models score more strictly and follow the “never invent” rules better.</p>
        <div class="row-actions"><button type="button" class="btn primary small" data-act="test-llm" ${ui.busy ? "disabled" : ""}>${ui.busy && ui.busy.kind === "test" ? "Testing…" : "Test connection"}</button>
          ${ui.ready ? `<span class="chip" id="llm-status">Ready: ${esc(r.model)}</span>` : `<span class="chip warn" id="llm-status">${esc(ui.notReady)}</span>`}</div>
        ${t ? (t.ok ? `<div class="ok" role="status"><b>Connected.</b> ${esc(r.label)} answered.</div>` : `<div class="err" role="alert"><b>Didn't connect.</b> ${esc(t.msg)}</div>`) : ""}
      </div>
      <div class="stack">
        <div class="card stack">
          <div class="eyebrow">You</div>
          <div class="field"><label for="user-name">Your name</label><input id="user-name" type="text" value="${esc(S.user.name)}" placeholder="Used in the greeting and on letters"></div>
          <div class="field"><label for="user-loc">Where you're looking</label><input id="user-loc" type="text" value="${esc(S.user.location)}" placeholder="e.g. Stockholm"></div>
        </div>
        <div class="card stack">
          <div class="eyebrow">Your data</div>
          <p class="fine">Browsers can clear saved site data. Download a backup now and then. Backups never include your API key.</p>
          <div class="row-actions">
            <button type="button" class="btn small" data-act="backup-export">Download backup</button>
            <label class="btn small" for="backup-file">Restore backup</label><input id="backup-file" type="file" accept=".json,application/json" style="position:absolute;width:1px;height:1px;opacity:0">
          </div>
          <div class="row-actions">
            ${S.demo ? "" : `<button type="button" class="btn small ghost" data-act="load-demo">${ui.removeArm === "demo" ? "Click again: replaces your data" : "Load demo data"}</button>`}
            <button type="button" class="btn small ghost" data-act="wipe">${ui.removeArm === "wipe" ? "Click again to delete everything" : "Delete all data"}</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
