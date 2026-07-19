## Goal
Make the walk from Prospect → Deal feel effortless. Prospects stay lightweight (business + visits). Contact and Organization are attached at conversion time, with the choice to pick existing or create new — inline, no leaving the flow.

## What changes

### 1. ProspectDetail — cleaner conversion entry
- Keep "Convert to Deal" as the primary CTA (already there).
- Clicking it opens a new dedicated **Convert to Deal** sheet (not the generic DealDialog) so the flow is purpose-built.

### 2. New `ConvertProspectSheet` component
A single right-side sheet with three sections, top to bottom:

**A. Deal basics** (pre-filled from prospect)
- Deal name (defaults to prospect name)
- Temperature slider (default 5)
- Expected value (optional)
- Stage locked to "Qualifying" for conversions

**B. Organization** — segmented control
- `Use existing` → searchable combobox of orgs
- `Create new` → inline fields: name (defaults to prospect name), address (defaults to prospect address), phone (defaults to prospect phone), website (defaults to prospect website), type (Private Company default)
- `Skip for now` → no org attached

**C. Contact** — segmented control
- `Use existing` → searchable combobox (filtered to selected org if one was picked)
- `Create new` → inline fields: first name, last name, email, phone, title. If a visit had a `person_spoken_to`, pre-fill last-name field with it as a starting hint.
- `Skip for now` → no contact attached (valid for card-drop prospects)

### 3. Submit behavior (single transaction feel)
On "Convert":
1. If "Create new" org selected → insert into `organizations`, capture id.
2. If "Create new" contact selected → insert into `contacts` with the org id (new or picked), capture id.
3. Insert `deals` row with `prospect_id`, `organization_id`, `contact_id`, stage=`qualifying`, plus deal basics.
4. Update `prospects.status = 'converted'`.
5. Toast success and navigate to `/deals/{id}`.

Errors on any step surface a toast and stop the flow (no partial deal without the just-created org/contact — we insert org first, then contact, then deal so refs are valid).

### 4. Small polish
- Remove the current `DealDialog` invocation from ProspectDetail (replaced by the new sheet).
- Prospect detail keeps the "→ Became Deal: X" backlink already in place.
- No schema changes.

## Files touched
- `src/components/prospects/ConvertProspectSheet.tsx` (new)
- `src/pages/ProspectDetail.tsx` (swap DealDialog → ConvertProspectSheet)

## Out of scope
- Adding contacts/orgs directly to a Prospect (per your direction: prospects stay lightweight; contact/org attachment happens at conversion).
- Visit log changes (already the way you want).
- Won-stage org creation flow (`WonDealDialog`) — untouched.
