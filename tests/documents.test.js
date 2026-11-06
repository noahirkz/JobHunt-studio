import { test } from "node:test";
import assert from "node:assert/strict";
import { cvText, letterText, cvDocXml, letterDocXml, docxParts, xe } from "../src/documents.js";

const cv = { name: "SAM", headline: "Tech", contact: "sam@example.com", summary: "Sum", sections: [{ title: "Experience", entries: [{ role: "Dev", org: "A & B", dates: "2020", place: "Here", bullets: ["Did <x>"] }] }, { title: "Skills", rows: [{ label: "Code", text: "JS" }] }] };
const letter = { subject: "Hi", greeting: "Hello,", paragraphs: ["One", "Two"], closing: "Best,", signature: "" };

test("plain text versions", () => {
  const t = cvText(cv);
  assert.ok(t.includes("EXPERIENCE") && t.includes("• Did <x>") && t.includes("Code: JS"));
  const lt = letterText(letter, cv, { date: "2026-11-06" });
  assert.ok(lt.includes("6 November 2026") && lt.trim().endsWith("SAM"));
});

test("Word XML is escaped and complete", () => {
  const x = cvDocXml(cv);
  assert.ok(x.includes("A &amp; B") && x.includes("Did &lt;x&gt;"));
  assert.ok(!x.includes("<x>"));
  assert.ok(letterDocXml(letter, {}, { name: "Kim", date: "2026-11-06" }).includes("Kim"));
  const parts = docxParts(x);
  assert.deepEqual(Object.keys(parts).sort(), ["[Content_Types].xml", "_rels/.rels", "word/document.xml"]);
  assert.equal(xe("a\u0001b"), "ab");
});
