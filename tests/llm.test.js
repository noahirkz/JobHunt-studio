import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRequest, readText, extractJSON, codeForStatus, notReadyReason, askJSON, resolveSettings } from "../src/llm.js";

test("anthropic request has browser-access header and system prompt", () => {
  const { url, init } = buildRequest({ provider: "anthropic", apiKey: "k" }, "hi");
  assert.equal(url, "https://api.anthropic.com/v1/messages");
  assert.equal(init.headers["x-api-key"], "k");
  assert.equal(init.headers["anthropic-dangerous-direct-browser-access"], "true");
  const body = JSON.parse(init.body);
  assert.equal(body.messages[0].content, "hi");
  assert.ok(body.max_tokens > 0);
  assert.ok(body.system.includes("JSON"));
});

test("openai-compatible request uses bearer key, custom base and model", () => {
  const { url, init } = buildRequest({ provider: "custom", baseUrl: "https://x.test/v1/", model: "m", apiKey: "k" }, "hi");
  assert.equal(url, "https://x.test/v1/chat/completions");
  assert.equal(init.headers.authorization, "Bearer k");
  assert.equal(JSON.parse(init.body).model, "m");
});

test("ollama needs no key and sends no auth header", () => {
  const s = { provider: "ollama", model: "llama3.1" };
  assert.equal(notReadyReason(s), "");
  assert.equal(buildRequest(s, "x").init.headers.authorization, undefined);
});

test("notReadyReason explains what's missing", () => {
  assert.match(notReadyReason({ provider: "anthropic" }), /key/i);
  assert.match(notReadyReason({ provider: "openai", apiKey: "k" }), /model/i);
  assert.match(notReadyReason({ provider: "custom", model: "m" }), /address/i);
  assert.equal(resolveSettings({ provider: "nope" }).provider, "anthropic");
});

test("readText handles both formats and failure shapes", () => {
  assert.equal(readText("anthropic", { content: [{ type: "text", text: "a" }, { type: "text", text: "b" }] }), "ab");
  assert.throws(() => readText("anthropic", { content: [{ type: "text", text: "x" }], stop_reason: "max_tokens" }), { code: "truncated" });
  assert.equal(readText("openai", { choices: [{ message: { content: "ok" } }] }), "ok");
  assert.throws(() => readText("openai", { choices: [{ message: { content: "" } }] }), { code: "empty_completion" });
  assert.throws(() => readText("openai", { choices: [{ message: { content: "x" }, finish_reason: "length" }] }), { code: "truncated" });
});

test("extractJSON finds JSON in messy replies", () => {
  assert.deepEqual(extractJSON('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('Sure! {"a":{"b":2}} Hope that helps.'), { a: { b: 2 } });
  assert.deepEqual(extractJSON('<think>hmm {no}</think>[1,2]'), [1, 2]);
  assert.throws(() => extractJSON("no json here"), { code: "invalid_json" });
});

test("codeForStatus maps HTTP errors", () => {
  assert.equal(codeForStatus(401), "bad_key");
  assert.equal(codeForStatus(429), "rate_limited");
  assert.equal(codeForStatus(400, "prompt is too long"), "prompt_too_large");
  assert.equal(codeForStatus(404), "not_found");
  assert.equal(codeForStatus(503), "server");
});

test("askJSON end to end with a fake fetch", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ content: [{ type: "text", text: '{"ok":true}' }] }), { status: 200 });
  assert.deepEqual(await askJSON({ provider: "anthropic", apiKey: "k" }, "x", { fetchImpl }), { ok: true });
  const fail = async () => new Response(JSON.stringify({ error: { message: "invalid x-api-key" } }), { status: 401 });
  await assert.rejects(askJSON({ provider: "anthropic", apiKey: "k" }, "x", { fetchImpl: fail }), { code: "bad_key" });
  const offline = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(askJSON({ provider: "anthropic", apiKey: "k" }, "x", { fetchImpl: offline }), { code: "network" });
  await assert.rejects(askJSON({ provider: "anthropic" }, "x", { fetchImpl }), { code: "not_ready" });
});
