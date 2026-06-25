# Sales Flow: Canvassing → Pipeline

Build a proper top-of-funnel (canvassing) and a real, staged deal pipeline on top of it. Two new things, one rework.

---

## 1. Canvassing layer (new)

### Prospects (place-first)
A Prospect is a physical business we've walked into. It lives separately from Organizations until it's worth promoting.

Fields:
- Business name, address (Mapbox autocomplete, same as orgs)
- Category (restaurant, retail, office, other — editable list)
- Phone, website (optional)
- Status: `new` · `warm` · `cold` · `do_not_contact` · `converted`
- Owner (the rep who first dropped a card; transferable)
- Notes
- Auto-computed: visit count, last visit date, last contact made y/n

### Visits (history under a prospect)
Each drop-off is one Visit record. A Prospect accumulates many.

Fields:
- Prospect (parent)
- Rep (auto = current user, overridable)
- Visited at (date + time, defaults now)
- Contact made: yes / no / left card only
- Person spoken to (free text — not a Contact record yet)
- Outcome notes
- Follow-up due date (optional — surfaces in "My Follow-ups")
- Follow-up completed flag

### Pages & UI
- **`/prospects`** — list/table with search, status filter, owner filter, "needs follow-up" filter. Map view toggle (Mapbox, since we already use it) as a v1 nice-to-have.
- **`/prospects/:id`** — HubSpot-style detail: header with name/address/status, inline-editable fields, Visits timeline, "Log Visit" button (right-side slide-in sheet, per project convention), "Convert to Deal" button.
- **Dashboard widget** — "My Follow-ups This Week" for sales reps.
- Sidebar: new "Prospects" item above Opportunities, visible to Admin + Sales Agent.

### Convert to Deal
One click on a Prospect → opens the Deal dialog pre-filled with prospect name, address, owner, and a back-link. Prospect status flips to `converted`. **No Organization is created** at this point (per your choice) — Org gets created later only if the deal is won.

---

## 2. Deal pipeline rework

You said there's no structured flow today. Replacing the current `active / won / lost` flat status with a real pipeline:

### Stages (in order)
1. **New** — just created from a prospect or cold
2. **Qualifying** — initial conversation, fit unclear
3. **Proposal** — quote/scope sent
4. **Negotiation** — terms back-and-forth
5. **Won** (terminal) → triggers "Create Organization" prompt
6. **Lost** (terminal, requires reason)
7. **On Hold** (paused, not terminal)

Stored as an enum so we can re-order/rename later without code rewrites everywhere.

### Ownership & hand-off
- **Owner** (sales rep) — stays with the deal start-to-finish; accountable for movement.
- **Assigned team** (multi) — operators/PMs added at Proposal+ stage for scoping help.
- Stage change writes to a `deal_activity` log (who moved it, when, from→to) — gives us the hand-off trail.

### Pipeline view (`/deals`)
- Default = **Kanban board** by stage, drag to move (with permission check).
- Toggle to table view (current view, kept).
- Filters: owner, stage, temperature, value range.
- Per-stage totals (count + sum of expected value) at the top of each column.

### Reporting (small, focused)
On Dashboard for admins:
- Deals by stage (count + $)
- Conversion rate stage-to-stage (last 90 days)
- Avg time in stage (flags stalls)
- Top reps by won $ this month
Reps see only their own.

---

## 3. Reminders

Simple due-date model (no scheduled emails this round):
- Visit follow-up date → "My Follow-ups" list on dashboard + a badge in sidebar when overdue.
- Same pattern usable later on Deals if you want.

We can layer email/push reminders later via a cron + edge function — flagged as v2.

---

## What I won't touch
- Existing Organizations, Contacts, Projects, Billing, HR — untouched.
- The Deal detail page (chat, attachments, temperature) stays; we're adding stage + activity log around it.
- No data migration needed — existing deals get auto-mapped: `active`→`Qualifying`, `won`→`Won`, `lost`→`Lost`.

---

## Technical notes

**New tables** (all with RLS, GRANTs, `created_at/updated_at`):
- `prospects` — owner_id, status enum, address fields, geo lat/lng, category
- `prospect_visits` — prospect_id, rep_id, visited_at, contact_made enum, follow_up_due, follow_up_done
- `deal_stages` — seeded enum/lookup (allows reorder)
- `deal_activity` — deal_id, actor_id, action, from_stage, to_stage, metadata

**Schema changes:**
- `deals.stage` (new enum column), keep `status` for now as a computed/derived field (`won`/`lost`/`active`) for back-compat with the chat/billing code.
- `deals.prospect_id` (nullable FK) for the conversion link.

**RLS:**
- Sales agents see their own prospects/visits/deals + anything assigned to them.
- Admin sees all.
- Team members see deals they're on.

**Pages added:** `Prospects.tsx`, `ProspectDetail.tsx`, `VisitLogSheet.tsx`, `DealKanban.tsx` (toggle inside existing `DealsNew.tsx`).

---

## Suggested build order
1. Prospects + Visits tables, pages, log-visit flow, follow-up dashboard widget.
2. Deal stages enum, Kanban view, activity log, convert-from-prospect.
3. Reporting widgets.

Want me to start with step 1, or adjust the stages / fields first?
