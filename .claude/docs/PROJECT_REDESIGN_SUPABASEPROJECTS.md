<!-- Created: 2026-06-13 17:07:25 -->

# Project Redesign — Removing Project Data from Supabase

**Type:** Architecture Decision Record (ADR) · plan-and-review artifact
**Status:** `proposed` — awaiting user review. **No code or design docs have been edited.**
**Author of record:** Pair-programming session, on the Junior's direction
**Supersedes:** the recommended **Hybrid** content-storage approach in
`.claude/phases/phase_3/phase_overview.md` → "Blocking Decision" and the open decision in
`.claude/TASKS.md` → "OPEN DESIGN DECISIONS → Project content storage."

---

## ⚠️ Read Before Acting

This document is the **plan and review stage** for a single, deliberate design pivot:
**eliminate any and all _project data_ from Supabase and move it into the repository.** It exists
so the decision and its consequences can be read, edited, and signed off **before** any design
document (`CLAUDE.md`, the Phase 3 overview, `TASKS.md`) or any production code is changed.

Nothing downstream has been touched. The forthcoming edits enumerated in
[§8 Blast Radius](#8-blast-radius--forthcoming-edits-not-yet-made) are **proposals**, gated on
the user's approval of this document.

**Scope boundary — read this twice.** This is **not** "rip out Supabase." The backend stays.
The change is surgical: _project content_ leaves the database. Authentication, route protection,
and the Supabase platform itself remain, and are explicitly retained for planned future
user-account and per-user-data features. See [§5 Scope](#5-scope--what-changes-vs-what-stays).

---

## 1. Decision (one sentence)

Per-project data — metadata **and** body content (descriptions, tech stack, links, images,
galleries, long-form copy, and interactive demos such as the Super Mario Bros embed) — will live
**entirely in the repository** as a typed content layer, and the Supabase `projects` table (with
its RLS policies, Storage buckets, and the GraphQL/Apollo query path that served it) will be
**removed from the product's data flow**.

This resolves the hard gate recorded in `TASKS.md` ("⛔ BLOCKS PHASE 3") in favor of the
**"All in repo"** candidate, consciously accepting — and reframing — its noted cost of
"undercutting the GraphQL + RLS data-layer thesis."

---

## 2. Context — How We Got Here

The project's founding thesis (`CLAUDE.md`) is a portfolio that **demonstrates full-stack
capability**: Next.js + Apollo + `pg_graphql` + Supabase Postgres, with Row Level Security
enforcing Guest/Admin visibility at the database layer. Phase 0 stood up that entire stack;
Phases 1–2 built real authentication on Supabase and a fully navigable desktop shell whose
Projects and Resume windows currently render **stub content only** (`PLACEHOLDER_CARDS`, and a
literal "PDF viewer coming in Phase 3" placeholder).

Phase 3 is the phase that makes the shell real — and it opens **blocked** on one question that
was deliberately left open since Phase 2:

> `.claude/TASKS.md` → "Project content storage — ⛔ BLOCKS PHASE 3":
> _"Where does per-project content live — descriptions, images, demos, links, long-form copy?"_

That same TODO already contained the seed of this decision, in the user's own words:

> _"DOM-rendered content should probably exist in the project files, but then what's the point
> of having a projects table?"_ — `TASKS.md:73`

The Phase 3 roadmap recommended **Hybrid** (DB index + repo body) as the answer that best honored
the documented data-layer thesis. On review, the user challenged the premise: for this product's
data, a database is not the optimal tool, and choosing the minimal correct architecture — and
being able to defend _why_ — is a stronger engineering signal than demonstrating breadth for its
own sake. This document records the conclusion of that review.

---

## 3. The Previous Solution (DB-driven / Hybrid)

The pre-pivot plan: the `projects` table is the source of truth for the card grid and visibility;
under Hybrid, rich bodies render from repo-resident MDX/React keyed by a `slug` column. Either
way, **the database owns the project index, and RLS gates it.**

### 3.1 Why it was the correct working assumption until now

| Reason                                                   | Detail                                                                                                                                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| It honored the documented thesis                         | `CLAUDE.md` explicitly sets out to demonstrate Postgres + RLS + `pg_graphql` + Apollo. A DB-driven content model was the faithful continuation of the stated goal.                                                            |
| The stack already existed                                | Phase 0 built the table, RLS scaffold, GraphQL endpoint, and Apollo link chain; Phases 1–2 built auth on Supabase. DB-backed content was the path of architectural least resistance and maximum coherence with the docs.      |
| The hard question was deferred deliberately, not guessed | Content storage was logged as an **OPEN DESIGN DECISION** with an explicit blocking note, rather than being assumed. That is the process working as designed — the assumption held only until the decision was actually made. |
| Breadth was taken as the governing goal                  | Until this review, "demonstrate full-stack breadth" was treated as the priority. The tradeoff against "demonstrate judgment" had not yet been explicitly weighed.                                                             |

### 3.2 Honest pros and cons (in this project's context)

| Pros of the DB/Hybrid approach                                                          | Cons of the DB/Hybrid approach                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS is a **real** server-side visibility boundary for genuinely confidential content.   | The data is static, developer-authored, ~10 records, read-only, and rarely changing — **the profile of content that belongs in version control**, not a database.                                                                                                             |
| Demonstrates full-stack breadth (Postgres, RLS, `pg_graphql`, Apollo normalized cache). | Hybrid creates **two sources of truth** (DB index + repo body) that must be kept in sync; adding/removing a project means coordinated edits in two systems, and a contributor must know which system owns what. _(The user's original objection.)_                            |
| Pure-metadata edits possible without a redeploy.                                        | The privacy boundary is **architecturally leaky**: rich bodies (the Godot/Mario WASM embed, galleries) must live in the repo and ship in the bundle regardless — so RLS cannot actually hide an interesting project. The "secret" is only as secret as its thinnest metadata. |
| Centralized index for the card grid.                                                    | **There is no confidential admin content today** — so the RLS gate currently protects nothing real.                                                                                                                                                                           |
|                                                                                         | A uniform DB-driven window template **cannot host bespoke interactive bodies** (Godot/Mario). The moment it is special-cased, the DB row becomes a _pointer to repo code_ — i.e., the leaky Hybrid compromise. _(Identified by the user.)_                                    |
|                                                                                         | Network latency, infra surface, and cache complexity for content that could be statically compiled.                                                                                                                                                                           |
|                                                                                         | **"Why is this here?" anti-signal**: a DB + GraphQL + RLS stack serving ~10 static records reads as over-engineering to a discerning reviewer.                                                                                                                                |

---

## 4. The New Solution (project data in the repo)

Project data becomes a **typed, version-controlled content layer in the repo**: a typed registry
for the index (the data the card grid and routing need) plus per-project body content
(MDX/React components keyed by `slug`), including bespoke interactive bodies as ordinary
components/assets. The Projects grid, project detail subpages, and the Resume window read from
this layer instead of from GraphQL.

### 4.1 Pros and cons

| Pros of the all-in-repo approach                                                                                                                                                               | Cons / tradeoffs (stated honestly)                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single source of truth** for all project data — metadata _and_ body. Add/edit/remove a project in **one place**. _(Directly resolves the user's coordination objection.)_                    | Loses the live demonstration of `pg_graphql` + RLS + Apollo over real content (the original breadth goal). **Mitigated:** the backend remains for auth and is slated for future user-data features where it is genuinely load-bearing — see §5. |
| Content is **version-controlled**: diffable, reviewable in PRs, and deploys atomically with the code that renders it.                                                                          | Adding a project requires a **redeploy** (no runtime content editing). **Acceptable:** bodies always required a deploy anyway (they are code), and content changes are infrequent and developer-authored.                                       |
| **Type-safe end to end** (typed registry → components); no GraphQL codegen or query-shape drift to maintain.                                                                                   | The Guest/Admin split becomes a **UX/thematic gate** for project content rather than a hard data-secrecy boundary — admin project data ships in the bundle. **Acceptable now** because there is no confidential admin content; see §5.3.        |
| **Zero network latency** for content; statically rendered/compiled.                                                                                                                            | Apollo + GraphQL lose their only current consumer — a teardown-vs-dormant sub-decision is opened in §6.                                                                                                                                         |
| **Naturally hosts bespoke interactive bodies** (the Godot/Mario embed) — they are just components/assets in the repo, no special-casing of a schema.                                           |                                                                                                                                                                                                                                                 |
| **Removes infrastructure with no current consumer** → smaller surface, fewer moving parts, faster builds, less to test, less to break.                                                         |                                                                                                                                                                                                                                                 |
| **Stronger engineering signal**: matching the tool to the requirement and being able to articulate _why there is no database for static content_ demonstrates judgment over reflexive breadth. |                                                                                                                                                                                                                                                 |
| **Collapses Phase 3**: the schema-migration, Storage-bucket, project-RLS, and GraphQL-query-layer tasks largely disappear, shortening the path to a finished product.                          |                                                                                                                                                                                                                                                 |

### 4.2 Why it makes more sense for _this_ project

The deciding factor is not "databases are over-engineering" — it is the **profile of this
specific data**: developer-authored, ~10 records, read-only at runtime, rarely changing, with
bodies that are inherently code (the Godot/Mario embed). That is the textbook definition of
static content that belongs in version control. The all-in-repo model fits the data; the
DB-driven model fought it. The user's instinct — one source of truth, edit in one place, no need
to know which system owns what — is the correct conclusion for content of this shape.

---

## 5. Scope — What Changes vs. What Stays

This is the most important section, because the pivot is **narrow by design**.

### 5.1 What changes

- **Project data leaves Supabase entirely** — the `projects` table is no longer in the product's
  data flow; project metadata and bodies move to the repo content layer.
- The **project-data dependencies** built or planned around that table are removed or not built:
  the `projects` schema/migration work, production RLS policies _for projects_, the
  project-thumbnail Storage bucket, and the GraphQL query path that read projects.

### 5.2 What stays — and why

| Retained                                                                                  | Why it stays                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase Auth** (real, server-verified Guest/Admin) and `src/proxy.ts` route protection | The need for Guest and Admin accounts is **real** and unchanged. Authentication is genuinely load-bearing and must remain server-side; client-side auth would be security theater. This is unaffected by where project data lives. |
| **Supabase / backend platform**                                                           | The user is explicit: this does **not** remove the need for a database and backend. It is retained as the platform for planned features that genuinely need a server (see §5.4).                                                   |
| **Redux, window manager, IE shell, design tokens, session/role state**                    | None of these ever depended on where project data lived; they are untouched. The session `role` continues to drive the client-side Admin/Guest experience.                                                                         |

### 5.3 The Guest/Admin boundary, restated honestly

Today there is **no confidential admin content**. With project data in the repo, the Admin/Guest
split for _projects_ is a **UX/thematic gate** (part of the Windows 7 login fantasy) and a
**structural seam** — the place future per-user, server-delivered features will plug in — not a
cryptographic boundary. This is acceptable _now_ precisely because nothing behind it is sensitive.
When genuinely confidential or per-user content arrives, **that** content is delivered
server-side at that time; the architecture does not preclude it. The honest framing — "this gate
is experiential and structural today, and becomes a real boundary when there is something real to
protect" — is itself the defensible engineering position.

### 5.4 Future features the backend is retained for (not gating the current product)

These are real, planned, and explicitly **out of scope** for the current product — they do not
gate today's release, but they are why the backend is kept rather than removed:

- **Tailored applications for a small set of specific users**, surfaced via the Admin account.
- **A growing `users` table**, eventually allowing visitors to **create their own persisted
  accounts and data**.
- (Consistent with `CLAUDE.md`'s Long-Term Vision, e.g. real-time visitor presence.)

Each of these is genuinely server-shaped (real auth, per-user persistence, access control over
_dynamic, user-owned_ data) — the cases where a database earns its place. The redesign removes the
database only from the one place it did **not** earn its place: static project content.

---

## 6. Open Sub-Decision (needs the user's call)

Removing project data leaves **Apollo Client + `pg_graphql`** with **no current consumer** — auth
uses the Supabase JS SDK, not GraphQL, so once projects are gone, the GraphQL query layer reads
nothing today. Two defensible paths:

| Option                                            | Pros                                                                                                  | Cons                                                                                                                              | Recommendation                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **A. Remove Apollo/GraphQL now (YAGNI)**          | Smallest surface; no vestigial dependency; cleanest "the architecture matches the requirement" story. | Must be reintroduced when the first user-data feature lands.                                                                      | **Recommended** — it is the consistent conclusion of this whole review: do not carry infrastructure with nothing to do. |
| **B. Keep Apollo/GraphQL dormant as scaffolding** | Ready for future user-data features; less rework later.                                               | Carries an unused dependency and a "why is this here?" anti-signal in the interim — the exact thing this pivot removes elsewhere. | Only if a user-data feature is genuinely imminent.                                                                      |

> The user scoped this pivot to _project data_; the Apollo/GraphQL fate is an immediate
> consequence but slightly beyond that literal scope, so it is surfaced here for an explicit
> decision rather than assumed. **Recommended: Option A**, reintroducing a query layer (Apollo or
> otherwise) when the first user-data feature provides a real consumer.

A parallel minor question: the **Resume** currently planned to live in a `resume` Storage bucket
can become a static asset served from the repo (`public/`), removing the last project-adjacent
Storage dependency. **Recommended: yes**, for consistency — confirm in review.

---

## 7. Why This Decision Is Being Made Now

| Reason                                            | Detail                                                                                                                                                                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 3 is blocked on exactly this**            | The content-storage decision is a hard gate (`TASKS.md`, phase overview). Band 3 cannot start until it is recorded. The decision must be made now to proceed at all.                                                                         |
| **It is the cheapest possible moment**            | The Projects/Resume windows render **stub content only**; **no real project data exists in the DB yet**. There is nothing to migrate — removing the table costs zero data migration. The cost only grows as real data and queries are added. |
| **Deferring would mean building, then deleting**  | Proceeding with the DB plan means building the full data layer (schema migration, Storage, RLS, GraphQL queries — ~10 tasks across Bands 3–4) and then tearing it out later. Pure waste, avoided by deciding now.                            |
| **Phase 4 is launch-only**                        | Phase 4 does no feature work. Making this change in Phase 3 means the production build reflects the **final** architecture, with no post-launch re-architecture.                                                                             |
| **The decision was always reserved for the user** | `TASKS.md` and the phase overview both mark this user-owned and unresolved. The user has now made the call; recording it now is the process completing as designed.                                                                          |

---

## 8. Blast Radius — Forthcoming Edits (NOT yet made)

These are the design-doc and code changes this decision **implies**. They are listed for review;
**none have been performed.** Design-doc edits (`CLAUDE.md`, the Phase 3 overview, `TASKS.md`)
follow approval of this document; code follows under the normal `AGENTS.md` pair-programming
protocol.

### 8.1 Design documents

- **`CLAUDE.md`** — substantial revision: the architecture diagram and the GraphQL / Apollo /
  `pg_graphql` / Postman sections; the "data-layer thesis"; the two-layer (RLS + GraphQL filter)
  visibility model and content-visibility rules; and the anti-patterns that reference Apollo and
  project data. The **auth** and **Supabase-for-auth** sections, design-token rules, window
  manager rules, and quality gates **stay**. Add a content-layer section describing the typed
  repo registry + MDX/React bodies. _(Editing `CLAUDE.md`, a root file, is outside the standing
  `AGENTS.md` write boundary; it proceeds here on the user's explicit instruction.)_
- **`.claude/phases/phase_3/phase_overview.md`** — resolve the "Blocking Decision"; restructure
  the bands: remove/replace the schema-migration, Storage-bucket, project-RLS, and
  GraphQL-query-layer tasks (Bands 3–4) with repo-content-layer tasks; keep the Band 1 user
  verification work and the Resume/Projects/Detail/Demo integration tasks, re-pointed at the repo
  content layer; update the Definition of Done and the blocking flags.
- **`.claude/TASKS.md`** — record the resolved decision in "OPEN DESIGN DECISIONS → Project
  content storage" (chosen approach + rationale), unblocking the phase.

### 8.2 Code surfaces (implemented later, by the Junior)

| Surface                                                  | Change                                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New `src/content/` (or similar)                          | Typed project registry (index) + per-project MDX/React bodies keyed by `slug`; the Godot/Mario embed lives here as a component/asset. _Final shape decided at implementation._ |
| `InternetExplorer/pages/ProjectsPage`                    | Replace `PLACEHOLDER_CARDS` with the repo-registry-driven grid.                                                                                                                |
| `InternetExplorer/pages/ResumePage`                      | Replace the placeholder with the real resume from a repo/`public/` asset.                                                                                                      |
| `ProjectDetailPage` (new) + `ieRoutes.ts`                | `portfolio://projects/:slug` reading from the registry.                                                                                                                        |
| `src/lib/apollo-client.ts` + Apollo providers            | Per §6 — removed (Option A) or shelved (Option B).                                                                                                                             |
| Supabase: `projects` table, project RLS, Storage buckets | Removed from the product's data flow. **Supabase Auth retained.**                                                                                                              |

---

## 9. Reversibility

This pivot **burns no bridges.** The backend, real auth, the session/role seam, and an
RLS-capable Supabase project all remain. When a future user-data feature provides a genuine
consumer, a query layer (Apollo + `pg_graphql`, or whatever is best at that time) returns _with a
real justification_. The decision is a deliberate de-scoping of the database to the work it
actually earns — not a one-way door.

---

## 10. Summary

- **Decision:** all project data (metadata + body) moves to the repo; the `projects` table, its
  RLS, its Storage, and its GraphQL/Apollo path leave the product's data flow.
- **Why:** the data is static, developer-authored, small, read-only, and includes code-shaped
  interactive bodies — the profile of version-controlled content, not database rows. One source
  of truth; matched tool to requirement.
- **Scope:** narrow. **Auth and the backend stay** for current login and planned future
  user-account/data features. Only static project content leaves the DB.
- **Now:** Phase 3 is blocked on this; the DB is still empty of real content, so it is the
  cheapest moment; deferring means build-then-delete.
- **Open for the user:** (a) remove vs. shelve Apollo/GraphQL (recommend remove); (b) serve the
  resume as a repo/`public/` asset (recommend yes).
- **Status:** proposed. **No design docs or code have been changed.** Approval of this document
  unblocks the design-doc edits in §8, then implementation under `AGENTS.md`.
