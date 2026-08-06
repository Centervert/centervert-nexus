# Projects as the Company Wiki & Home Base

Turn each project into the single place the team goes to find everything: written pages (meeting notes, process docs, architecture notes) plus a pinned board of links to the tools that stay outside the portal (Git, Linear, CI, Figma, secrets manager).

## What gets added

### 1. Wiki tab (per project)
A new "Wiki" tab beside Overview / Features / Decisions.

- Left: page tree with nesting (a page can have sub-pages), drag-free ordering via a position value, search box filtering by title.
- Right: the selected page — title, rich body, last edited by / when.
- Editing: click "Edit" to switch the body into a markdown editor with live preview; Save writes a new version.
- Page templates on create: Blank, Meeting Notes, Process Doc, Architecture Note, Runbook. Templates just prefill the body with headings.
- Every page change is captured by the existing audit log, so the History tab shows wiki edits too and they can be reverted.

### 2. Quick Links panel (pinned)
A compact card at the top of the project (Overview tab) plus full management inside the Wiki tab.

- Each link: label, URL, category, optional note, owner.
- Categories: Code (Git repo, README), Work Tracking (Linear team/project), Docs, Design, Environments (staging/prod URLs), CI/CD, Dashboards, Other.
- Grouped by category with a small icon per category, opens in a new tab.
- Phase 1 is links only — no Git or Linear API sync. Live sync can come later without changing this structure.

### 3. Secrets Register (reference only)
A section in the Wiki tab. Records *where* a secret lives and who owns it. No secret values are ever stored or accepted.

- Fields: name (e.g. `STRIPE_SECRET_KEY`), where it lives (Doppler / AWS Secrets Manager / HashiCorp Vault / 1Password / Other), location path or project, environment (dev / staging / prod / all), owner, rotation notes, last rotated date.
- A clear inline warning that values must never be pasted here, and the form rejects anything that looks like a pasted credential.
- Admin and team members can edit; sales role has no visibility into project wiki/secrets.

### 4. Company Wiki (global)
A top-level "Wiki" entry in the sidebar for docs that aren't tied to one project — onboarding, engineering standards, how we run meetings, security policy.

- Same page tree, editor, and templates as the project wiki, just with no project attached.
- Project pages can link to company pages and vice versa.

### 5. Home-base wiring
- Project Overview gets the Quick Links card and a "Recently updated wiki pages" list.
- Global search on the Wiki page covers titles and body text across both company and project pages.
- The MCP agent gets read/write tools for wiki pages and quick links so it can draft meeting notes and keep docs current.

## Technical notes

New tables (all with GRANTs, RLS enabled, and audit triggers matching existing project tables):

- `wiki_pages` — `id`, `project_id` (nullable = company-wide), `parent_id`, `title`, `body`, `page_type`, `position`, `created_by`, `updated_by`, timestamps. Full-text index on title+body.
- `project_links` — `id`, `project_id`, `label`, `url`, `category`, `note`, `owner_id`, `position`, timestamps.
- `project_secret_refs` — `id`, `project_id`, `name`, `manager`, `location_path`, `environment`, `owner_id`, `rotation_notes`, `last_rotated_on`, timestamps. No value column by design.

RLS follows the existing project pattern: admins and team members read/write, sales role excluded, no anon access. Audit triggers registered on all three so the History tab and `revert_record` work as they already do elsewhere.

New frontend files: `src/components/projects/ProjectWikiTab.tsx`, `WikiPageTree.tsx`, `WikiPageEditor.tsx`, `ProjectLinksCard.tsx`, `SecretsRegister.tsx`, and `src/pages/Wiki.tsx` with a `/wiki` route. Markdown rendering reuses the existing message-content approach; no new heavy dependencies beyond a markdown renderer.

CI/CD status and live Git/Linear syncing are intentionally out of scope for this phase.
