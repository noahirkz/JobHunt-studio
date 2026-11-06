// Privacy check: fails if anything that looks personal or secret is about to be published.
// Run: `npm run check:privacy` (also runs in CI on every push).
//
// It checks every file git would publish (or every file, outside a git repo) for:
//   - email addresses (except example.com / example.org / noreply addresses)
//   - phone numbers (except all-zero demo numbers like +46 70 000 00 00)
//   - Swedish personal identity numbers
//   - API keys and tokens
//   - document files (.docx, .pdf, .xlsx, …) that usually contain a real CV
//   - your own words from `.privacy-denylist` (one per line, git-ignored), e.g. your name, street, phone
//
// To allow one line on purpose, put `privacy-check: allow` on that line.

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set([".git", "node_modules", "vendor", "fonts", "output", "reports", "private"]);
const SKIP_FILES = new Set(["scripts/privacy-check.mjs", "LICENSE", ".privacy-denylist", ".privacy-denylist.example"]);
const BINARY = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf"]);
const DOCS = new Set([".docx", ".doc", ".pdf", ".xlsx", ".xls", ".odt", ".pages", ".rtf"]);

function files() {
  try {
    const out = execSync("git ls-files --cached --others --exclude-standard", { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString();
    return out.split("\n").filter(Boolean);
  } catch {
    const list = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        if (SKIP_DIRS.has(name)) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else list.push(relative(root, p));
      }
    };
    walk(root);
    return list;
  }
}

const RULES = [
  { name: "email address", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ok: (m) => /@(example\.(com|org|net)|users\.noreply\.github\.com|noreply\.[a-z.]+)$/i.test(m) },
  {
    name: "phone number",
    re: /(?<![A-Za-z0-9])(?:\+\d{2,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}|07\d[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})(?![\d])/g,
    // Not a phone if it has fewer than 9 digits; allowed if it's an all-zero demo number (+46 70 000 00 00).
    ok: (m) => { const d = m.replace(/\D/g, ""); return d.length < 9 || /^\d{2,3}7\d0+$/.test(d) || /^07\d0+$/.test(d); },
  },
  { name: "personal identity number", re: /\b(?:19|20)?\d{6}[-+]\d{4}\b/g },
  { name: "API key or token", re: /\b(?:sk-ant-[A-Za-z0-9_-]{16,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|sk-or-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|xox[abp]-[A-Za-z0-9-]{10,})\b/g },
];

const denyPath = join(root, ".privacy-denylist");
const deny = existsSync(denyPath)
  ? readFileSync(denyPath, "utf8").split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#"))
  : [];

const problems = [];
for (const f of files()) {
  if (SKIP_FILES.has(f) || f.split("/").some((part) => SKIP_DIRS.has(part))) continue;
  const ext = extname(f).toLowerCase();
  if (DOCS.has(ext)) {
    problems.push(`${f}: document file — real CVs and letters must not be published`);
    continue;
  }
  if (BINARY.has(ext) || !existsSync(join(root, f))) continue;
  const lines = readFileSync(join(root, f), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("privacy-check: allow")) return;
    for (const r of RULES) {
      for (const m of line.match(r.re) || []) if (!r.ok || !r.ok(m)) problems.push(`${f}:${i + 1}: ${r.name}: ${m}`);
    }
    const low = line.toLowerCase();
    for (const w of deny) if (low.includes(w.toLowerCase())) problems.push(`${f}:${i + 1}: matches your .privacy-denylist ("${w}")`);
  });
}

if (problems.length) {
  console.error(`Privacy check failed — ${problems.length} problem(s):\n` + problems.map((p) => "  " + p).join("\n"));
  process.exit(1);
}
console.log(`Privacy check passed${deny.length ? ` (${deny.length} personal terms checked)` : ""}.`);
