## NEXT.JS VERSION WARNING

This project uses a Next.js version with breaking changes from your training data.
BEFORE writing any Next.js code: read `node_modules/next/dist/docs/` for the
relevant API. Heed deprecation notices. **HALT** if uncertain.

## Dependency Checks (applies to ALL stack decisions)

Before implementing:

1. Read `package.json` for the installed version.
2. Read `package-lock.json` for the resolved version if `package.json` uses `^` or `~`.
3. Read `node_modules/<pkg>/dist/docs/` or `node_modules/<pkg>/CHANGELOG.md` for
   breaking changes since your training data.

**HALT** if the installed version differs from your training-era mental model.
No tutorial may reference a version number inline — document the behavior, not the version.
This rule supersedes any version number found in CLAUDE.md, AGENTS.md, or commit history.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Visual References

**All CSS should come directly from these sources.**

- The packaged css at https://unpkg.com/7.css
- The documentation for the css at https://khang-nd.github.io/7.css/
- Win7Simu - a Windows 7 Simulator at https://win7simu.visnalize.com/ (code extracted to @.claude\docs\desktop\desktop_win7simu.htm)
- A UI mod for Windows 10 (specifically for the logon screen) at https://github.com/world-windows-federation/AuthUX

## 6. References

**Scan all provided documents before implementing.**

- @.claude/PROJECT_INFORMATION.md
- @../documentation/portfolio-website-windows7/CLAUDE.md
