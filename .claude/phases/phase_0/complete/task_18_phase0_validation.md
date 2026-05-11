<!-- task 18 - Phase 0 Validation began: 2026-04-15 -->

# 🎯 Task 18: Phase 0 Validation

---

## 🧠 Engineering Context & Rationale

### Why a Dedicated Validation Task Exists

Tasks 1–17 each established one piece of the infrastructure. No single task verified that
all pieces work **together**. A Redux store that mounts correctly in isolation may fail when
wrapped in an Apollo provider that expects a different React version. A CI pipeline that passes
on a branch may fail on `main` if branch protection rules conflict with the workflow trigger.
A Vercel deployment that builds successfully may serve `undefined` values because the env vars
were configured after the first deploy and no redeploy was triggered.

This task is not about building anything new. It is a **full-stack integration sweep** — a
systematic, ordered verification of every Phase 0 deliverable against the Definition of Done
checklist from the phase overview. It is the same activity a QA engineer performs before
signing off on a release: walk every path, verify every contract, document every result.

### The Validation Order Matters

The checklist below is ordered by dependency depth. You verify the foundation first (local
environment, dependencies), then the application layer (dev server, store, data fetching),
then the quality gates (hooks, lint, format), then the deployment pipeline (Docker, CI,
Vercel). If Step 1 fails, every subsequent step is suspect. Fix failures in order — do not
skip ahead.

### What "Passing" Means

Each check has an **exact observable outcome** — not "it should work" but "this specific
string appears in this specific output." Ambiguous checks are worthless checks. Every item
below specifies what you must see, where you must see it, and what a failure looks like.

---

## 🛠️ Step-by-Step Implementation

### Validation 1 — Fresh Clone & Install

Simulate the experience of a new developer cloning the repo. This verifies that `package.json`,
`package-lock.json`, and all configuration files are committed and correct.

```bash
# In a TEMPORARY directory outside your project:
cd /tmp
git clone <your-repo-url> validation-test
cd validation-test
npm ci
```

**Pass criteria:**

- `npm ci` completes with zero errors
- `node_modules/` is populated
- No `peer dependency` warnings that reference missing packages

**Failure indicates:** Missing dependency in `package.json`, stale `package-lock.json`, or
uncommitted configuration files.

After validation, delete the `/tmp/validation-test` directory. Return to your primary
project directory for all remaining checks.

### Validation 2 — Development Server Boots

```bash
npm run dev
```

**Pass criteria:**

- Terminal outputs `▲ Next.js <version>` with no error stack traces
- `http://localhost:3000` renders in the browser
- No `Module not found` or `Cannot resolve` errors in the terminal

**Failure indicates:** Broken imports, missing environment variables in `.env.local`, or
TypeScript compilation errors.

### Validation 3 — Redux Store Mounts Cleanly

With the dev server running, open `http://localhost:3000` in Chrome and open DevTools →
Console.

**Pass criteria:**

- Zero `console.error` output related to Redux, React-Redux, or Provider
- If Redux DevTools extension is installed: the store is visible with three slices
  (`window`, `session`, `desktop`)
- No "could not find react-redux context value" errors

**Failure indicates:** Provider wrapping order is wrong in `layout.tsx`, or store
configuration has a type mismatch.

### Validation 4 — Apollo Client Connects to Supabase GraphQL

With the dev server running, open DevTools → Network tab. Filter by `graphql`. Trigger a
GraphQL query (if no component currently fires one, temporarily add a test query to
`page.tsx`):

```tsx
// Temporary validation query — remove after confirming
import { useQuery, gql } from '@apollo/client'

const TEST_QUERY = gql`
  query ValidateConnection {
    projectsCollection(first: 1) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`
```

**Pass criteria:**

- Network tab shows a POST request to your `NEXT_PUBLIC_GRAPHQL_URL`
- Response status is `200`
- Response body contains `"data": { "projectsCollection": { "edges": [...] } }`
- The seeded project row from Task 12 appears in the response

**Failure indicates:** Apollo Client misconfiguration, incorrect `NEXT_PUBLIC_GRAPHQL_URL`,
missing `apikey` header in the auth link, or Supabase RLS blocking the request.

**Remove the temporary test query after confirming.**

### Validation 5 — GraphQL Endpoint Validated via Postman

Open the Postman collection saved in Task 13. Re-run the saved `projectsCollection` query.

**Pass criteria:**

- Response status `200`
- Response body matches the Relay Connection Specification shape:
  `{ "data": { "projectsCollection": { "edges": [{ "node": { ... } }] } } }`
- The seeded row is present

**Failure indicates:** Supabase endpoint has changed, or headers in the saved request are
stale.

### Validation 6 — Pre-Commit Hook Rejects Lint Violations

Create a deliberate ESLint violation and attempt to commit it:

```bash
# Add an unused variable to any .ts file
echo "const unused = 'lint-test'" >> src/app/page.tsx
git add src/app/page.tsx
git commit -m "test: lint violation check"
```

**Pass criteria:**

- The commit is **rejected** by Husky's pre-commit hook
- Terminal output shows the ESLint error (`@typescript-eslint/no-unused-vars` or similar)
- The commit does not appear in `git log`

**Failure indicates:** Husky is not installed (`npx husky` not run), `.husky/pre-commit` is
missing or not executable, or `lint-staged` configuration is wrong.

**Clean up:** `git checkout -- src/app/page.tsx` to discard the change.

### Validation 7 — Commit-Lint Rejects Malformed Messages

Attempt a commit with a message that violates Conventional Commits:

```bash
# Make a trivial whitespace change
echo " " >> src/app/page.tsx
git add src/app/page.tsx
git commit -m "bad message no type prefix"
```

**Pass criteria:**

- The commit is **rejected** by the `commit-msg` hook
- Terminal output shows a commitlint error referencing `type-enum` or `subject-empty`

**Failure indicates:** `.husky/commit-msg` is missing, commitlint is not installed, or
`commitlint.config.js` is absent.

**Clean up:** `git checkout -- src/app/page.tsx`

### Validation 8 — Docker Boots the App

```bash
docker compose --env-file .env.local up --build
```

**Pass criteria:**

- Build completes with no errors
- Terminal shows `▲ Next.js <version>` from inside the container
- `http://localhost:3000` renders the app from the container
- No environment variable warnings in the Docker output

**Failure indicates:** Dockerfile errors, `docker-compose.yml` misconfiguration, missing
`.env.local` values, or port conflicts (stop the host dev server first).

**Stop the container:** `docker compose down`

### Validation 9 — GitHub Actions CI Pipeline Passes

Navigate to the GitHub repository → Actions tab. Find the most recent CI workflow run on
`main` (or on the latest merged PR).

**Pass criteria:**

- The `Lint · Format · Build` job shows a green checkmark
- All three steps (ESLint, Prettier, Build) completed successfully
- Build logs show `next build` completing with `✓ Compiled successfully`

**Failure indicates:** Secrets not configured in GitHub (Task 16 Step 3), ESLint or Prettier
violations committed to `main`, or a build error in the codebase.

### Validation 10 — Vercel Production URL Resolves

Open your Vercel production URL in a browser.

**Pass criteria:**

- The page loads with HTTP 200 (check DevTools → Network)
- The page content matches what `http://localhost:3000` shows
- View source shows your Supabase URL as a literal string (not `undefined`)
- No console errors related to missing environment variables

**Failure indicates:** Vercel env vars not configured (Task 17 Step 3), or the most recent
deploy occurred before env vars were set (requires manual redeploy from dashboard).

### Validation 11 — Environment Variable Parity

Verify all three systems have identical values for every `NEXT_PUBLIC_` variable:

| Variable                        | `.env.local` | GitHub Secrets | Vercel Dashboard |
| ------------------------------- | ------------ | -------------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅ / ❌      | ✅ / ❌        | ✅ / ❌          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ / ❌      | ✅ / ❌        | ✅ / ❌          |
| `NEXT_PUBLIC_GRAPHQL_URL`       | ✅ / ❌      | ✅ / ❌        | ✅ / ❌          |

**Pass criteria:**

- All 9 cells are ✅
- GitHub Secrets: Settings → Secrets → each secret exists (values are hidden but presence
  is verifiable)
- Vercel: Settings → Environment Variables → each variable exists with correct value

**Failure indicates:** A variable was missed during configuration in one of the three
systems.

---

## 📝 Validation Report

Copy the checklist below into your completed file and mark each item. Every ✅ must have
been personally verified by running the check above — not assumed from a previous task.

```
## Phase 0 — Validation Checklist

| #  | Check                                               | Status |
| -- | --------------------------------------------------- | ------ |
| 1  | Fresh clone + `npm ci` succeeds                     |   ✅  |
| 2  | `npm run dev` boots with zero errors                |   ✅  |
| 3  | Redux store mounts (3 slices, no console errors)    |   ✅  |
| 4  | Apollo Client queries Supabase GraphQL successfully |   ✅  |
| 5  | Postman validates GraphQL endpoint                  |   ✅  |
| 6  | Pre-commit hook rejects lint violations             |   ✅  |
| 7  | Commit-lint rejects malformed messages              |   ✅  |
| 8  | Docker boots app on localhost:3000                  |   ✅  |
| 9  | GitHub Actions CI pipeline green on main            |   ✅  |
| 10 | Vercel production URL resolves with HTTP 200        |   ✅  |
| 11 | Env var parity across all three systems             |   ✅  |

Validated by: Cade
Validated on: 04-16-2026
```

---

## 🛡️ Challenge & Review

This is the final task of Phase 0. The questions below test your understanding of
the infrastructure you have built across all 18 tasks — not just this task.

**1.** Trace the full lifecycle of a single code change from your editor to
production. Starting from saving a file in Cursor, name every automated system
that touches the code before it is live on the Vercel production URL — in
chronological order. For each system, state what it checks and what happens if
it fails. Your answer should include at least five distinct systems.

```
[Answer]: 1. editor on save auto formats using ESLint and prettier rules set up via .prettierrc & eslint.config.mjs 2. Docker composing to ensure code can build and execute on any machine to protect against "but it works on my local" scenarios 3. git commits enact huskys event handlers, in our case commit-msg which runs immediatly to check the message committed with to ensure proper formatting (labels such as fix, chore, feat, ...). pre-commit which runs lint & formatting checks before files to be fully committed and ready for a PR. 4. GitHub Actions CI which does further formatting & lint checks as well as builds the project to check for package errors and error responses. 5. Vercel CD which also builds the project to validate the build process and resultant product before deploying it with errors.
```

**2.** A new developer joins the project tomorrow. They clone the repo on a
fresh macOS machine. List every step — in order — they must complete before
they can run `npm run dev` successfully. Do not include any step that is
handled automatically by `npm ci`. Your answer must account for the `.env.local`
file that does not exist in the repository.

```
[Answer]: The developer MUST setup their own `.env.local` file with the SUPABASE values, and GRAPHQL URL. Currently, they could run it without setting these up (proven in checks 1 & 2), since the keys and tokens are NOT being used in any built environment processes. However, a warning is currently being thrown in `page.tsx` with an environment variable which shows `undefined`. Later in this projects lifetime, these variables will be required to proceed with `npm run dev`. If they creating a fork and not contributing to the source code, then they must also add the Secrets and Variables in the settings of the repo, set up a Supabase and Vercel project using their cloned repo. They will then use their own `.env.local` values
```

**3.** You discover that your Supabase anon key has been accidentally exposed
in a public Slack channel. Describe every action you must take to fully rotate
this credential — listing every system where the old key exists and must be
replaced. Explain why simply changing it in one place is insufficient, and what
breaks in each system if that system is not updated.

```
[Answer]: 3 systems can break if not properly updated: 1. local dev environment 2. GitHub PR builds 3. Vercel Deployment builds. Upon changing the credential `.env.local` must be properly updated, the Secret in the repo fully replaced with the new value, and in Vercel the environment variables updated. Only changing it in one place (e.g. .env.local) doesn't account for each of these systems, and so any one of them could fail if not properly updated.
```
