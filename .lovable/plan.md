# CRM Restructure: Prospecting + Opportunities Operating Model

Reorganize the CRM around two connected operating areas (Prospecting and Opportunities) with Companies and People as supporting master records, per the recommendation document. Delivered in four phases so each one is usable on its own.

Labels: **Companies** and **People** replace Organizations and Contacts in the UI (database terminology stays as-is).

Target navigation:

```text
CRM
├── Sales Home
├── Prospecting
├── Opportunities
├── Companies
├── People
├── Activities
├── Tasks
└── Reports
```

---

## Phase 1 — Navigation and labels

- Rebuild the CRM sidebar group into the eight tabs above; Sales Home, Activities, Tasks and Reports start as routed placeholder pages that fill in later phases.
- Rename Organizations to Companies and Contacts to People across nav, page headers, breadcrumbs, dialogs and empty states.
- Companies get a relationship status field (Target Account, Prospect Account, Active Opportunity, Customer, Former Customer, Partner, Vendor, Inactive, Do Not Contact), separate from prospect and deal stages.
- Company detail gains Prospecting and Opportunities tabs showing linked records with counts; People detail gains an Opportunities tab.

## Phase 2 — Prospecting pipeline

- Prospect stages become Target → Prospect → Contacted → Connected → Discovery Scheduled → Converted, with existing prospects mapped onto the new values.
- Prospecting views: Board (kanban by stage), List (owner, source, last/next activity, attempts, interest, days in stage), My Follow-Ups, Unworked, Stale.
- Prospect record layout: header (stage, owner, primary person, source, last activity, next action, days in stage) plus Overview, People, Activities, Tasks, Notes, Documents, History tabs.
- Lightweight prospect qualification checklist (possible problem, spoke with relevant person, interest, discovery scheduled, ready to convert) instead of full MEDDPICC.
- Convert to Opportunity becomes a guided form that creates the deal in Discovery, links company and people, copies activities, tasks, notes and documents, preserves source and campaign, marks the prospect Converted and links it back.

## Phase 3 — Activities and Tasks

- One central Activities timeline with the full type list (call, email, meeting, in-person visit, card drop-off, walk-in, LinkedIn, text, voicemail, proposal sent, demo, and so on), linkable to company, person, prospect, deal or project, with a rich Card Drop-Off form (spoke with, outcome, interest level, what was left, follow-up date, attachment).
- Logging a card drop-off auto-advances a prospect from Prospect to Contacted when it is not already further along.
- Tasks module distinguishing seller-owned vs customer-owned actions, with due dates, owners, type list, and per-record task lists on prospects, companies, people and deals.
- Existing deal next-actions and prospect visits fold into these shared modules rather than staying separate.

## Phase 4 — Sales Home and Reports

- Sales Home: My Work Today, Prospecting Snapshot, Opportunity Snapshot, MEDDPICC Risk Panel, and quick actions (add prospect, log activity, create company, add person, create opportunity, schedule follow-up, record card drop-off).
- Reports grouped into Prospecting, Opportunity, MEDDPICC, Activity and Forecast sets, driven by database views for stage counts, conversion, time in stage, win rate, loss reasons and gap exposure.
- Deal page tabs finalize as Overview, MEDDPICC, Stakeholders, Process, Activities, Tasks, Documents, Commercial, History; Commercial captures pricing, scope, payment schedule, contract/legal/security/PO status and signer.
- Lost capture expands to the recommended loss categories plus who won, why, champion/economic-buyer state, and a re-engagement date.

---

## Technical notes

- New tables: `activities`, `tasks`, and a `deal_people` join carrying per-opportunity MEDDPICC roles (a person can hold different roles on different deals). `prospect_visits` migrates into `activities`.
- `prospects` gains `stage` (new enum), `source`, `campaign`, `interest_level`, `converted_deal_id`, and qualification checklist fields; `organizations` gains `relationship_status`.
- Deal stages already match the MEDDPICC pipeline from the previous build — Phase 4 only adds the Commercial fields and the expanded loss capture.
- All new tables get RLS matching existing deal/prospect access rules, grants, and audit triggers so change history and `revert_record` keep working.
- Reports read from SQL views so the MCP server and the UI report identical numbers; the MCP server gains tools for activities, tasks and prospect stages.
- Renaming is UI-only — no table renames, so existing integrations and the MCP surface stay intact.
