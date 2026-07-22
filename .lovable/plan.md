
## Goal
Add a chat-style running notes/comments feed on each employee (in the Employee dialog under HR) so admins and AI agents can post ongoing updates (bonuses issued, payroll split, schedule changes, etc.) separate from the existing static "Notes" field.

## Data model (new table)
Create `public.employee_notes`:
- `id` uuid pk default gen_random_uuid()
- `employee_id` uuid not null references `employees(id)` on delete cascade
- `content` text not null
- `category` text null (optional tag: `general` | `payroll` | `bonus` | `performance` | `schedule`)
- `created_by` uuid null references `auth.users(id)`
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

Grants + RLS (admin-only, matches existing employees table policy):
- `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL TO service_role;`
- Enable RLS. Policies: admins (via `has_role(auth.uid(),'admin')`) can select/insert/update/delete. Also allow `service_role` (so MCP agent using service key can post).
- Add to `supabase_realtime` publication for live updates.
- Trigger to bump `updated_at`.

Regenerate types in `src/integrations/supabase/types.ts` to include the new table.

## UI

### EmployeeDialog.tsx
- Add a new tab or section "Activity" alongside existing sections (Details / Compensation / Raises / Resources). If dialog is single-scroll, add a collapsible "Activity & Notes" block near the bottom, above delete.
- Only render when editing an existing employee (needs `employee.id`).

### New component: `src/components/hr/EmployeeActivityFeed.tsx`
- Chat-like list, newest at bottom (or top — pick newest-at-top for scannability).
- Each entry: author avatar/initial + name, timestamp (relative), optional category chip (text-colored, per project rule no filled badges), content with `whitespace-pre-wrap`.
- Composer at bottom: textarea + category select (General/Payroll/Bonus/Performance/Schedule) + Post button. Enter to submit, Shift+Enter newline.
- Inline edit/delete for the author (admin) via small ghost buttons on hover.
- Realtime subscription (`supabase.channel('employee_notes:<id>')`) to append new rows live.
- Uses react-query for initial load + invalidation.

### Author display
Join with `profiles` to get `full_name`/`email` for `created_by`. For agent-posted entries (created_by null, via service role), show "AI Agent" or "System".

## MCP (optional, non-blocking)
Expose two tools in `supabase/functions/mcp/index.ts` so the agent can write notes: `employee_note.add`, `employee_note.list`. Out of scope unless requested — mention only.

## Files
- new migration `supabase/migrations/<ts>_employee_notes.sql`
- edit `src/integrations/supabase/types.ts`
- new `src/components/hr/EmployeeActivityFeed.tsx`
- edit `src/components/hr/EmployeeDialog.tsx` to mount the feed

## Out of scope
- Existing plain-text "Notes" field stays as-is (long-form summary). The feed is additive.
- No @mentions or reactions in v1 (can add later using the same pattern as deal_messages).
