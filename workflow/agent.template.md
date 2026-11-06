# Job Search Coach — agent instructions (template)

Copy this file to `workflow/agent.md` (that path is git-ignored, so your details stay private),
replace every `[[...]]` placeholder, and delete the sections you don't need.
Then ask your agent (Claude Code, Claude with a scheduled task, or any agent that can browse)
to "run the daily job search from workflow/agent.md".

---

## Core mission
- Search job ads every day on: [[LinkedIn, Indeed, Glassdoor, HiringCafe, Platsbanken, thehub.io, …]].
- Only keep ads that are **still open** for applications. Drop anything past its deadline or marked filled.
- Compare every job with my CV (`[[path to your CV, e.g. private/cv.md]]`) and the facts below.
  Cross-reference skills, experience, education and logistics.
- Score each job out of 10.
  - **7–9**: put it in the report.
  - **10/10**: put it under **Suggestions**, even if it doesn't match my CV perfectly.
  - **Below 7**: leave it out.
- Skip jobs I've already applied to (see `[[private/applied.md]]`) unless it's clearly a different role.

## About me
- Name: [[Your name]]
- Based in: [[City, Country]] · willing to commute to: [[areas]]
- Work authorization: [[e.g. EU citizen / permanent residence / needs sponsorship]]
- Languages: [[e.g. Swedish (native), English (fluent)]]
- Timeline: [[e.g. need a job within 2 months]]
- Long-term goal: [[e.g. software engineer]]. Short-term: [[e.g. any entry point that builds toward it]].

## Candidate snapshot
- Headline: [[one line]]
- Experience:
  - [[Employer]] — [[Role]] ([[dates]]): [[2–4 key skills]]
  - [[Employer]] — [[Role]] ([[dates]]): [[2–4 key skills]]
- Education: [[degree, school, expected year]]
- Technical skills: [[list]]
- Certifications: [[list, and mark which are "in progress"]]

## Facts and limits (never break these)
- Keep employer names, dates and locations exactly as written in my CV.
- Skill levels: [[e.g. Python: intermediate · Intune: never used]]
- Never claim: [[licences, tools or certificates I don't have]]

## Roles to search
- [[Role 1]]
- [[Role 2]]
- [[Internships / junior roles in my field]]
- [[Any role that uses my past experience]]

### Search terms
- **English:** [[comma-separated terms]]
- **[[Local language]]:** [[comma-separated terms]]

## Ranking rules
Give higher scores to jobs that are:
- in [[your region]]
- entry-level or a realistic step for my experience
- close to my long-term goal
- [[permanent / full-time / internship / long contract]]

## Output — every run
1. Write the report to `reports/[[YYYY-MM-DD]].md` using the template below.
2. Also write `reports/[[YYYY-MM-DD]].leads.json` in this shape, so I can import the jobs into
   Jobhunt Studio (Find leads → Import leads):
   ```json
   {"leads": [{"title": "", "company": "", "location": "", "url": "", "deadline": "", "type": "", "source": "", "adText": "the full ad text"}]}
   ```
   Put the **full ad text** in `adText`; the app scores and tailors from it.
3. If you have an email tool, email me the report at [[your email]] with the subject
   "Job report [[YYYY-MM-DD]]". If not, just save the files.

## Daily report template

**Date:**

**Jobs found (7–9):**
- Title — Company — Location — Score/10 — link
- Why: 2–3 sentences cross-referencing my CV and goal.

**Suggestions (10/10, or worth a stretch):**
- Title — Company — Location — link
- Why it's worth checking, even if it's outside my current CV.

**Closed or dropped:**
- Title — Company — why (deadline passed, filled)

**Next actions:**
- Applications to send first, CV tweaks, keywords to add, recruiters to contact.
