// Turns a tailored CV / cover letter into plain text and into a Word (.docx) file,
// and reads text out of an uploaded .docx. Uses JSZip (vendor/jszip), loaded as a global.
//
// CV shape (same as the model returns and as workflow/examples/profile.example.yaml):
//   { name, headline, contact, summary,
//     sections: [{ title, entries?: [{role, org, place, dates, bullets[]}], rows?: [{label, text}] }] }

import { fmtDate } from "./util.js";

// ---------- plain text ----------

export function cvText(cv) {
  const out = [cv.name, cv.headline, cv.contact, ""];
  if (cv.summary) out.push(cv.summary, "");
  for (const s of cv.sections || []) {
    out.push(String(s.title || "").toUpperCase());
    for (const e of s.entries || []) {
      out.push([e.role, e.org].filter(Boolean).join(" — ") + (e.dates ? "  |  " + e.dates : "") + (e.place ? "  |  " + e.place : ""));
      for (const b of e.bullets || []) if (b) out.push("• " + b);
    }
    for (const r of s.rows || []) out.push((r.label ? r.label + ": " : "") + r.text);
    out.push("");
  }
  return out.filter((x) => x != null).join("\n").trim();
}

export function letterText(letter, cv = {}, { name = "", date } = {}) {
  const L = letter;
  const who = cv.name || name;
  return [who, cv.contact, fmtDate(date), "", L.subject, "", L.greeting, "", ...(L.paragraphs || []).flatMap((p) => [p, ""]), L.closing, L.signature || who]
    .filter((x) => x != null)
    .join("\n");
}

// ---------- WordprocessingML ----------

/** Escape text for XML and drop control characters Word refuses to open. */
export function xe(s) {
  return String(s ?? "")
    .replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/** One text run. o: {b, i, caps, color, sz (half-points), sp (spacing)} */
function wr(text, o = {}) {
  const sz = o.sz || 21;
  const rp =
    `<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>` +
    (o.b ? "<w:b/>" : "") +
    (o.i ? "<w:i/>" : "") +
    (o.caps ? "<w:caps/>" : "") +
    (o.color ? `<w:color w:val="${o.color}"/>` : "") +
    `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>` +
    (o.sp ? `<w:spacing w:val="${o.sp}"/>` : "");
  return `<w:r><w:rPr>${rp}</w:rPr><w:t xml:space="preserve">${xe(text)}</w:t></w:r>`;
}

const TAB = `<w:r><w:tab/></w:r>`;

/** One paragraph. o: {border, tabRight, before, after, line, bullet} */
function wp(runs, o = {}) {
  const ppr =
    (o.border ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="1B1F24"/></w:pBdr>` : "") +
    (o.tabRight ? `<w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs>` : "") +
    `<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 60 : o.after}" w:line="${o.line || 264}" w:lineRule="auto"/>` +
    (o.bullet ? `<w:ind w:left="284" w:hanging="227"/>` : "");
  return `<w:p><w:pPr>${ppr}</w:pPr>${runs}</w:p>`;
}

export function cvDocXml(cv) {
  const P = [];
  P.push(wp(wr(cv.name, { b: true, sz: 36, color: "1170CD" }), { after: 20 }));
  if (cv.headline) P.push(wp(wr(cv.headline, { b: true, sz: 22 }), { after: 20 }));
  if (cv.contact) P.push(wp(wr(cv.contact, { sz: 18, color: "55606B" }), { after: 160 }));
  if (cv.summary) P.push(wp(wr(cv.summary), { after: 120 }));
  for (const s of cv.sections || []) {
    P.push(wp(wr(String(s.title || "").toUpperCase(), { b: true, sz: 20, sp: 16 }), { before: 140, after: 80, border: true }));
    for (const e of s.entries || []) {
      const head = wr([e.role, e.org].filter(Boolean).join(" — "), { b: true }) + (e.dates ? TAB + wr(e.dates, { sz: 19, color: "55606B" }) : "");
      P.push(wp(head, { tabRight: true, before: 60, after: e.place ? 0 : 30 }));
      if (e.place) P.push(wp(wr(e.place, { i: true, sz: 19, color: "55606B" }), { after: 30 }));
      for (const b of e.bullets || []) if (b) P.push(wp(wr("•") + TAB + wr(b), { bullet: true, after: 30 }));
    }
    for (const r of s.rows || []) P.push(wp((r.label ? wr(r.label + ": ", { b: true }) : "") + wr(r.text), { after: 40 }));
  }
  return P.join("");
}

export function letterDocXml(letter, cv = {}, { name = "", date } = {}) {
  const L = letter;
  const who = cv.name || name;
  const P = [];
  P.push(wp(wr(who, { b: true, sz: 30, sp: 16 }), { after: 20 }));
  if (cv.contact) P.push(wp(wr(cv.contact, { sz: 18, color: "55606B" }), { after: 200 }));
  P.push(wp(wr(fmtDate(date)), { after: 200 }));
  if (L.subject) P.push(wp(wr(L.subject, { b: true }), { after: 200 }));
  if (L.greeting) P.push(wp(wr(L.greeting), { after: 160 }));
  for (const p of L.paragraphs || []) P.push(wp(wr(p), { after: 160, line: 276 }));
  P.push(wp(wr(L.closing || ""), { before: 120, after: 0 }));
  P.push(wp(wr(L.signature || who), { after: 0 }));
  return P.join("");
}

/** The minimum set of parts Word needs. A4 page, ~2 cm margins. */
export function docxParts(bodyXml) {
  return {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="964" w:right="1134" w:bottom="964" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  };
}

export async function buildDocx(bodyXml, JSZip = globalThis.JSZip) {
  if (!JSZip) throw new Error("nozip");
  const zip = new JSZip();
  const parts = docxParts(bodyXml);
  for (const k in parts) zip.file(k, parts[k]);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/** Read the text of an uploaded .docx (browser only: needs DOMParser). */
export async function docxToText(file, JSZip = globalThis.JSZip) {
  if (!JSZip) throw new Error("nozip");
  const zip = await JSZip.loadAsync(file);
  const part = zip.file("word/document.xml");
  if (!part) throw new Error("notdocx");
  const doc = new DOMParser().parseFromString(await part.async("string"), "application/xml");
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const lines = [];
  for (const p of Array.from(doc.getElementsByTagNameNS(W, "p"))) {
    let line = "";
    const walk = (n) => {
      for (const c of Array.from(n.childNodes)) {
        if (c.namespaceURI !== W) continue;
        if (c.localName === "t") line += c.textContent;
        else if (c.localName === "tab") line += " ";
        else if (c.localName === "br") line += "\n";
        else if (c.localName !== "p") walk(c);
      }
    };
    walk(p);
    const isList = p.getElementsByTagNameNS(W, "numPr").length > 0;
    lines.push((isList && line.trim() ? "- " : "") + line.replace(/[ \t]+/g, " ").trim());
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Trigger a browser download for a Blob. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
