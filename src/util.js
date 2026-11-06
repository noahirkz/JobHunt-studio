// Small pure helpers. No DOM access here, so everything is testable with `node --test`.

const HTML_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape any value for safe use inside HTML text or attributes. Use it on every user/model string. */
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => HTML_ESC[c]);
}

/** Cut long text so prompts stay within model limits. */
export function clip(s, n) {
  s = String(s || "");
  return s.length > n ? s.slice(0, n) + "\n[…cut]" : s;
}

/** File-name-safe fragment: "Fikalabs AB (client)" -> "Fikalabs_AB_client". */
export function slug(s) {
  return (
    String(s || "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 40) || "Job"
  );
}

/** Today's date as YYYY-MM-DD in the viewer's own time zone. */
export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2026-11-06" -> "6 November 2026". */
export function fmtDate(iso, locale = "en-GB") {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso || "");
  return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

/** ISO 639-1 code ("sv") -> English language name ("Swedish"). Falls back to English. */
export function langName(code) {
  const raw = String(code || "").trim();
  // Accept "sv", "sv-SE", "sv_SE". A full name like "Swedish" is passed through as-is.
  if (/^[A-Za-z]{4,20}$/.test(raw)) return raw[0].toUpperCase() + raw.slice(1).toLowerCase();
  const m = raw.toLowerCase().match(/^([a-z]{2})(?:[-_][a-z]{2})?$/);
  if (!m) return "English";
  const c = m[1];
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(c) || "English";
  } catch {
    return "English";
  }
}

/** Short random id with a prefix, e.g. uid("lead") -> "lead-lq3k9x2a". */
export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Clamp a model score to an integer 0–10. */
export function clampScore(v) {
  return Math.max(0, Math.min(10, Math.round(Number(v) || 0)));
}

/** Hostname without "www.", or "" for anything that isn't a valid URL. */
export function hostOf(url) {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}

/** Only allow http(s) links into href attributes. */
export function safeUrl(url) {
  return /^https?:\/\//i.test(String(url || "").trim()) ? String(url).trim() : "";
}
