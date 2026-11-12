import { test } from "node:test";
import assert from "node:assert/strict";
import { itemsToText, pdfToText } from "../src/pdf.js";

// Build a tiny one-page PDF in memory (committed .pdf files are refused by the privacy check).
function makePdf(lines) {
  const esc = (s) => s.replace(/[()\\]/g, (c) => "\\" + c);
  const stream = ["BT", "/F1 12 Tf", "72 720 Td", "14 TL", ...lines.flatMap((l, i) => (i ? ["T*", `(${esc(l)}) Tj`] : [`(${esc(l)}) Tj`])), "ET"].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

test("text items are grouped into lines by position", () => {
  const items = [
    { str: "Sam Example", transform: [1, 0, 0, 1, 72, 720], hasEOL: false },
    { str: "", transform: [1, 0, 0, 1, 80, 720], hasEOL: false },
    { str: "Developer", transform: [1, 0, 0, 1, 72, 700], hasEOL: false },
    { str: "Experience", transform: [1, 0, 0, 1, 72, 680], hasEOL: true },
    { type: "beginMarkedContent", tag: "Span" },
  ];
  assert.equal(itemsToText(items), "Sam Example\nDeveloper\nExperience");
});

test("a real PDF's text is extracted with pdf.js", async () => {
  const bytes = makePdf(["Sam Example", "Developer at Example AB", "Skills: JavaScript"]);
  const text = await pdfToText(bytes);
  assert.ok(text.includes("Sam Example"), text);
  assert.ok(text.includes("Developer at Example AB"), text);
  assert.ok(text.includes("Skills: JavaScript"), text);
});

test("a PDF without a text layer is reported as scanned", async () => {
  const bytes = makePdf([""]);
  await assert.rejects(pdfToText(bytes), /scanned/);
});

test("bytes that are not a PDF are rejected", async () => {
  await assert.rejects(pdfToText(new TextEncoder().encode("just some text, not a pdf")), /notpdf/);
});
