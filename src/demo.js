// Demo data shown on first visit so people can see the whole flow before connecting a model.
// Everything here is fictional: the person, the companies, the ads and the contact details.

export const DEMO_NAME = "Alex Berg";

export const DEMO_CV = `ALEX BERG
Stockholm, Sweden · +46 70 000 00 00 · alex.berg@example.com · github.com/example

PROFILE
IT support technician with three years of 1st/2nd line support, followed by three years running and fixing automated equipment in a 24/7 warehouse. Studying for a B.Sc. in Information Technology online. Swedish and English fluent.

EXPERIENCE
Automation Operator — Nordfrakt Logistics | Mar 2022 – Aug 2025 | Södertälje, Sweden
- Ran and monitored conveyor, sorter and shuttle systems in a warehouse operating 24/7
- Responded to alarms and stoppages; found the cause, followed procedures and restarted lines with minimal downtime
- Logged every fault and fix in the maintenance system for clean shift handovers
- Trained four new operators on safety routines and start-up checks

IT Support Technician — Brightdesk IT (managed IT services) | 2019 – 2022 | Stockholm
- 1st and 2nd line support for about 300 users at small and mid-size client companies
- Set up laptops and phones for new hires; handled offboarding and access removal
- Managed accounts, passwords and permissions in Microsoft 365 and Google Workspace
- Owned tickets from first report to confirmed fix; wrote how-to guides for repeat issues

PROJECTS
Home lab (2024 – present) — Proxmox server, Linux VMs, Pi-hole DNS, automated backups with Bash scripts.

SKILLS
IT support: ticket handling, onboarding/offboarding, Microsoft 365, Google Workspace, Windows, macOS
Systems: Linux command line, networking basics (TCP/IP, DNS, DHCP), Proxmox
Scripting: Bash, Python (basic)
Other: forklift licence, first aid

EDUCATION
B.Sc. Information Technology — Open University (online) | Expected 2027

LANGUAGES
Swedish (native), English (fluent)`;

export const DEMO_GUARD = `Facts to keep exactly:
- Nordfrakt Logistics: Mar 2022 – Aug 2025, Södertälje.
- Brightdesk IT: 2019 – 2022, Stockholm.
- Degree is in progress (expected 2027), not finished.

Skill levels (never overstate):
- Python: basic.
- Intune / Jamf (MDM): never used.
- Active Directory: only through Microsoft 365, no on-prem admin.

Never claim:
- Fibre splicing or Fluke certification
- A driving licence
- Any numbers or results not written in the CV`;

export const DEMO_INDUSTRIES = [
  { industry: "Data centers and colocation", why: "IT support plus 24/7 equipment work is the mix 'remote hands' roles hire for.", employers: ["Colocation operators", "Hyperscale sites", "Data center contractors"], queries: ["data center technician", "datacentertekniker", "remote hands"] },
  { industry: "Warehouse and logistics automation", why: "Three years running conveyors and sorters transfer straight to automation technician roles.", employers: ["3PL warehouses", "E-commerce fulfilment centres", "Automation integrators"], queries: ["automationstekniker", "lagerautomation", "automation technician"] },
  { industry: "Field service", why: "Fault-finding under time pressure and customer contact are the core of field service.", employers: ["Equipment manufacturers", "Facility service firms", "IT hardware partners"], queries: ["servicetekniker", "field service technician"] },
  { industry: "IT operations and NOC", why: "Ticket ownership and shift handovers fit monitoring and operations desks.", employers: ["Banks", "Telecom operators", "Managed service providers"], queries: ["driftoperatör", "NOC technician"] },
];

export const DEMO_APPLIED = [
  { company: "Nordlys Data Centers", role: "Critical Facilities Engineer", when: "2026-09-08", status: "Pending" },
  { company: "Helio Retail", role: "IT Support, Kista", when: "2026-08-20", status: "Rejected" },
];

const showcaseCV = {
  name: "ALEX BERG",
  headline: "IT Technician · macOS, Windows & Linux · Google Workspace & Microsoft 365",
  contact: "Stockholm, Sweden · +46 70 000 00 00 · alex.berg@example.com · github.com/example",
  summary: "IT support technician with three years of 1st and 2nd line support for about 300 users, followed by three years keeping automated equipment running in a 24/7 warehouse. Sets up laptops and phones for new hires, manages accounts in Google Workspace and Microsoft 365, and owns tickets from first report to confirmed fix. Runs a Linux home lab and scripts routine work in Bash. Fluent in Swedish and English.",
  sections: [
    { title: "Experience", entries: [
      { role: "IT Support Technician", org: "Brightdesk IT (managed IT services)", place: "Stockholm", dates: "2019 – 2022", bullets: [
        "Gave 1st and 2nd line support to about 300 users at small and mid-size client companies.",
        "Set up laptops and phones for new hires and handled offboarding and access removal.",
        "Managed accounts, passwords and permissions in Google Workspace and Microsoft 365.",
        "Wrote how-to guides so users could fix repeat issues themselves.",
      ] },
      { role: "Automation Operator", org: "Nordfrakt Logistics", place: "Södertälje, Sweden", dates: "Mar 2022 – Aug 2025", bullets: [
        "Responded to alarms and stoppages in a 24/7 warehouse, found the cause and restarted lines with minimal downtime.",
        "Logged every fault and fix for clean shift handovers.",
      ] },
    ] },
    { title: "Skills", rows: [
      { label: "IT support", text: "1st/2nd line · onboarding/offboarding · accounts and permissions · user guides" },
      { label: "Platforms", text: "Windows · macOS · Linux (command line) · Google Workspace · Microsoft 365" },
      { label: "Scripting", text: "Bash · Python (basic)" },
    ] },
    { title: "Projects", entries: [
      { role: "Home lab", org: "personal project", place: "", dates: "2024 – present", bullets: ["Proxmox server with Linux VMs, Pi-hole DNS and automated Bash backups."] },
    ] },
    { title: "Education", entries: [
      { role: "B.Sc. Information Technology", org: "Open University (online)", place: "", dates: "Expected 2027", bullets: [] },
    ] },
    { title: "Languages", rows: [{ label: "", text: "Swedish (native) · English (fluent)" }] },
  ],
};

export const DEMO_LEADS = [
  {
    id: "demo-fikalabs",
    title: "IT Technician",
    company: "Fikalabs AB",
    location: "Stockholm, on site",
    source: "Demo",
    url: "",
    posted: "Demo ad",
    deadline: "Rolling",
    type: "Full time · start ASAP",
    adText: `IT Technician — Fikalabs AB (fictional demo ad)
Stockholm, on site · Full time · Start ASAP

You will:
- Give 1st and 2nd line support for laptops, phones and meeting rooms via Slack, tickets or in person
- Set up Mac, Windows and Linux machines for new hires using MDM tools, and handle offboarding
- Manage user access in Google Workspace, Jira and Slack
- Write documentation so people can help themselves

We are looking for:
- Experience as an IT support technician
- Troubleshooting in at least two of macOS, Windows or Linux
- Good knowledge of Google Workspace (preferred) or Microsoft 365
- Fluent English
- Willingness to work from our Stockholm office

Selection is continuous; we may close the ad early.`,
    analysis: { title: "IT Technician", company: "Fikalabs AB", location: "Stockholm, on site", type: "Full time", deadline: "Rolling — continuous selection", language: "en",
      summary: "Hands-on 1st and 2nd line IT for a small product company: onboarding laptops, user access in Google Workspace and fixing whatever breaks. You'd be the on-site IT person.",
      mustHave: ["IT support experience", "Two of macOS, Windows, Linux", "Google Workspace or Microsoft 365", "Fluent English", "Work from the Stockholm office"],
      niceToHave: ["MDM tools", "Jira and Slack admin", "Meeting-room AV", "Self-help documentation"],
      keywords: ["1st and 2nd line", "onboarding", "MDM", "Google Workspace", "documentation"],
      flags: ["Continuous selection: apply this week"] },
    match: { score: 8, verdict: "Strong fit: real 1st/2nd line experience on the platforms they name; the only real gap is MDM tooling.",
      breakdown: { skills: 8, experience: 7, education: 7, logistics: 10 },
      requirements: [
        { req: "IT support experience", status: "met", evidence: "Three years at Brightdesk IT (2019–2022)" },
        { req: "Two of macOS, Windows, Linux", status: "met", evidence: "Windows and macOS support; Linux home lab" },
        { req: "Google Workspace or Microsoft 365", status: "met", evidence: "Managed accounts in both" },
        { req: "Fluent English", status: "met", evidence: "English fluent" },
        { req: "Stockholm office", status: "met", evidence: "Lives in Stockholm" },
        { req: "MDM tools", status: "gap", evidence: "Notes say Intune/Jamf never used" },
        { req: "Self-help documentation", status: "met", evidence: "Wrote how-to guides at Brightdesk" },
      ],
      pitch: "Lead with onboarding and offboarding at scale, and the home lab as proof you keep learning.",
      risks: ["IT support experience ends in 2022: show the 24/7 fault-finding since", "MDM gap: say you'll learn it, don't claim it"] },
    profile: "General IT",
    cv: showcaseCV,
    cvProfile: "General IT",
    changes: [
      { what: "Put Brightdesk IT first", why: "It's your IT support experience and the ad's first requirement. Dates stay exact." },
      { what: "Rewrote the headline in the ad's words", why: "Recruiters scan for 'IT Technician', the three operating systems and Google Workspace." },
      { what: "Kept the home lab", why: "It shows recent hands-on Linux work for a gap since 2022." },
      { what: "Cut forklift and first aid", why: "Not relevant here, and keeps the CV to one page." },
    ],
    notClaimed: ["MDM tools (Intune, Jamf)", "Jira and Slack administration", "Meeting-room AV systems"],
    need: "optional",
    needReason: "The ad doesn't ask for a letter. Paste it into the free-text field or skip it.",
    letter: {
      subject: "Application: IT Technician",
      greeting: "Hi,",
      paragraphs: [
        "I'm applying for the IT Technician role at Fikalabs. Hands-on 1st and 2nd line support, setting up machines for new hires and keeping access tidy in Google Workspace is the work I know best.",
        "For three years I supported about 300 users at Brightdesk IT. I set up laptops and phones for new starters, removed access when people left, managed accounts in Google Workspace and Microsoft 365, and wrote guides so the same problem didn't come back.",
        "Since 2022 I've kept automated equipment running in a 24/7 warehouse, which taught me to stay calm and structured when something stops and people are waiting. I haven't used an MDM tool such as Intune or Jamf yet; it's the first thing I'd learn in the role.",
        "I live in Stockholm and can start at short notice. I'd be glad to tell you more in an interview.",
      ],
      closing: "Best regards,",
      signature: "Alex Berg",
    },
    checks: ["Confirm you can start at short notice before sending."],
  },
  {
    id: "demo-nordlys",
    title: "Data Center Technician",
    company: "Nordlys Data Centers",
    location: "Stockholm, on site",
    source: "Demo",
    url: "",
    posted: "Demo ad",
    deadline: "Not stated",
    type: "Full time · shifts",
    adText: `Data Center Technician — Nordlys Data Centers (fictional demo ad)
Stockholm · Full time · Shift rotation

Responsibilities:
- Install customer equipment and cabinets
- Install and test cross connects (copper and fibre) following SOPs
- Work the ticket queue and meet commitment times
- Keep detailed written records of all work

Essential:
- Strong written and spoken English
- Customer service experience
- Able to work shifts including nights and weekends

Desirable:
- Basic Swedish
- Experience with Fluke testers`,
    analysis: { title: "Data Center Technician", company: "Nordlys Data Centers", location: "Stockholm, on site", type: "Full time, shifts", deadline: "Not stated", language: "en",
      summary: "Entry-level 'remote hands' work in a colocation data center: racking gear, running and testing cables, working a ticket queue. Training is built in.",
      mustHave: ["Strong English", "Customer service experience", "Shift work incl. nights and weekends"],
      niceToHave: ["Basic Swedish", "Fluke testers", "Cabling"],
      keywords: ["cross connects", "SOPs", "ticket queue", "documentation"],
      flags: ["You applied to Nordlys before (different role)", "Shift work"] },
    match: { score: 8, verdict: "Good fit: all essentials met; cabling and tester skills are learned on the job.",
      breakdown: { skills: 7, experience: 8, education: 7, logistics: 9 },
      requirements: [
        { req: "Strong English", status: "met", evidence: "English fluent" },
        { req: "Customer service", status: "met", evidence: "Supported ~300 users at Brightdesk IT" },
        { req: "Shift work", status: "met", evidence: "24/7 warehouse with shift handovers" },
        { req: "Cross-connect testing", status: "partial", evidence: "Hardware setup; no fibre or Fluke testing" },
        { req: "Ticket queue", status: "met", evidence: "Owned tickets end to end" },
        { req: "Basic Swedish", status: "met", evidence: "Swedish native" },
      ],
      pitch: "Customer-facing IT support plus 24/7 operations discipline: procedures, tickets and clean handovers.",
      risks: ["Mention your earlier Nordlys application", "No fibre testing experience yet"] },
    profile: "General IT",
  },
  {
    id: "demo-kvarnby",
    title: "Automationstekniker till lager",
    company: "Kvarnby Logistik",
    location: "Södertälje",
    source: "Demo",
    url: "",
    posted: "Demo ad",
    deadline: "30 november",
    type: "Heltid · skift",
    adText: `Automationstekniker till lager — Kvarnby Logistik (fiktiv demoannons)
Södertälje · Heltid · Tvåskift

Om tjänsten:
- Felsöka och åtgärda stopp i transportband, sorterare och shuttlesystem
- Förebyggande underhåll enligt plan
- Dokumentera åtgärder i underhållssystemet
- Samarbeta med leverantörer vid större fel

Vi söker dig som:
- Har erfarenhet av automation eller underhåll i lager eller industri
- Har grundläggande el-kunskaper
- Talar och skriver svenska obehindrat
- Har truckkort (meriterande)

Sista ansökningsdag: 30 november.`,
  },
  {
    id: "demo-granit",
    title: "IT Service Desk Specialist",
    company: "Granit Capital",
    location: "Stockholm, office",
    source: "Demo",
    url: "",
    posted: "Demo ad",
    deadline: "Rolling",
    type: "Full time · 6 months",
    adText: `IT Service Desk Specialist — Granit Capital (fictional demo ad)
Stockholm office · Full time · 6-month assignment

- 1st and 2nd level support to 400 users within SLA
- Manage iPhones and laptops with Intune
- Microsoft 365 administration: Exchange Online, Teams, admin portal
- ITIL-based incident and change handling

Requirements: university degree in IT, several years of service desk, strong Microsoft 365 and Intune, excellent Swedish and English.`,
    analysis: { title: "IT Service Desk Specialist", company: "Granit Capital", location: "Stockholm office", type: "Full time, 6 months", deadline: "Rolling", language: "en",
      summary: "Senior-leaning service desk for a demanding office of 400 users, deep in Microsoft 365 and Intune.",
      mustHave: ["Degree in IT", "Several years of service desk", "Microsoft 365 admin", "Intune", "Swedish and English"],
      niceToHave: ["ITIL", "AZ-900"],
      keywords: ["SLA", "Intune", "Exchange Online", "ITIL"],
      flags: ["Degree required (yours is in progress)"] },
    match: { score: 6, verdict: "Stretch: right type of work, but they want a finished degree, Intune and Microsoft 365 admin.",
      breakdown: { skills: 5, experience: 6, education: 4, logistics: 9 },
      requirements: [
        { req: "Degree in IT", status: "partial", evidence: "B.Sc. in progress, expected 2027" },
        { req: "Several years of service desk", status: "partial", evidence: "Three years, ending 2022" },
        { req: "Intune", status: "gap", evidence: "Notes say never used" },
        { req: "Swedish and English", status: "met", evidence: "Both fluent" },
      ],
      pitch: "Only worth it after some Intune practice.",
      risks: ["Likely screened out on degree and Intune"] },
    profile: "General IT",
  },
  {
    id: "demo-paragraf",
    title: "Legal Engineer (student, part time)",
    company: "Paragraf Tech",
    location: "Stockholm",
    source: "Demo",
    url: "",
    posted: "Demo ad",
    deadline: "Not stated",
    type: "Part time",
    adText: `Legal Engineer — Paragraf Tech (fictional demo ad)
Stockholm · Part-time student role

Build and maintain legal document templates. Requirements: final-year law student or recent law graduate; fluent Swedish and English.`,
    analysis: { title: "Legal Engineer", company: "Paragraf Tech", location: "Stockholm", type: "Part time", deadline: "Not stated", language: "en",
      summary: "Template work for law students. 'Engineer' here means legal drafting, not IT.",
      mustHave: ["Law student or graduate", "Swedish and English"], niceToHave: [], keywords: ["legal templates"], flags: ["Hard requirement: law studies"] },
    match: { score: 2, verdict: "Not a fit: the role needs a law student.", breakdown: { skills: 3, experience: 1, education: 0, logistics: 8 },
      requirements: [{ req: "Law student or graduate", status: "gap", evidence: "Studies IT" }, { req: "Swedish and English", status: "met", evidence: "Both fluent" }],
      pitch: "Skip.", risks: ["Hard requirement not met"] },
    profile: "General IT",
  },
];
