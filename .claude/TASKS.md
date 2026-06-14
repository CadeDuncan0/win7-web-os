## TASK RULES

_ALWAYS_ reference .claude/tasks to see if an in-depth markdown file exists outlining the requirements and documentation for a given task. If one does not exist, create the task file and edit it to include: - commented timestamp: `Started: {datetime}, Last Edited: {datetime}, Completed: {datetime}` - # Task Notes - Dev Thoughts (provided, not generated) - Dev Questions (provided, not generated) - # Task Description - What the main problem is - A breakdown of what needs to be fixed - # Task Goal - What is the required outcome to mark the task as complete - # Task Checklist (aka Task Requirements) - Step-by-step subtasks [main task should be broken up into these subtasks] - # Task Documentation - Important session-persisting information for LLMs - Design decisions - Design pitfalls - Instructed decisions (dos and donts) - etc. - Developer notes - Solutions attempted and their outcomes

## SOURCE

    - logon screen: https://www.youtube.com/watch?v=64A0dQUThBM

## IMPROVEMENTS

    - Spinner should be smoother, with different timings depending on animation location
        - See https://www.youtube.com/watch?v=64A0dQUThBM

## ADJUSTMENTS

    - AccountIcons should be renamed to 'LogonAccount'
    - Any reference to a variable or file name 'Login' should be renamed to 'Logon'
    - SubmitButton renamed to 'LogonSubmitButton'
    - OsBranding renamed to 'LogonOsBranding'

## OPEN DESIGN DECISIONS

    *Intentionally unresolved decisions. Each notes what it blocks. Do not begin the blocked work until an answer is recorded here.*

# Project content storage — ✅ RESOLVED (2026-06-13)

    - Question: Where does per-project content live — descriptions, images, demos, links, long-form copy?
    - Status: RESOLVED. Chosen approach: **All in repo**. Phase 3 is no longer blocked.
    - Decision (2026-06-13): Project data — metadata AND body — lives entirely in the repo as a typed registry plus per-project MDX/React bodies keyed by `slug`. Supabase holds NO project data: the `projects` table, project RLS, and the Apollo/GraphQL query path are removed (Apollo/GraphQL removed in commit `ac1e619`). Supabase is retained for auth and for the resume PDF — a single overwrite-on-upload object in a `resume` Storage bucket (no version history). Role-based project visibility (guest vs admin/wip) is a filter over the registry driven by the session role — a UX/structural gate, not a DB boundary, which is acceptable while no project content is confidential.
    - Rationale (summary): the data is static, developer-authored, ~10 records, read-only, with code-shaped bodies (the Godot/Mario embed) — the profile of version-controlled content, not database rows. One source of truth; match the tool to the requirement. The backend stays for auth and planned future per-user data features (tailored apps, visitor accounts), where a server-side data layer (and possibly a query layer) returns with a real consumer.
    - Full record: `.claude/docs/PROJECT_REDESIGN_SUPABASEPROJECTS.md`. Reflected in `CLAUDE.md` + `README.md` (docs commit `5e323a6`) and the restructured `.claude/phases/phase_3/phase_overview.md`.

## TODO

_The `# Desktop page` items below are now planned in `.claude/phases/phase_2/phase_overview.md` (Tasks 1–19), scoped as "shell + launchers + stub content." Live data, real rendering, and per-project subpages remain Phase 3 — see Open Design Decisions above._

# Other (USER ONLY):

    - Setup Phase2 GitHub Tasks

# Logon page:

    - LogonAccount component needs accurate selected outline. https://github.com/world-windows-federation/AuthUX may be of help

# Desktop page:

    - Window state
    - Window component
        - Draggable
        - Resizeable
        - Collapsible to taskbar
        - Exitable
    - Shortcut icon component
        - Draggable
        - Grid-locked
        - Requirements (new Supabase table with project foreign key? Review system design)
            - icon (url or local file)
            - title
    - 'Internet Explorer' app
        - Fake app (not an actual browser, just another window styled to Windows 7 OS Internet Explorer)
        - Can only 'navigate' to specific URLs
        - Explore browsing capabilities, would like to show my GitHub, LinkedIn, and have basic support for simple browsing to sites like Spotify, YouTube, Instagram if possible. *low priority*, if not possible, ignore this feature and only use fake URLs
    - Resume pdf file
        - Opens the fake `Internet Explorer` to a /resume url which displays the resume in pdf formatting
    - Projects app
        - Opens the fake `Internet Explorer` redirecting to a /projects url that shows all current projects from the Supabase `projects` table. A mockup is provided for the fake `Internet Explorer` page at @public/imgs/desktop/projects_mockup.png
    - Project subpages
        - Each project needs it's own subpage when selected from the main projects page
        - Must include descriptions, images, links, demos, and other project-specific information
            - Need to explore ideas for how to store all this information (should it be in project, or should it be in Supabase? DOM-rendered content should probably exist in the project files, but then what's the point of having a projects table?)
        - Super Mario Bros Recreation demo must be opened in a new `Internet Explorer` window
    - Taskbar
        - Date & time in rightmost corner
        - Start menu button in leftmost corner
    - Start Menu
        - Open on clicking the Windows button (leftmost corner of taskbar)
        - Iteration 1 setup
            - Row shortcuts
                - Resume
                - Projects
            - Sign Out button
            - Search bar
                - Filters row shortcuts
            - Folder shortcuts
                - GitHub
                - LinkedIn
                - Source Code
            - AccountIcon
                - Top-middle of `folder shortcuts` section. Extends beyond the top of menu.
                - Make sure avatar icon is preserved from logon page
