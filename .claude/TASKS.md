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
    - OsBranding renmaed to 'LogonOsBranding'

## OPEN DESIGN DECISIONS

    *Intentionally unresolved decisions. Each notes what it blocks. Do not begin the blocked work until an answer is recorded here.*

# Project content storage — ⛔ BLOCKS PHASE 3

    - Question: Where does per-project content live — descriptions, images, demos, links, long-form copy?
    - Status: UNRESOLVED. Does NOT block Phase 2 (Resume/Projects render stub content only). An answer MUST be recorded here before any Phase 3 work begins.
    - Candidate approaches:
        - Hybrid (table = index, repo = content): the `projects` table stays the source of truth for the card grid (title, tech_stack, visibility, thumbnail) and drives listing + RLS; rich subpage content (copy, embedded demos, galleries) renders from repo-resident MDX/React.
        - All in Supabase: descriptions, image URLs (Storage), demo links, and body content all move into the `projects` table / added columns; subpages render fully from the DB.
        - All in repo: a static in-repo registry holds all project data and content; Supabase is auth-only. (Note: undercuts the GraphQL + RLS data-layer thesis in `CLAUDE.md`.)
    - Decision: _pending — record the chosen approach and rationale here._

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
