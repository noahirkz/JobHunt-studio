# CLAUDE.md

This repo has two parts:

1. **The web app** (`index.html`, `src/`, `styles.css`): a static, no-build dashboard that scores job ads against a CV and tailors a CV and cover letter using the user's own model key.
2. **The agent workflow** (`workflow/`): instructions for an agent to search job boards daily and write a report plus an importable leads file.

## If the user asks you to find jobs

- Follow `workflow/agent.md`. If it doesn't exist, copy `workflow/agent.template.md` to `workflow/agent.md` and help the user fill in the `[[placeholders]]` first.
- Only keep ads that are still open. Score honestly against the user's CV; never invent experience.
- Write `reports/YYYY-MM-DD.md` and `reports/YYYY-MM-DD.leads.json` (format: `workflow/examples/leads.example.json`).
- Also look for other industries the user's experience fits, and include start-up boards such as thehub.io and internship listings.

## If the user asks you to change the code

- No build step and no runtime dependencies. Plain ES modules in `src/`; JSZip is vendored in `vendor/`.
- Keep `src/util.js`, `src/prompts.js`, `src/llm.js`, `src/store.js` and `src/documents.js` free of DOM access so they stay testable. Views in `src/views/` return HTML strings; escape every dynamic value with `esc()` and pass links through `safeUrl()`.
- Prompts live in `src/prompts.js`; the JSON shapes there are read by the views, so change both together.
- Providers and job boards live in `src/config.js`.
- Before committing, run `npm run check` (unit tests + privacy check).

## Privacy rules (always)

- Never commit personal data: real CVs, letters, reports, names, phone numbers, emails, API keys.
- Personal files go in `private/`, `reports/`, `output/`, `workflow/agent.md`, `workflow/profile.yaml`, `workflow/letter*.yaml`, all git-ignored.
- Demo and example data must stay fictional (`example.com` emails, `+46 70 000 00 00`-style numbers, made-up companies).
