import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, clip, slug, todayISO, langName, clampScore, hostOf, safeUrl } from "../src/util.js";

test("esc escapes HTML", () => {
  assert.equal(esc(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  assert.equal(esc(null), "");
});

test("clip cuts long text", () => {
  assert.equal(clip("abc", 5), "abc");
  assert.equal(clip("abcdef", 3), "abc\n[…cut]");
});

test("slug makes file-safe names", () => {
  assert.equal(slug("Fikalabs AB (client)"), "Fikalabs_AB_client");
  assert.equal(slug("Södertälje"), "Sodertalje");
  assert.equal(slug(""), "Job");
});

test("todayISO pads month and day", () => {
  assert.equal(todayISO(new Date(2026, 0, 5)), "2026-01-05");
});

test("langName maps codes", () => {
  assert.equal(langName("sv"), "Swedish");
  assert.equal(langName("en"), "English");
  assert.equal(langName(""), "English");
  assert.equal(langName("not a code"), "English");
  assert.equal(langName("sv-SE"), "Swedish");
  assert.equal(langName("swedish"), "Swedish");
});

test("clampScore keeps 0-10 integers", () => {
  assert.equal(clampScore(7.6), 8);
  assert.equal(clampScore(42), 10);
  assert.equal(clampScore("x"), 0);
});

test("url helpers reject unsafe links", () => {
  assert.equal(hostOf("https://www.example.com/a"), "example.com");
  assert.equal(hostOf("nope"), "");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl(" https://example.com "), "https://example.com");
});
