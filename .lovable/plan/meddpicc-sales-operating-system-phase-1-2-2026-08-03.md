# MEDDPICC Sales Operating System — Phase 1 & 2

Turn the deal pipeline into an evidence-driven qualification system based on the updated blueprint. This plan covers the methodology foundation and the manual MEDDPICC workflow (blueprint Phases 1–2). AI assistance, integrations, and forecast analytics come later.

## 1. Methodology profiles

Three profiles, chosen per deal by complexity signals (stakeholders, security review, procurement, custom scope, competitive process) — not by amount:

- **MEDDPICC Full** — all 8 elements (custom software, AI, ERP/integration deals)
- **Standard** — the 6 MEDDIC elements
- **Lite** — Problem, Outcome, Decision maker, Buying process, Timing, Alternative, Next action

New deals default to Full; the profile can be switched on the deal at any time and only its elements appear in the UI.

## 2. Stages and gates

Replace the current stages (new, qualifying, proposal, …) with the blueprint pipeline, using the plain-English labels:

```text
Discovery → Qualified Opportunity → Solution Fit → Preferred Vendor
  → Negotiation & Contracts → Ready to Sign → Won / Lost
```

Existing deals are mapped onto the new stages automatically (new → Discovery, qualifying → Qualified Opportunity, proposal → Solution Fit, and so on).

Gates behave as **warnings plus override**, per the blueprint: moving a deal forward with unmet gates shows exactly what is missing and requires a written reason, which is recorded on the deal. Nothing is hard-blocked.

## 3. Element cards and 0–4 evidence scoring

Each deal gets an element card per MEDDPICC letter with:

- A 0–4 evidence score (0 Unknown → 4 Demonstrated) with the rubric visible on hover
- A short summary
- Linked evidence items (note, date, source, who confirmed it)
- Last-verified date, with a **stale** flag after a configurable age

The deal header shows an 8-box heat map, the total score (x/32), and a separate **critical gaps** count. Score and stage stay visually separate — a high score never implies health if a fatal gap exists.

## 4. Critical-gap rules

Evaluated live and surfaced on the deal and in list views:

- No buyer-owned pain → not fully qualified
- Economic Buyer unknown in a late stage → cannot be Ready to Sign
- No active champion → cannot be Ready to Sign
- Decision Process unvalidated → close date unreliable
- Paper Process unknown in Negotiation & Contracts → cannot be Ready to Sign
- No customer-owned next step → stalled
- No compelling event → urgency risk
- Unresolved must-have criterion → high loss risk
- Competition unknown → reduced confidence

## 5. Structured records

Backing records that feed the element scores, each editable from its element card:

- Stakeholders (role, authority, influence, stance, engagement recency)
- Metrics (baseline, target, timeframe, owner)
- Pains (level, impact, consequence, owner)
- Decision criteria (weight, must-have flag, our position)
- Process steps (decision + paper, dated and owned)
- Competitors (type, position, strategy)
- Risks and next actions (owner, due date, customer-owned vs seller-owned)
- Compelling event, plus Why Change / Why Now / Why Us

## 6. Deal Command Center

The deal page gets a restructured layout: header (stage, score, gaps, next action) → Three Whys strip → MEDDPICC heat map → tabs for Stakeholders, Records, Evidence feed, Process timeline, Risks. Existing Chat, Documents, and History tabs stay.

The Kanban gets the new stage columns plus a score and gap indicator on each card.

## 7. Closed Won / Closed Lost capture

Won and Lost dialogs capture the blueprint's structured fields (win reason, competition defeated, promised metrics — or loss type, actual winner, element breakdown, last score snapshot). Won continues to trigger organization/project creation as today.

---

## Technical notes

- New tables: `methodology_profiles`, `deal_elements` (score + summary per letter), `evidence_items`, `deal_stakeholders`, `deal_metrics`, `deal_pains`, `decision_criteria`, `process_steps`, `deal_competitors`, `deal_risks`, `deal_next_actions`, `score_snapshots`, `stage_history`. All with RLS and grants matching existing deal access rules.
- `deals` gains: `methodology_profile`, `why_change`, `why_now`, `why_us`, `qualification_score`, `critical_gap_count`, `forecast_category`, `target_decision_date`, `target_signature_date`, next-action fields, `gate_override_reason`.
- The `deal_stage` enum is replaced with the 8 new values via a migration that remaps existing rows; `DealKanban`, `DealDialog`, `WonDealDialog`, `DealsNew`, prospect conversion, and dashboard widgets are updated to the new values.
- Score, gap, and staleness computation lives in one shared module so the deal page, Kanban, and MCP server report identical numbers.
- Audit triggers extend to the new tables so the change-history page and `revert_record` keep working.
- The MCP server gains read/write tools for the new records so the agent can log evidence and read qualification state.

## Scope note

This is a large build, best delivered in two passes: stages + element cards + scoring + gaps first (usable immediately), then structured records + command center layout + closed won/lost capture.