# Contributing to win7-web-os

Thanks for your interest! This repo is a generic, forkable template — most "contributions" are
actually personalizations that belong in your fork, not here. Use this guide to tell the two
apart.

## Fork it (personalize)

If you're building **your own** desktop site:

1. Fork the repo (it's a GitHub template — "Use this template" also works).
2. Edit the plain-data registries — `desktopIcons.ts`, `startMenuItems.ts`, and `ieRoutes.ts`.
   The README's **Make it yours** section maps every content location (icons, Start Menu
   shortcuts, IE pages and external links, branding, redirects, assets).
3. Copy `.env.example` to `.env.local` and point it at your own Supabase project.
4. Keep this repo as an `upstream` remote and merge periodically to pick up template fixes:

   ```bash
   git remote add upstream https://github.com/CadeDuncan0/win7-web-os.git
   git fetch upstream && git merge upstream/main
   ```

Personal content (your bio, projects, photos, analytics IDs) should never be PR'd back here.

## Contribute back (improve the template)

Bug fixes, new Windows 7 primitives, window-manager improvements, and a11y work are all welcome.

- **Where things live:** the OS engine is `src/store/slices/` (state) +
  `src/components/screens/desktop/` (chrome); reusable Win7 primitives are
  `src/components/windows7/`.
- **Adding an app window:** extend the `WindowKind` union, add a `WindowManager` case and
  `taskbarApps.ts` meta, then register a launcher in `desktopIcons.ts` / `startMenuItems.ts`.
  Keep demo content generic — no personal data in the template.
- **Style:** match the existing code. Every color, shadow, blur, gradient, and radius goes
  through the Aero Glass tokens in `src/app/globals.css` — never write raw literals in a
  component stylesheet. Asset paths go through `src/lib/assetPaths.ts`.

### Before you open a PR

```bash
npm run build   # production build + type-check — must pass clean
```

Exercise the flows your change touches in the browser (`npm run dev`): logon as Guest, open and
manage windows, and walk the keyboard path for anything interactive.

### Pull requests

- Keep PRs focused — one concern per PR.
- Use [Conventional Commit](https://www.conventionalcommits.org/) messages (`feat:`, `fix:`,
  `docs:`, `chore:`, …).
- Describe what changed and why; screenshots/GIFs help for anything visual.
