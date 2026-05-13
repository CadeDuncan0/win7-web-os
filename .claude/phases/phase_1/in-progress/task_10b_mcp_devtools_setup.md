<!-- Created: 2026-05-13 03:05:58 -->

### 🎯 Task 10b: MCP DevTools Setup — Senior Debug Capability for Task 10 Step 5

> **Scope:** This is a tooling sub-task of [Task 10](./task_10_route_protection_proxy.md).
> It does not write product code. It installs the Senior's verification capability so
> Step 5's nine-row matrix can be executed end-to-end without the Junior having to
> screenshot DevTools tabs back into chat. Close this sub-task **before** running Step 5.

---

#### 🧠 Rationale

Task 10 Step 5 is a manual verification matrix (rows 1–9) covering redirects, cookie
state, header inspection, and a security row that tampers with a session cookie. The
Senior currently has `Read`/`Grep`/`Glob`/read-only `Bash` only — none of which can:

- observe a live HTTP status code from a real browser request,
- read or mutate the running document's cookie store,
- inspect the `Cookie:` header on an outgoing request,
- hand-forge a session cookie for the row-8 security check.

Without a browser-side capability, Step 5 collapses to "Junior, paste screenshots,"
which is slow and error-prone. The fix is to bind a Model Context Protocol (MCP) server
that exposes Chrome DevTools to the Senior, so the matrix runs as tool calls instead of
prose hand-offs.

##### Why `chrome-devtools-mcp` over alternatives

| Candidate                   | Surface fit to Step 5 matrix                                                                                                  | Cost                                           | Verdict                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------- |
| **`chrome-devtools-mcp`**   | Native cookie read/write, network panel access, status codes, JS exec in page context, screenshots. 1:1 with rows 1, 6, 8, 9. | Single MCP entry in `.claude/mcp.json`.        | ✅ **Recommended.**                           |
| `playwright-mcp`            | Navigate + read DOM + cookies. Lacks the Network panel headers surface that row 9 needs without extra glue.                   | Same install footprint.                        | ⚠️ Workable, weaker.                          |
| `puppeteer-mcp` (community) | Page automation; cookie read/write OK; status codes via response interception.                                                | Less-maintained; behavior drifts across forks. | ❌ Skip.                                      |
| Junior-paste-screenshots    | Zero install.                                                                                                                 | Every row is a multi-turn round-trip.          | ❌ Skip — Step 5's purpose is fast iteration. |

`chrome-devtools-mcp` is the official MCP for this surface (`github.com/modelcontextprotocol/servers`
catalog confirms — verify current name at install time, the registry occasionally renames packages).

##### Mapping MCP capabilities → Step 5 rows

```
Row 1  redirect on no session     →  navigate() + read response.status (307) + Location header
Row 2  /login renders             →  navigate() + read status (200)
Row 3  / does NOT fire proxy      →  navigate() + assert no Set-Cookie change, no redirect
Row 4  Guest → /desktop           →  click sign-in, navigate(), assert 200
Row 5  Admin → /desktop           →  signIn flow, navigate(), assert 200
Row 6  Application → Cookies      →  cookies.getAll() filtered by name prefix `sb-` + `portfolio.guest`
Row 7  Sign out → /desktop        →  trigger signOut, navigate(), assert 307 to /login
Row 8  Forged cookie              →  cookies.set('sb-...', 'garbage'), navigate(), assert 307 (NOT 500)
Row 9  Network Cookie: header     →  read request.headers['cookie'] on the /desktop request
```

Every row resolves to a concrete tool call sequence. Row 8 is the load-bearing one — if
the proxy 500s on a malformed cookie, the security posture is broken regardless of how
the happy path looks.

---

#### 🛠️ Implementation Outline

##### Step 0 — Record the decision in this file

Open a `[Decision]:` block at the top of your working notes:

```
[Decision]:
- MCP server: chrome-devtools-mcp (or current registry name).
- Reason: 1:1 capability fit with Step 5 rows 1, 6, 8, 9.
- Scope: project-local MCP (.claude/mcp.json), not user-global.
- Justification for project-local: capability is bound to this task's
  verification matrix; do not pollute the user's global MCP config.
[Note]: Step 5's row 8 is the security gate. If the MCP cannot mutate a
  cookie before a navigate(), the matrix cannot certify the proxy.
```

##### Step 1 — Verify the package name and install command on the MCP registry

```bash
# TODO: [Research Required: current chrome-devtools MCP package]
#   - Open the MCP registry (modelcontextprotocol.io/servers or the GitHub
#     `modelcontextprotocol/servers` repo).
#   - Confirm the canonical package name and `npx`/`uvx` install command.
#   - Record the exact command in your [Decision]: block.
#   - HALT if the registry has been renamed or relocated.
```

##### Step 2 — Register the MCP in the project (not user-global)

```jsonc
// TODO: create or edit .claude/mcp.json (NOT ~/.claude/mcp.json)
{
  "mcpServers": {
    "chrome-devtools": {
      // TODO: [Research Required: exact command and args from Step 1]
      //   - Likely `npx -y @modelcontextprotocol/server-chrome-devtools` or similar.
      //   - DO NOT pin a version inline — let npm resolve latest stable.
      //   - If the package supports a profile/data-dir flag, point it at a
      //     throwaway profile under .claude/ to keep your real browser
      //     state untouched.
    },
  },
}
```

> **`[Note]:` why project-local:** The MCP exists to verify _this_ proxy. Putting it in
> the user's global config makes its tool surface available to every other project,
> which is noisy at best and footgun-prone for any other repo that doesn't expect a
> browser-driving capability to be present.

##### Step 3 — Restart Claude Code and confirm tool availability

```bash
# TODO: After editing .claude/mcp.json, restart the Claude Code session
# (the MCP host reads this on startup). On restart, verify that the Senior
# can see tools prefixed `mcp__chrome-devtools__*` (or whatever namespace
# the registry assigns).
```

Verification gate: ask the Senior to call any one read-only MCP tool (e.g. list
open pages or fetch a current URL). If the call fails with `InputValidationError`
or "tool not found," the MCP did not register — re-check Steps 1–2 before continuing.

##### Step 4 — Smoke-test against `npm run dev` before touching Step 5

```bash
# TODO: [Action Required: smoke test]
#   1. `npm run dev` in one terminal — confirm Next 16 boots on :3000.
#   2. Have the Senior drive the MCP through ONE row of the Step 5 matrix
#      end-to-end. Recommended: Row 1 (visit /desktop with no session,
#      observe 307 → /login?from=%2Fdesktop).
#   3. If Row 1 round-trips cleanly, the MCP is wired correctly.
#   4. If it fails, the failure mode tells you what to fix:
#      - "cannot connect" → MCP not running / wrong command
#      - "navigation hangs" → headless flag missing / DevTools not attached
#      - "cookies API unavailable" → wrong package or insufficient permission scope
```

##### Step 5 — Hand off to Task 10 Step 5

Once the smoke test passes, this sub-task is complete. The Senior now has the capability
to execute the full nine-row matrix as tool calls. Move this file to
`.claude/phases/phase_1/complete/` and resume Task 10 from its Step 5.

---

#### 🛡️ Summary

- **Why this exists:** Task 10 Step 5 is unverifiable from `Read`/`Grep` alone. The
  Senior needs browser-driving capability to observe redirects, mutate cookies, and
  inspect request headers — specifically rows 1, 6, 8, 9 of the matrix.
- **Tool choice: `chrome-devtools-mcp`.** Native fit for cookie mutation (row 8 — the
  security row), Network panel header inspection (row 9), and status-code observation
  (rows 1, 7). Playwright/Puppeteer alternatives lack equivalent header surface or
  registry stability.
- **Scope: project-local MCP config.** `.claude/mcp.json`, not `~/.claude/mcp.json`.
  Keeps the browser-driver capability bound to this repo.
- **No product code touched.** This task installs tooling. Task 10's `proxy.ts`,
  `auth.ts`, and `guestCookie.ts` remain Junior-owned per AGENTS.md write constraint.
- **Row 8 is the contract.** A proxy that 500s on a forged cookie is broken regardless
  of how the happy path looks. The MCP exists primarily so the Senior can run row 8
  authoritatively.
- **Completion criterion:** smoke test (Step 4) passes against a live `npm run dev`.
  Until then, Task 10's `Task Completed` trigger remains blocked.

**FAANG interview pressure points:** "Why not just ask the Junior to paste DevTools
output?" (multi-turn round-trip per row, error-prone for header text, no auditable
record); "Why not Playwright?" (Network panel header surface is weaker — row 9 needs
the raw outgoing `Cookie:` header, not just response cookies); "Why project-local
MCP?" (capability bound to a single verification gate; global registration leaks tool
surface into unrelated projects).
