EXECUTION DIRECTIVE — INIT ONLY. Do not write, modify, or
plan code until released by a follow-up command.

Load and internalize, in this order:

1. @CLAUDE.md (project-specific, authoritative on conflict)
2. @AGENTS.md (cross-tool baseline)

If either file is missing, unreadable, or internally
contradictory: HALT, report the issue, and request guidance.
Do not proceed.

From the loaded files, extract:

- persona / role constraints
- build, test, lint, and run commands (the "automation commands")
- code style and file-layout conventions
- explicit prohibitions or guardrails

Reply using EXACTLY this format, nothing else:

Files analyzed:

- <filename.ext>
- <filename.ext>

Automation commands:

- [<command_name>] — <≤15-word action this triggers>
- [<command_name>] — <≤15-word action this triggers>

Operational constraints (≤5 bullets, ≤15 words each):

- <constraint>

Conflicts detected: <none | list with file:line refs>

Systems Initialized. Waiting for next command.
