# Sales Flow: Effortless Stage Hand-offs

Build the missing conversion moments so a rep never has to re-type data when moving something forward. Ship in 5 usable slices — each is valuable on its own.

---

## Slice 1 — "Convert to Deal" on Prospect

**Where:** Prospect detail header (`/prospects/:id`)

- New **"Convert to Deal"** button next to Edit / Log Visit.
- Opens the existing Deal dialog (`DealDialog`) in create mode, pre-filled:
  - `name` = prospect name
  - `description` = prospect address + category + notes (concatenated)
  - `prospect_id` = current prospect
  - Owner = current user (or prospect owner)
- On successful create: flip `prospects.status` → `converted` and toast "Converted — view deal" with a link.
- If the prospect is already `converted`, show a small "→ Became [Deal Name]" link instead of the button (backlink from Slice 5, cheap to include now).

**Files:** `DealDialog.tsx` (accept `initialValues` + `prospectId` props), `ProspectDetail.tsx` (button + status flip).

---

## Slice 2 — Real Deal Stage Pipeline

**Schema change (migration):**
- New enum `deal_stage`: `new`, `qualifying`, `proposal`, `negotiation`, `won`, `lost`, `on_hold`.
- New column `deals.stage` (enum, default `new`, not null).
- Backfill from existing `status`: `active` → `qualifying`, `won` → `won`, `lost` → `lost`.
- Keep `deals.status` for now — treat as derived (`won`/`lost`/`active`) via a trigger that syncs it from `stage`, so existing chat/billing code that reads `status` doesn't break.
- Optional `lost_reason` text column (nullable) for when stage = `lost`.

**UI:**
- Add a **Stage** selector on the Deal dialog and Deal detail header (inline dropdown, per project convention).
- List view (`DealsNew.tsx`): replace the 3-tab status filter with a stage filter (All / Active / Won / Lost, where "Active" = everything not terminal). Add a Stage column.
- When user picks `lost`, prompt for `lost_reason` (required).

**Files:** migration; `DealDialog.tsx`, `DealDetail.tsx`, `DealsNew.tsx`, `types.ts` regenerates.

---

## Slice 3 — Won → Create Organization

**Trigger:** When a deal's stage moves to `won` (in dialog, detail page, or Kanban).

- If `deals.organization_id` is already set → just toast "Deal won" and stop (org already exists).
- Otherwise, open a **"Create Organization from this deal"** dialog, pre-filled:
  - `name` = deal name
  - `address` fields = pulled from the linked prospect (if any)
  - `type` = "Private Company" default
- Two buttons: **Create Organization** (creates org, sets `deals.organization_id`, optional inline "Add Contact" section) or **Skip for now** (deal still moves to Won, org can be created later from the deal detail page).
- After org creation, offer a follow-up "Add Contact" mini-form (name, email, phone) that inserts a Contact linked to the new Org — one shot, skippable.

**Files:** new `WonDealDialog.tsx` (composes org create + contact create), hook into stage-change handler in `DealDetail.tsx` and `DealDialog.tsx`.

---

## Slice 4 — Kanban View on `/deals`

- Add a view toggle at top of `DealsNew.tsx`: **Board | Table** (defaults Board for reps, Table for admins — configurable later).
- Board = columns per stage (New, Qualifying, Proposal, Negotiation, On Hold, Won, Lost).
- Each card: name, org (if any), value, temperature dot, owner avatar.
- Drag between columns to move stage. Uses `@dnd-kit/core` (already in shadcn ecosystem, will install if missing).
- Column headers show count + sum of `expected_value`.
- Dropping onto Won triggers Slice 3's dialog. Dropping onto Lost prompts for reason.
- Filters (owner, search) apply to both views.

**Files:** new `DealKanban.tsx`, `DealCard.tsx`; `DealsNew.tsx` gets the toggle.

---

## Slice 5 — Backlinks (traceability)

Small, quick, high-value once the pipeline is real.

- **Prospect detail:** if `converted`, show "→ Became [Deal Name]" linking to the deal.
- **Deal detail:** if `prospect_id` set, show "← From Prospect [Name]" in the header. If `organization_id` set and stage is won, show "→ Organization [Name]".
- **Organization detail:** query for deals where `organization_id = this org AND stage = won`, show them under a "Won From" section (or just add a single "← Won from Deal [Name]" line if only one).

**Files:** `ProspectDetail.tsx`, `DealDetail.tsx`, `OrganizationDetail.tsx`.

---

## Suggested build order

1. Slice 1 (Convert to Deal) — smallest, most visible friction removed
2. Slice 2 (Stage pipeline) — foundation for 3 & 4
3. Slice 3 (Won → Org) — closes the loop
4. Slice 4 (Kanban) — pipeline becomes visual
5. Slice 5 (Backlinks) — polish pass

---

## Technical notes

- **Migration in Slice 2** is the only schema change; everything else is code.
- **`deals.status` stays** as a synced derived column (via BEFORE UPDATE trigger `status := CASE stage WHEN 'won' THEN 'won' WHEN 'lost' THEN 'lost' ELSE 'active' END`) so `DealChat`, billing hooks, and MCP tools that read `status` keep working unchanged.
- **RLS on new dialogs:** org creation already has policies (admin/agent); reps without org-create permission see the Won dialog but the "Create Organization" button is disabled with tooltip "Ask an admin to create the client org."
- **No changes to Contacts, Projects, Billing, HR, or DealChat.**
- **`prospect_id`, `organization_id`, `contact_id`** already exist on `deals` — no FK work needed.

Confirm this plan (or say "just Slice 1 + 3 first") and I'll build.
