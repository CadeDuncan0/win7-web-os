## TASK RULES

_ALWAYS_ reference .claude/docs to see if an in-depth markdown file exists outlining the requirements and documentation for a given task. If one does not exist, create the task file and edit it to include: - commented timestamp: `Started: {datetime}, Last Edited: {datetime}, Completed: {datetime}` - # Task Notes - Dev Thoughts (provided, not generated) - Dev Questions (provided, not generated) - # Task Description - What the main problem is - A breakdown of what needs to be fixed - # Task Goal - What is the required outcome to mark the task as complete - # Task Checklist (aka Task Requirements) - Step-by-step subtasks [main task should be broken up into these subtasks] - # Task Documentation - Important session-persisting information for LLMs - Design decisions - Design pitfalls - Instructed decisions (dos and donts) - etc. - Developer notes - Solutions attempted and their outcomes

## Other (USER ONLY):

    - Setup Phase3 GitHub Tasks

## Logon page:

    - LogonAccount component needs accurate selected outline. https://github.com/world-windows-federation/AuthUX may be of help

## Desktop page:

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
