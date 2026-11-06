// Pieces used by more than one view. Views return HTML strings; every dynamic value goes through esc().
//
// `ui` (passed to every view) holds the runtime-only state:
//   { ready, notReady, busy: {id, kind} | null, error: {id, msg} | null, removeArm, today }

import { esc } from "../util.js";
import { SCORE } from "../config.js";

export function scoreClass(s) {
  return s == null ? "s-new" : s >= SCORE.apply ? "s-good" : s >= SCORE.stretch ? "s-warn" : "s-bad";
}

export function ul(arr) {
  return arr && arr.length ? `<ul class="list">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="muted">None.</p>`;
}

/** Button that runs a model step. Disabled when no model is connected or another step is running. */
export function runBtn(ui, kind, label, primary) {
  const dis = !ui.ready || ui.busy;
  return `<button type="button" class="btn ${primary ? "primary" : ""}" data-act="run" data-k="${kind}" ${dis ? "disabled" : ""} title="${!ui.ready ? esc(ui.notReady) : ""}">${esc(label)}</button>`;
}

export function emptyState(ui, title, text, kind, label) {
  return `<div class="empty">${kind ? `<span class="ai">✦ AI step</span>` : ""}<h3>${esc(title)}</h3><p>${esc(text)}</p>${kind ? runBtn(ui, kind, label, true) : ""}${
    kind && !ui.ready ? `<p style="font-size:13px">${esc(ui.notReady)} <a href="#" data-act="view" data-v="settings">Open Settings</a>.</p>` : ""
  }</div>`;
}

export function errorBox(ui, id) {
  return ui.error && ui.error.id === id ? `<div class="err" role="alert"><b>Didn't finish.</b> ${esc(ui.error.msg)}</div>` : "";
}

/** Shown on every view while the fictional demo data is loaded. */
export function demoBanner(S) {
  if (!S.demo) return "";
  return `<div class="banner"><p><b>You're looking at demo data</b> for a fictional person. Connect a model in Settings, then start fresh and add your own CV.</p>
    ${S.view === "settings" ? "" : `<a class="btn small" href="#" data-act="view" data-v="settings">Settings</a>`}
    <button type="button" class="btn small primary" data-act="start-fresh">Start with my own data</button></div>`;
}
