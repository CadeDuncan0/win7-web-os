<!-- task 17 - Vercel Production Deployment began: 2026-04-15 -->

# 🎯 Task 17: Vercel Production Deployment

---

## 🧠 Engineering Context & Rationale

### Why Vercel — And Why Not "Deploy It Yourself"

Vercel is the company that authors Next.js. Every optimization in Next.js — the App Router's
server component streaming, the built-in image optimizer, the middleware runtime, the edge
function boundary — was designed with Vercel's infrastructure as the reference deployment
target. Running Next.js on Vercel is not a convenience; it is the **canonical deployment path**.
Running Next.js on AWS, Cloudflare, or a Docker container behind nginx is possible, but it
requires you to reimplement (imperfectly) what Vercel provides natively.

For a zero-cost portfolio, this trade-off is decisive. A self-hosted deployment means
provisioning a VPS, configuring nginx as a reverse proxy, setting up SSL via Let's Encrypt,
managing OS updates, handling DDoS mitigation, configuring log aggregation, and monitoring
uptime. None of those tasks teach you anything about frontend engineering. Vercel handles all
of them for free on the Hobby tier.

### The Hobby Tier Constraints

Vercel's Hobby tier is explicitly restricted to non-commercial use. For a personal portfolio,
this is the correct tier. The hard limits that matter for this project:

- **Bandwidth:** 100 GB / month (a portfolio will never approach this)
- **Build Execution:** 6,000 build minutes / month (one deploy takes ~90 seconds)
- **Serverless Function Execution:** 100 GB-hours / month
- **Team Members:** 1 (you)
- **Commercial use:** prohibited — no ads, no paid services, no client work

Exceeding Hobby limits does not result in a bill; Vercel throttles or pauses the project. This
is the correct failure mode for a portfolio: if you go viral, the site gets rate-limited rather
than you receiving a surprise invoice.

### The Git-Based Deployment Model

Traditional deployment pipelines involve a separate deploy step: build artifact → upload →
swap. Vercel collapses this into a single observation: **the canonical state of the codebase
lives in Git, so Git events are the deployment trigger**. When you connect a repository to
Vercel:

- **Every push to `main`** → triggers a Production deployment (replaces the live URL)
- **Every push to a feature branch with an open PR** → triggers a Preview deployment (unique
  URL per PR)
- **Every commit to any PR** → triggers a new Preview deployment (unique URL per commit)

There is no `docker build` you run locally and push to a registry. There is no SSH key you
manage. There is no deployment script. Git push is deployment. This is the same model GitLab
Pages, Netlify, and Cloudflare Pages use — the convergence is not coincidence.

### Production vs Preview — The Environment Split

Vercel maintains two first-class deployment environments, and understanding the difference is
essential to operating this correctly:

```
Production    → the main branch's latest successful build.
              → served at your canonical domain (e.g. your-domain.com)
              → gets production environment variables
              → indexed by search engines

Preview       → every other branch's latest successful build.
              → served at a unique hash-suffixed URL per deploy
              → gets preview environment variables (often same as production)
              → blocked from search engine indexing (X-Robots-Tag: noindex)
```

Preview deployments are the secret weapon of this model. Every PR gets a fully deployed URL
reviewers can click to see the change live — no checkout, no local build, no "works on my
machine." For a portfolio with visual changes, this is invaluable: "here is what my login
screen looks like after this change" is a Preview URL link in the PR description.

### Environment Variables on Vercel vs on GitHub

You already configured three secrets for CI in Task 16. You will configure the **same three
variables** on Vercel. These are not shared — GitHub Secrets and Vercel Environment Variables
are two separate encrypted stores, each scoped to its respective system. This redundancy is
correct, not wasteful:

| System         | Purpose                      | Scope                                 |
| -------------- | ---------------------------- | ------------------------------------- |
| GitHub Secrets | CI build validation          | `.github/workflows/*.yml` only        |
| Vercel Env     | Production + Preview runtime | `next build` + `next start` on Vercel |
| `.env.local`   | Local development            | Your machine only; never committed    |

The values are identical; the storage is independent. If you rotate a Supabase key, you rotate
it in all three places. This is a known operational cost of defense-in-depth secret management.

### Why You Do Not Need `vercel.json` for This Project

Vercel auto-detects framework, build command, output directory, and install command by reading
`package.json`. For a standard Next.js project, `vercel.json` is optional — you only create it
when overriding defaults (custom headers, rewrites, redirects, cron jobs, regional routing).
This project has no such overrides in Phase 0. Creating an empty or near-empty `vercel.json`
adds maintenance burden for zero functional benefit. Add it later when you need it.

### Why You Still Need a `deploy.yml` Workflow

Vercel's Git integration handles the _deployment_, so why have a GitHub Actions `deploy.yml`?
The answer is **deployment observability**. Vercel reports deployment status back to the commit
on GitHub (the green checkmark you see on `main`), but that check only confirms "Vercel's build
succeeded." It does not confirm:

- The production URL returns HTTP 200 to an external client
- The environment variables injected at build time are actually present in the deployed bundle
- The Supabase connection works from Vercel's infrastructure (not just your local machine)

`deploy.yml` runs _after_ Vercel deploys and performs a **smoke test** — it curls the
production URL and fails the workflow if the response is not 200. This gives you a second
independent signal: Vercel says it deployed AND an external HTTP client can reach the deployed
app. These are different claims.

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Connect Your GitHub Account to Vercel

Log into [vercel.com](https://vercel.com) with the account created in Task 1. Navigate to:

```
Dashboard → Add New... → Project → Import Git Repository
```

Authorize Vercel to access your GitHub account. For a single-repo import, grant access to
_only_ the `windows7-portfolio` repository — not all repositories. Principle of least privilege
applies to third-party integrations.

### Step 2 — Import the Repository

Select your `windows7-portfolio` repo from the list. Vercel auto-detects:

- **Framework:** Next.js
- **Build Command:** `next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

Override the Install Command from `npm install` to **`npm ci`**. This matches the Dockerfile
(Task 15) and CI pipeline (Task 16) — three separate systems using identical dependency
installation. Any drift between them is a potential source of "it worked in CI, broken on
Vercel" bugs.

### Step 3 — Configure Environment Variables Before First Deploy

On the import screen, expand **Environment Variables**. Add the three variables from your
`.env.local`:

| Name                            | Value             | Environments                     |
| ------------------------------- | ----------------- | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | From `.env.local` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From `.env.local` | Production, Preview, Development |
| `NEXT_PUBLIC_GRAPHQL_URL`       | From `.env.local` | Production, Preview, Development |

Apply each variable to all three environments. The anon key is non-sensitive by design — it is
already exposed in the client bundle (that is what `NEXT_PUBLIC_` means). Splitting Production
vs Preview values would be necessary if you had a separate staging Supabase project, which you
do not.

Do not click Deploy yet if any variable is missing. A first deploy without env vars will build
a broken artifact and you will spend minutes debugging before realizing the cause.

### Step 4 — Deploy

Click **Deploy**. Vercel provisions a build container, runs `npm ci`, then `npm run build`,
then uploads the `.next` output to its edge network. This takes 60–120 seconds for a cold
build.

When complete, Vercel presents:

- A production URL: `your-project-name.vercel.app`
- A preview URL for the current commit: `your-project-name-abc123.vercel.app`

Open the production URL. You should see the unstyled Next.js default page (this is Phase 0 —
there is no UI yet). Check the browser devtools network tab: the page should load without any
`undefined` references to environment variables.

### Step 5 — Verify Environment Variable Propagation

In the browser devtools Console, inspect the value Vercel embedded:

```js
// In any component that accesses process.env.NEXT_PUBLIC_GRAPHQL_URL,
// the value should appear as a literal string in the bundle.
// You can confirm by viewing source: view-source:your-project.vercel.app
// and searching for your Supabase URL.
```

If you see `undefined` where the URL should be, the env var was not configured before the build
ran. Re-configure and **redeploy** — Vercel will not automatically rebuild when env vars
change; it requires either a new commit or a manual "Redeploy" via the dashboard.

### Step 6 — Verify Preview Deployment on a PR

Open the `chore/setup-ci` branch from Task 16 (or create a new throwaway branch). Push any
change — even a comment edit — and open a PR. Within seconds, Vercel posts a comment on the
PR with a Preview URL.

Open that Preview URL. It should look identical to Production. Close the PR without merging;
the Preview URL remains accessible for 30 days (Hobby tier retention).

### Step 7 — Add Production URL to GitHub Repository

Navigate to your GitHub repo → **About** (top-right of the main page) → **Edit**. Paste the
Vercel production URL into the Website field. This is not cosmetic: GitHub indexes this URL
and surfaces it in search results, and the Deployments tab on your repo links to it.

### Step 8 — Create the Post-Deploy Smoke Test Workflow

Create `.github/workflows/deploy.yml` with the configuration from the next section. Complete
the embedded TODOs before proceeding.

### Step 9 — Verify the Smoke Test Catches Failures

Temporarily break the production deployment to prove the smoke test works:

1. In the Vercel dashboard, disable (not delete) one of the three environment variables.
2. Trigger a redeploy via the dashboard.
3. Wait for the deploy to complete.
4. Manually trigger the `deploy.yml` workflow from the Actions tab (or push a trivial commit
   to `main`).
5. Confirm the workflow fails — the URL may return 500 or the app may render broken content
   that fails your smoke check.
6. Re-enable the env var. Redeploy. Confirm the workflow passes.

If the smoke test passes even when the app is broken, the check is too permissive. Tighten it.

---

## 📝 Code & Configuration

### `.github/workflows/deploy.yml`

```yaml
# Human-readable workflow name shown in the Actions tab.
name: Post-Deploy Smoke Test

# Triggers: run after code lands on main (which Vercel has deployed),
# and allow manual triggering from the Actions tab for on-demand checks.
# workflow_dispatch is the GitHub mechanism for "run this workflow now"
# from the UI — useful when verifying a fix without pushing a new commit.
on:
  push:
    branches: [main]
  workflow_dispatch:

# Concurrency: don't run multiple smoke tests for the same branch in parallel.
# If three commits land to main in quick succession, only the latest smoke test
# matters — the earlier ones are checking stale deployments anyway.
concurrency:
  group: deploy-smoke-${{ github.ref }}
  cancel-in-progress: true

jobs:
  smoke-test:
    name: Verify Production URL
    runs-on: ubuntu-latest

    # TODO: [DOCS INVESTIGATION] Research how Vercel reports deployment status
    # back to GitHub, and explain in a comment below why this workflow needs
    # a deliberate delay or polling mechanism BEFORE curling the production URL.
    # Hint: this push → deploy chain is asynchronous. What happens if this
    # workflow runs the curl step 2 seconds after the push, before Vercel has
    # even started the build?

    # [Answer]: If the curl runs too early, then it's smoke test will succeed, but against the previous committed codebase not the newly pushed code. A dangerous scenario is where the newly committed code fails deploying, but you are no longer checking because you assumed the deployment was successful from the curl success.

    steps:
      # Step 1 — Wait for Vercel to finish deploying.
      # A naive implementation curls the URL immediately and catches a
      # stale deployment (the previous commit's build) or a 503 while
      # Vercel is mid-deploy. A short sleep is the crude fix. A robust
      # fix uses Vercel's deployment status API or a GitHub Action like
      # patrickedqvist/wait-for-vercel-preview. For this phase, a sleep
      # is acceptable because Hobby-tier builds are consistently sub-120s.
      - name: Wait for Vercel deployment
        run: sleep 120

      # Step 2 — Hit the production URL and assert a 200 response.
      # curl --fail turns any non-2xx status into a non-zero exit code,
      # which fails the workflow. --silent suppresses progress output.
      # --show-error surfaces the actual error message on failure.
      # --location follows redirects (Vercel may redirect HTTP → HTTPS).
      #
      # TODO: Replace the URL below with YOUR production URL from Step 4.
      # Do not hardcode the URL if the repository is public — store it
      # as a repository variable (Settings → Secrets and variables →
      # Actions → Variables tab) and reference it via ${{ vars.PROD_URL }}.
      # Repository VARIABLES (not secrets) are appropriate here because
      # the production URL is already public information.

      # [Answer]: https://portfolio-website-windows7.vercel.app/ added as PROD_URL variable in GitHub project
      - name: Smoke test production URL
        run: |
          curl --fail --silent --show-error --location \
            "${{ vars.PROD_URL }}"

      # TODO: [RESEARCH REQUIRED] The curl step above confirms the URL
      # returns 200, but this is a weak assertion — a 200 response could
      # still be a broken app (e.g., a blank white page or a generic
      # error page rendered with status 200). Research how to use curl
      # or grep to assert a specific string appears in the response body
      # — for example, the literal text "Portfolio Website" from the
      # current page.tsx. Write the enhanced assertion as a comment here.

      # [Answer]: curl -s "${{ vars.PROD_URL }}" | grep -q 'Portfolio' - making use of curl to go to the website, and grep to extract text information from h1 tags, you could see their text content.
```

---

## 🛡️ Challenge & Review

Complete all three TODOs in the workflow file above before answering the questions below. Your
answers must demonstrate comprehension — not quotation from the tutorial.

**1.** You configured the three `NEXT_PUBLIC_` environment variables in three separate
systems: `.env.local` (host), GitHub Secrets (CI), and the Vercel dashboard (production
runtime). A teammate suggests consolidating by reading `.env.local` directly from the
repository during the Vercel build — "why maintain the same value in three places?" Write a
precise technical argument for why this is wrong, addressing both the mechanical reason
(`.env.local` is gitignored) and the architectural reason (the trust/blast-radius model of
separate secret stores).

```
[Answer]: `.env.local` is gitignored because otherwise sensitive data could be uploaded to a repo and available for anyone to see (this repo is public so even more important to hide it). The history of these repos never goes away, so someone could find it the moment it hits GitHub's website. The architectural reason for this is to keep potential breaches in check, not allowing more data than necessary to leak. Additionally, because the encrypted values in the other two stores will differ compared to the breached store, the attacker won't be able to trace those values in order to extract even more sensitive data. If all stored shared the same source, then the attacker only needs to be successful in one place, and gains even more vital information.
```

**2.** Vercel's Git integration deploys automatically when a commit lands on `main`. Task 16's
CI pipeline also runs on every PR to `main`, performing lint, format, and build checks. A
teammate argues the CI build is now redundant — since Vercel is going to build the code anyway
on every merge, the GitHub Actions build step is duplicate work. Without referencing the
tutorial, explain the two distinct failure modes that **only** CI catches and that Vercel's
build cannot — specifically thinking about the temporal ordering of when each check runs
relative to the merge.

```
[Answer]: Vercel is only checking what passes into the PR or branch code, meaning it builds post-commit vs GitHub when can build pre-commit and run checks that prevent particular errors (ESLint, prettier) before they ever hit the repo, and ones which Vercel doesn't check for.
```

**3.** The `deploy.yml` smoke test uses `sleep 120` to wait for Vercel. This is brittle — if
Vercel's build takes 125 seconds, the smoke test curls a stale deployment and passes even
though the new deployment is actually broken. Without writing code, describe a more robust
mechanism that would confirm the **specific commit** you just pushed is what got deployed
before running the curl. You do not need to name a specific GitHub Action — describe the
underlying data that would need to be checked and from where.

```
[Answer]: [Guess]: Given that Vercel runs it's build upon a successful push to main or a successful PR to a preview branch, you could determine the commit can build successfully. If GH could provide the commit-id via it's API, then Vercel could expose it's deployed commit-id in the metadata, allowing a script to access the current commit on the deployment branch and check against the one found at the URL provided. Here would be an example command `git branch main --commit-ver -q (curl -s "${{ vars.PROD_URL }}" | grep -q {metadata:commit-ver})`. CLI syntax is definitely incorrect, but the intention is what matters here: get the commit version from github and run a non-zero code return check on the curl that fetches the PROD_URL's metadata for the commit version deployed
```
