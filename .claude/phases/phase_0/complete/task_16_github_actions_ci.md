<!-- task 16 - GitHub Actions CI Pipeline began: 2026-04-14 -->

# 🎯 Task 16: GitHub Actions CI Pipeline

---

## 🧠 Engineering Context & Rationale

### Why CI Exists — And What It Is Not

Continuous Integration is frequently misunderstood as "a place where tests run." That framing
undersells its purpose. CI is a **trust boundary**: the contract between a developer's local
machine (which you cannot verify) and the `main` branch (which you can). Your local environment —
your Node version, your IDE extensions, your forgotten uncommitted files, your stale
`node_modules`, your personal shell aliases — are all variables. CI eliminates those variables by
running your build in a **clean, deterministic, third-party environment** every time.

If CI passes, you have a verifiable claim: "this code, as committed, builds and lints cleanly in
an environment nobody has tampered with." Without CI, every merge to `main` is an act of faith
in the contributor's local setup. At scale, faith does not scale.

### The Shift-Left Principle

"Shift-left" means catching errors as **early** in the development lifecycle as possible. Errors
caught in your editor (TypeScript, ESLint) cost seconds. Errors caught in a pre-commit hook cost
minutes. Errors caught in CI cost tens of minutes (build time + review cycle). Errors caught in
production cost hours, customer trust, and occasionally your weekend.

This project already has two shift-left gates: Cursor's on-save ESLint/Prettier and Husky's
pre-commit hook. CI is the **third gate** — and it is the only one a contributor cannot bypass.
A developer can disable their pre-commit hook with `git commit --no-verify`. They cannot disable
the CI check on a protected branch. That is CI's true job: it is the gate of last resort.

### GitHub Actions Architecture

```
Workflow    → a YAML file under .github/workflows/ (defines when and what runs)
   ↓
Job         → a named unit of work that runs on a fresh runner (a VM)
   ↓
Step        → a single command or reusable action within a job
   ↓
Runner      → the ephemeral Linux/macOS/Windows VM the job executes on
```

Each job starts from a **clean runner** — a freshly provisioned virtual machine with nothing but
the operating system and a standard toolchain. There is no state preserved between runs. Every
run installs dependencies from scratch (unless you explicitly opt into caching). This
determinism is the feature, not a bug — it means "works in CI" is a stronger claim than "works
on my machine."

### Workflow Triggers — Why `pull_request` Is Not `push`

`on: pull_request` triggers the workflow when a PR is opened, reopened, or updated against the
target branch. Critically, it checks out the **merge commit** — a temporary commit representing
what the codebase would look like if the PR were merged right now. This tests the integrated
result, not the branch in isolation.

`on: push` triggers on every commit to specified branches and is useful for verifying the state
of `main` after merge. Most projects use both: `pull_request` for pre-merge validation,
`push: main` for post-merge confirmation.

There is a separate trigger called `pull_request_target` that runs workflows with access to
repository secrets even for PRs from forks. This is a well-documented security footgun — you
will research its implications in this task's TODO section.

### Secrets — Why Environment Variables Are Not Committed

`.env.local` is gitignored for one reason: credentials exposed in a public Git history cannot
be revoked by deletion. Git history is immutable and widely replicated. A commit containing a
Supabase anon key exists forever on every fork, clone, and CI cache until every key is rotated.

GitHub Secrets solve this: repository-scoped encrypted values injected into workflow runs as
environment variables at runtime. They never appear in logs (GitHub automatically masks them),
never touch the filesystem, and are scoped per-environment. The secrets you configure today for
`main` branch CI are the same credentials Vercel will use in production (Task 17) — stored
separately in each system, with each system's native encryption.

### Why `next build` Needs Secrets in CI

Next.js has a specific behavior that catches many engineers off guard: `NEXT_PUBLIC_`-prefixed
environment variables are **inlined into the client JavaScript bundle at build time**, not at
runtime. This is a security-by-design decision — it means the client bundle is a static artifact
with known contents, not a dynamic program that reads secrets at runtime.

The consequence: `next build` must have access to every `NEXT_PUBLIC_` variable your code
references, or those references become `undefined` in the built bundle. Your CI job must inject
the same variables at build time that production has, or CI's claim of "builds cleanly" is a
lie — CI would be building a different artifact than production.

### Caching — What `actions/setup-node` Caches, and Why It Is Not Docker's Cache

`actions/setup-node@v4` with `cache: 'npm'` caches the **npm download cache** — specifically the
tarballs npm downloads to `~/.npm` before extracting them into `node_modules`. It keys the cache
on the hash of `package-lock.json`. When the lockfile is unchanged, subsequent CI runs skip the
network download of every dependency and extract from the local cache instead.

This is a different mechanism from Docker layer caching (Task 15). Docker caches a layer of the
filesystem (`node_modules` after extraction). GitHub Actions caches the artifacts before
extraction. Both optimize for the same outcome (fewer network round-trips on unchanged
dependencies) via different mechanisms, and they do not interact.

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Create the Workflow Directory

GitHub Actions discovers workflows by convention. Every workflow file must live under
`.github/workflows/` relative to the repository root. The `.github` directory also houses issue
templates, PR templates, and `CODEOWNERS` — anything related to GitHub's platform behavior.

```bash
mkdir -p .github/workflows
```

Use `-p` so the command succeeds whether or not `.github` already exists.

### Step 2 — Create the `ci.yml` File

The workflow file must be `.yml` or `.yaml`. GitHub parses every file under `workflows/`
independently, so a single repository can have multiple workflows (CI, deploy, nightly, etc.).
In this project, `ci.yml` handles pre-merge validation; `deploy.yml` will handle production
deployment verification in Task 17.

```bash
touch .github/workflows/ci.yml
```

### Step 3 — Configure Repository Secrets in GitHub

Before your workflow can reference secrets, they must exist in the repository's Secrets
configuration. Navigate to:

```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
```

Create three secrets — the names must match exactly (case-sensitive):

| Name                            | Value (copy from `.env.local`) |
| ------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key         |
| `NEXT_PUBLIC_GRAPHQL_URL`       | Your Supabase GraphQL endpoint |

Once saved, GitHub encrypts these values. Even you cannot view them again through the UI — only
update or delete. This is intentional: it prevents a stolen GitHub session from exfiltrating
secrets through the web interface.

### Step 4 — Populate `ci.yml` With the Configuration Below

Copy the configuration from the next section into `.github/workflows/ci.yml`. Complete the
embedded TODOs before proceeding.

### Step 5 — Open a Test Pull Request

The workflow cannot be validated until it actually runs. You must trigger it with a real PR:

```bash
git checkout -b chore/setup-ci
git add .github/workflows/ci.yml
git commit -m "ci: add lint, format, and build pipeline"
git push -u origin chore/setup-ci
```

Then open a PR on GitHub from `chore/setup-ci` → `main`. Within ~10 seconds, the Actions tab
should show the workflow executing. Watch it live from the PR's "Checks" tab.

### Step 6 — Verify the Failure Path

A CI pipeline that cannot fail is a pipeline that cannot protect. Prove it catches real
problems before you trust it:

1. In a throwaway commit on the same branch, introduce a deliberate ESLint violation —
   something like `const unused = 'trigger'` in `src/app/page.tsx`.
2. Push the commit.
3. Confirm the CI run turns red and the PR merge button is blocked.
4. Revert the commit and confirm CI turns green again.

If CI does not catch the violation, the pipeline is misconfigured — `--max-warnings=0` is the
difference between "warnings are informational" and "warnings block merges."

### Step 7 — Enable Required Status Checks (Branch Protection)

Passing CI is pointless if PRs can be merged while CI is red. Navigate to:

```
GitHub Repo → Settings → Branches → Branch protection rules → Edit rule for `main`
```

Enable:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Add the CI job name (`Lint · Format · Build`) to the required checks list

Without this step, CI is advisory. With it, CI is enforceable.

### Step 8 — Merge the PR

Once CI is green and required status checks are configured, merge the PR into `main`. The
workflow will re-run on `main` itself via the `push` trigger — verifying the post-merge state
matches expectations.

---

## 📝 Code & Configuration

### `.github/workflows/ci.yml`

```yaml
# Human-readable workflow name shown in the Actions tab.
# This is not an identifier — the filename determines uniqueness.
name: CI

# Triggers: when GitHub should execute this workflow.
# pull_request → runs on the PR's merge commit (the integrated result).
# push to main → runs after merge, verifying the post-merge state.
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

# TODO: [DOCS INVESTIGATION] Research the difference between `pull_request`
# and `pull_request_target` triggers. Explain in a comment below WHY using
# `pull_request_target` for the above trigger would be a critical security
# mistake for a workflow that has access to secrets. Hint: what does each
# trigger check out, and which one executes arbitrary code from a forked PR?

# [Answer]: "instead of running against the workflow and code from the merge commit, the event runs against the workflow and code from the base of the pull request.". Using `pull_request_trigger` provides access to the GitHub repo secrets so that it can authenticate with GitHub's API. This is useful in such a scenario that you would want to leave a comment on a PR. In my case I am the solo developer on this project so I have less reason to need the full repo's sensitive data or access. Using `pull_request` keeps my data safe against other users viewing my repository, since it is public. It uses GitHub's security model, which in this case hides sensitive data such as `repo secrets`. The critical security flaw is that a user could run unidentified, malicious code via their forked PR using the repo secrets. Code that could output the secrets values directly to them, allowing direct access using highly confidential keys and private gateway URLs.

# Concurrency control: if a new commit is pushed to the same PR branch
# while a previous run is still executing, cancel the older run.
# Without this, CI queues build up on rapid pushes and waste runner minutes.
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    # Job name shown in the Checks UI. This is the string you reference
    # when configuring Required Status Checks in branch protection.
    name: Lint · Format · Build

    # Runner image. ubuntu-latest is the default and matches our production
    # container base (Alpine Linux is technically different but is Linux
    # userspace compatible for Node.js purposes). Pinning to ubuntu-24.04
    # would be more reproducible but requires maintenance when GitHub
    # deprecates images.
    runs-on: ubuntu-latest

    steps:
      # Step 1 — Check out the repository at the PR's merge commit.
      # actions/checkout@v4 is a first-party action that shallow-clones
      # the repo into the runner's working directory. Shallow clones
      # (depth=1) are faster; full history is rarely needed for CI.
      - name: Checkout repository
        uses: actions/checkout@v4

      # Step 2 — Install Node.js and enable npm caching.
      # node-version '20' matches the Dockerfile base image (node:20-alpine).
      # Keeping CI and container on the same major version prevents
      # "works in Docker, fails in CI" divergence.
      #
      # TODO: [RESEARCH REQUIRED] The `cache: 'npm'` option below enables
      # a specific caching behavior. In a comment, explain exactly WHAT
      # gets cached (not just "node_modules") and on WHAT key the cache
      # is invalidated. Then explain why this cache mechanism is distinct
      # from — and does not overlap with — Docker's layer cache from Task 15.

      # [Answer]: for caching npm, it uses the keys from package-lock.json. Docker on a cache hit immediatly extracts the dependecies via `node_modules` wheras GitHub on a cache hit resolves the os-level tarballs and creates the `node_modules` directory via npm ci. Essentially, Docker is able to skip ever running npm ci on a cache hit, and GitHub still runs npm ci, which runs the extract step.

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # Step 3 — Install dependencies deterministically.
      # npm ci (not npm install) is mandatory in CI:
      # - Installs exact versions from package-lock.json
      # - Fails if package.json and package-lock.json are out of sync
      # - Never modifies the lockfile
      # These three properties are what make CI's claim of reproducibility
      # meaningful.
      - name: Install dependencies
        run: npm ci

      # Step 4 — Run ESLint with zero tolerance for warnings.
      # --max-warnings=0 converts any warning into a failure exit code.
      # Without this flag, warnings are informational and CI would pass
      # despite latent issues. This mirrors the strictness of the
      # pre-commit hook configured in Task 8.
      - name: Run ESLint
        run: npx eslint --max-warnings=0

      # Step 5 — Verify Prettier formatting (check, do not fix).
      # --check returns non-zero if any file differs from Prettier's
      # canonical formatting. This is the read-only equivalent of
      # --write; CI must never modify source files.
      - name: Check Prettier formatting
        run: npx prettier --check .

      # Step 6 — Build the Next.js production bundle.
      # This is the functional integration test: if the app cannot build,
      # nothing downstream matters. `next build` runs type-checking,
      # route analysis, and bundle generation — a comprehensive check.
      #
      # TODO: Pass the three NEXT_PUBLIC_ secrets below via the `env:`
      # block. Reference secrets using the ${{ secrets.SECRET_NAME }}
      # syntax. Required: NEXT_PUBLIC_SUPABASE_URL,
      # NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_GRAPHQL_URL.
      # Do NOT hardcode values. Do NOT reference environment files.
      - name: Build Next.js
        run: npm run build
        env:
          # [TODO]:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_GRAPHQL_URL: ${{ secrets.NEXT_PUBLIC_GRAPHQL_URL }}
```

---

## 🛡️ Challenge & Review

Complete all three TODOs in the workflow file above before answering the questions below. Your
answers must demonstrate comprehension — not quotation from the tutorial.

**1.** The `Install dependencies` step uses `npm ci`, not `npm install`. The `Dockerfile` in
Task 15 also used `npm ci`. Without referencing the tutorial, explain the **three specific
behavioral differences** between `npm ci` and `npm install` that make `npm ci` the correct
choice in any automated, non-interactive environment — and describe a concrete scenario where
using `npm install` in CI would produce a build that differs from every developer's local
build.

```
[Answer]: 1. `npm ci` installs the exact versions stored in package-lock.json. 2. if package.json and package-lock.json are out of sync, the install fails. 3. the lockfile is never modified. Using npm install could allow for out of sync dependency versions, which each developer could have differing on their local machines.
```

**2.** The `Build Next.js` step requires the three `NEXT_PUBLIC_` secrets even though those
variables are prefixed `NEXT_PUBLIC_` and will end up publicly visible in the client bundle
anyway. Without referencing the tutorial, explain why these values must still be injected into
the CI build at build time — and describe exactly what would be present in the client bundle
at `/_next/static/chunks/*.js` if the secrets were omitted from the `env:` block. Your answer
must address Next.js's build-time substitution behavior, not just "the build would fail."

```
[Answer]: The values are `undefined` at build time, so the build would fail since the environment variables would be passed in as 'undefined' to `/_next/static/chunks/*.js`. The client, making use of these variables, would fail their API calls for URLS, or crash during runtime due to missing keys.
```

**3.** A teammate argues that since Husky's pre-commit hook (Task 8) already runs ESLint and
Prettier locally, duplicating those checks in CI is redundant and wastes runner minutes. They
propose removing the `Run ESLint` and `Check Prettier formatting` steps from `ci.yml` and
relying solely on the pre-commit hook. Write a precise technical argument for why this is
incorrect — addressing both the trust boundary between local and CI environments and at least
one specific mechanism by which a malformed commit could reach `main` if CI did not
independently re-run these checks.

```
[Answer]: One scenario that could occur is if a developer uses the `--no-verify` flag on a git commit, which would bypass husky's verification step and allow unlinted code to reach a PR or merge. Using the CI step allows GitHub to double-check the verification step and fail a PR automatically if the rules described in the lint and formatting process. Additionally, if code changes are made directly in a PR, then GitHub can cover and replicate the dev environment, running the verification step against direct modifications.
```
