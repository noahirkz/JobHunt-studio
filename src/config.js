// Settings you are most likely to want to change live in this file.

export const APP_NAME = "Jobhunt Studio";

// localStorage keys. Bump the version in store.js (not here) if the saved shape changes.
export const STORE_KEY = "jobhunt-studio";
export const KEY_STORE_KEY = "jobhunt-studio-apikey";

// Scores: 7+ is "apply now", 10 or 5–6 is "suggestion", under 5 is hidden.
export const SCORE = { apply: 7, stretch: 5, perfect: 10 };

// Model providers. Anything that speaks the OpenAI chat-completions format works as "custom".
// `model` is only a starting suggestion: check your provider's model list.
export const PROVIDERS = {
  anthropic: {
    label: "Anthropic (Claude)",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com",
    model: "claude-sonnet-5-5",
    needsKey: true,
    keyHint: "Starts with sk-ant-. Create one at console.anthropic.com.",
  },
  openai: {
    label: "OpenAI",
    kind: "openai",
    baseUrl: "https://api.openai.com/v1",
    model: "",
    needsKey: true,
    keyHint: "Create one at platform.openai.com.",
  },
  openrouter: {
    label: "OpenRouter (many models)",
    kind: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "",
    needsKey: true,
    keyHint: "Create one at openrouter.ai. Model names look like provider/model.",
  },
  ollama: {
    label: "Ollama (local, free)",
    kind: "openai",
    baseUrl: "http://localhost:11434/v1",
    model: "",
    needsKey: false,
    keyHint: "No key needed. Runs on your own computer; see the README if the connection is blocked.",
  },
  custom: {
    label: "Other OpenAI-compatible API",
    kind: "openai",
    baseUrl: "",
    model: "",
    needsKey: false,
    keyHint: "Any endpoint that accepts POST /chat/completions.",
  },
};

// Max tokens a single answer may use (Anthropic requires a limit).
export const MAX_TOKENS = 4096;

// Job boards for the "Find leads" view. Add or remove rows freely.
// `url(query, location)` must return a search URL.
const enc = encodeURIComponent;
export const BOARDS = [
  { name: "LinkedIn", url: (q, l) => `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=${enc(l)}&f_TPR=r604800` },
  { name: "Indeed", url: (q, l) => `https://www.indeed.com/jobs?q=${enc(q)}&l=${enc(l)}&fromage=7` },
  { name: "Glassdoor", url: (q, l) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${enc(q)}&locKeyword=${enc(l)}` },
  { name: "HiringCafe", url: (q, l) => `https://hiring.cafe/?searchState=${enc(JSON.stringify({ searchQuery: `${q} ${l}` }))}` },
  { name: "Platsbanken (SE)", url: (q, l) => `https://arbetsformedlingen.se/platsbanken/annonser?q=${enc(`${q} ${l}`)}` },
  { name: "thehub.io (Nordics)", url: (q) => `https://thehub.io/jobs?search=${enc(q)}` },
];
