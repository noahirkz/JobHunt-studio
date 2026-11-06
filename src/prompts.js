// The four prompts the app sends to the model. Each step must reply with JSON only.
// Edit the wording here; keep the JSON shapes, because the views read those exact fields.
//
// Every function takes a context object:
//   ctx = { today, location, profileName, cv, guard }
// and the lead (job) it works on, where relevant.

import { clip, langName } from "./util.js";

export const SYSTEM = "You are a careful assistant inside Jobhunt Studio, a job-application tool. Reply with valid JSON only: no markdown fences, no text before or after the JSON.";

const where = (ctx) => (ctx.location ? ` based in ${ctx.location}` : "");

function cvBlock(ctx) {
  return `CANDIDATE CV (profile: ${ctx.profileName || "default"}):
"""
${clip(ctx.cv, 12000)}
"""`;
}

function notesBlock(ctx, label = "CANDIDATE NOTES (true facts and limits; where they conflict with the CV, the notes are correct)") {
  return `${label}:
"""
${clip(ctx.guard, 4000)}
"""`;
}

/** Step 2+3: read the ad, score the fit 0–10 against the CV. */
export function analyzePrompt(lead, ctx) {
  return `You are the analysis step in Jobhunt Studio, a job-application assistant for one candidate${where(ctx)}. Today is ${ctx.today}.

Read the job ad and the candidate's CV, then judge the fit honestly, like a strict recruiter.
- score is an integer 0-10. 7 or more means "apply now". 10 means an obvious match. Below 7 is filtered out of the main list.
- Evidence must come only from the CV and the candidate notes. If something is not there, it is a gap.
- breakdown values are integers 0-10.
- Write in English even if the ad is in another language. Keep each string under 25 words.
- deadline: as written in the ad, or "Not stated". If the deadline is before today, say so in flags.
- requirements: 4-9 rows covering the ad's must-haves first.

Reply with only this JSON:
{"analysis":{"title":"","company":"","location":"","type":"","deadline":"","language":"ISO 639-1 code of the ad's language, e.g. en or sv","summary":"2 sentences on what the job really is","mustHave":[""],"niceToHave":[""],"keywords":["5-10 words the ad repeats"],"flags":["deadlines, tests, shifts, licences, citizenship, location"]},
"match":{"score":0,"verdict":"one sentence","breakdown":{"skills":0,"experience":0,"education":0,"logistics":0},"requirements":[{"req":"","status":"met | partial | gap","evidence":""}],"pitch":"the one angle the CV should lead with","risks":[""]}}

JOB AD${lead.url ? ` (${lead.url})` : ""}:
"""
${clip(lead.adText, 14000)}
"""

${cvBlock(ctx)}

${notesBlock(ctx)}`;
}

/** Step 4: rewrite the CV for this one job, without inventing anything. */
export function tailorPrompt(lead, ctx) {
  return `You are the CV-tailoring step in Jobhunt Studio. Rewrite the candidate's CV for this one job.

Rules:
- Never invent anything: no new employers, titles, dates, tools, certificates, numbers or results. Follow the candidate notes exactly (dates, locations, skill levels, "never claim").
- You may reorder, cut, rephrase and re-emphasise. Use the ad's keywords only where the CV truthfully supports them.
- Write the CV in ${langName(lead.analysis && lead.analysis.language)}.
- One page: about 350-550 words. Experience in reverse-chronological order unless putting the most relevant job first clearly helps; keep dates exact either way. 3-5 bullets for the most relevant job, 1-3 for others.
- headline: the target role in the ad's words plus 2-3 matching strengths.
- contact: copy the contact line from the CV exactly.
- changes: each meaningful edit, explained to the candidate in plain English (what + why).
- notClaimed: ad requirements you deliberately left out because the CV doesn't support them.

Reply with only this JSON:
{"cv":{"name":"","headline":"","contact":"","summary":"","sections":[{"title":"Experience","entries":[{"role":"","org":"","place":"","dates":"","bullets":[""]}]},{"title":"Skills","rows":[{"label":"","text":""}]},{"title":"Education","entries":[{"role":"","org":"","place":"","dates":"","bullets":[""]}]},{"title":"Languages","rows":[{"label":"","text":""}]}]},"changes":[{"what":"","why":""}],"notClaimed":[""]}
Each section has either "entries" or "rows". Add a Projects section only if it helps this job.

JOB AD:
"""
${clip(lead.adText, 12000)}
"""

ANALYSIS AND MATCH:
${JSON.stringify({ analysis: lead.analysis, match: lead.match })}

${cvBlock(ctx)}

${notesBlock(ctx, "CANDIDATE NOTES (where they conflict with the CV, the notes are correct — use the notes' employer names, dates, locations and grades)")}`;
}

/** Step 5: decide whether a letter is needed, then write one. */
export function letterPrompt(lead, ctx) {
  return `You are the cover-letter step in Jobhunt Studio. Decide whether this application needs a cover letter, then write one anyway.

- need: "required" if the ad asks for a letter, motivation or written answers; "recommended" if a letter clearly helps (no CV asked for, career change, a gap to explain); otherwise "optional".
- Letter: 180-280 words in ${langName(lead.analysis && lead.analysis.language)}. Plain, specific and confident. No clichés ("I am writing to express", "passionate", "team player", "dynamic").
- If the ad gives application instructions (questions to answer, things to state), answer them directly.
- Use only facts from the tailored CV and the notes. If there is one important gap, name it once and say how the candidate will close it.
- checks: things the candidate must confirm before sending (start date, salary, contact names), in English.

Reply with only this JSON:
{"need":"required | recommended | optional","reason":"one sentence in English","letter":{"subject":"","greeting":"","paragraphs":["",""],"closing":"","signature":""},"checks":[""]}

JOB AD:
"""
${clip(lead.adText, 12000)}
"""

MATCH:
${JSON.stringify(lead.match || {})}

TAILORED CV:
${JSON.stringify(lead.cv || {})}

${notesBlock(ctx, "CANDIDATE NOTES")}`;
}

/** "Find leads" view: other industries the CV could fit. */
export function industriesPrompt(ctx) {
  const area = ctx.location ? `in or near ${ctx.location}` : "in the candidate's region";
  return `Suggest 6 industries or job families ${area} that this candidate could realistically be hired into soon, beyond the obvious one. Base each on transferable experience in the CV.
Reply with only a JSON array:
[{"industry":"","why":"one sentence citing CV evidence","employers":["3 real employers or employer types in the region"],"queries":["2-3 search terms as written on local job boards, in the local language where that helps"]}]

CV:
"""
${clip(ctx.cv, 12000)}
"""

${notesBlock(ctx, "Corrections and limits that override the CV")}`;
}

// ---------- shape checks for model replies ----------
// Each returns the cleaned value or throws {code:"invalid_json"}.

const bad = () => {
  throw { code: "invalid_json" };
};
const arr = (v) => (Array.isArray(v) ? v.filter((x) => x != null && x !== "") : []);

export function checkAnalysis(out) {
  if (!out || typeof out.analysis !== "object" || typeof out.match !== "object" || !out.analysis || !out.match) bad();
  return out;
}
export function checkTailor(out) {
  if (!out || !out.cv || !Array.isArray(out.cv.sections)) bad();
  return { cv: out.cv, changes: arr(out.changes), notClaimed: arr(out.notClaimed) };
}
export function checkLetter(out) {
  if (!out || !out.letter || !Array.isArray(out.letter.paragraphs)) bad();
  return { letter: out.letter, need: out.need, needReason: out.reason, checks: arr(out.checks) };
}
export function checkIndustries(out) {
  if (out && !Array.isArray(out) && Array.isArray(out.industries)) out = out.industries;
  if (!Array.isArray(out)) bad();
  const list = out.filter((x) => x && x.industry).slice(0, 8);
  if (!list.length) bad();
  return list;
}
