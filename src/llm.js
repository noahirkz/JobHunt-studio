// Talks to the model the user chose. Two wire formats cover almost everything:
//   - "anthropic": Anthropic Messages API
//   - "openai":    OpenAI-style /chat/completions (OpenAI, OpenRouter, Ollama, LM Studio, many others)
// The browser calls the provider directly; nothing passes through a server of ours.

import { PROVIDERS, MAX_TOKENS } from "./config.js";
import { SYSTEM } from "./prompts.js";

/** Merge saved settings with the provider preset. */
export function resolveSettings(s = {}) {
  const preset = PROVIDERS[s.provider] || PROVIDERS.anthropic;
  return {
    provider: PROVIDERS[s.provider] ? s.provider : "anthropic",
    kind: preset.kind,
    label: preset.label,
    baseUrl: String(s.baseUrl || preset.baseUrl || "").trim().replace(/\/+$/, ""),
    model: String(s.model || preset.model || "").trim(),
    apiKey: String(s.apiKey || "").trim(),
    needsKey: preset.needsKey,
  };
}

/** Is there enough configured to try a call? Returns "" when ready, otherwise the reason. */
export function notReadyReason(s) {
  const r = resolveSettings(s);
  if (!r.baseUrl) return "Add the API address.";
  if (!r.model) return "Add a model name.";
  if (r.needsKey && !r.apiKey) return "Add your API key.";
  return "";
}

/** Build the fetch() arguments for one prompt. Pure, so it is unit-tested. */
export function buildRequest(s, prompt) {
  const r = resolveSettings(s);
  if (r.kind === "anthropic") {
    return {
      url: `${r.baseUrl}/v1/messages`,
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": r.apiKey,
          "anthropic-version": "2023-06-01",
          // Required by Anthropic for calls made straight from a browser with the user's own key.
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: r.model,
          max_tokens: MAX_TOKENS,
          system: SYSTEM,
          messages: [{ role: "user", content: prompt }],
        }),
      },
    };
  }
  const headers = { "content-type": "application/json" };
  if (r.apiKey) headers.authorization = `Bearer ${r.apiKey}`;
  // Kept minimal on purpose: extra parameters (temperature, max_tokens, response_format)
  // are rejected by some models and some "compatible" servers.
  return {
    url: `${r.baseUrl}/chat/completions`,
    init: {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: r.model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    },
  };
}

/** Pull the text out of a provider response body. Throws {code} on known failure shapes. */
export function readText(kind, body) {
  if (kind === "anthropic") {
    const text = (body && Array.isArray(body.content) ? body.content : [])
      .filter((c) => c && c.type === "text")
      .map((c) => c.text)
      .join("");
    if (body && body.stop_reason === "max_tokens") throw { code: "truncated" };
    if (body && body.stop_reason === "refusal") throw { code: "refused" };
    if (!text.trim()) throw { code: "empty_completion" };
    return text;
  }
  const choice = body && Array.isArray(body.choices) ? body.choices[0] : null;
  const msg = choice && choice.message;
  let text = msg && msg.content;
  if (Array.isArray(text)) text = text.map((p) => (typeof p === "string" ? p : p && p.text) || "").join("");
  if (choice && choice.finish_reason === "length") throw { code: "truncated" };
  if (msg && msg.refusal) throw { code: "refused" };
  if (!text || !String(text).trim()) throw { code: "empty_completion" };
  return String(text);
}

/**
 * Find and parse the JSON in a model reply. Accepts bare JSON, ```json fences,
 * and stray text before/after. Also drops <think>…</think> blocks from reasoning models.
 */
export function extractJSON(text) {
  let t = String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    /* fall through to bracket search */
  }
  const starts = [t.indexOf("{"), t.indexOf("[")].filter((i) => i >= 0);
  if (!starts.length) throw { code: "invalid_json" };
  const start = Math.min(...starts);
  const close = t[start] === "{" ? "}" : "]";
  const end = t.lastIndexOf(close);
  if (end > start) {
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      /* give up below */
    }
  }
  throw { code: "invalid_json" };
}

/** Map an HTTP status + provider error text to one of our error codes. */
export function codeForStatus(status, detail = "") {
  const d = String(detail).toLowerCase();
  if (status === 401 || status === 403) return "bad_key";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status === 413 || /context|too long|too many tokens|maximum.*tokens/.test(d)) return "prompt_too_large";
  if (status === 400 && /model/.test(d)) return "not_found";
  if (status >= 500) return "server";
  return "http";
}

/** Human-readable messages for each error code. */
export const ERRORS = {
  not_ready: "No model is connected yet. Open Settings to add one.",
  bad_key: "The provider rejected the API key. Check it in Settings.",
  not_found: "The provider doesn't know this model or address. Check the model name and API address in Settings.",
  rate_limited: "Too many requests right now. Wait a minute and try again.",
  prompt_too_large: "The text is too long for this model. Paste only the job description, or pick a model with a larger context.",
  server: "The provider had a problem on its side. Try again in a moment.",
  http: "The provider returned an error.",
  network: "Couldn't reach the provider. Check your internet connection and the API address. Local models (Ollama) must allow this page's address; see the README.",
  invalid_json: "The model's answer came back in the wrong shape. Try again, or use a stronger model.",
  truncated: "The answer was cut off before it finished. Try again, or use a model that allows longer answers.",
  refused: "The model declined this request. Check the ad text and try again.",
  empty_completion: "The model returned nothing. Try again.",
};

export function errorMessage(e) {
  const code = e && e.code;
  const base = ERRORS[code] || "Something went wrong. Try again.";
  return e && e.detail && (code === "http" || code === "not_found") ? `${base} (${String(e.detail).slice(0, 160)})` : base;
}

/**
 * Send one prompt and return the parsed JSON reply.
 * Throws {code, detail?}; {code:"cancelled"} when aborted.
 */
export async function askJSON(settings, prompt, { signal, fetchImpl = globalThis.fetch } = {}) {
  if (notReadyReason(settings)) throw { code: "not_ready" };
  const r = resolveSettings(settings);
  const { url, init } = buildRequest(settings, prompt);
  let res;
  try {
    res = await fetchImpl(url, { ...init, signal });
  } catch (err) {
    if (err && err.name === "AbortError") throw { code: "cancelled" };
    throw { code: "network" };
  }
  let body = null;
  const raw = await res.text().catch(() => "");
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const found = (body && body.error && (body.error.message || body.error)) || raw || res.statusText || "";
    const detail = typeof found === "string" ? found : JSON.stringify(found);
    throw { code: codeForStatus(res.status, detail), detail };
  }
  return extractJSON(readText(r.kind, body));
}
