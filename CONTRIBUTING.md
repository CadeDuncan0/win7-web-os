# Contributing to win7-web-os

Thanks for your interest! This repo is a generic, forkable scaffold — most "contributions" are
actually personalizations that belong in your fork, not here. Use this guide to tell the two
apart.

## Fork it (personalize)

If you're building **your own** desktop site:

1. Fork the repo (it's a GitHub template — "Use this template" also works).
2. Edit `src/config/site.ts` — site URL, external links, branding subtitle. This is the single
   documented config location; the README's **Make it yours** section maps everything else
   (desktop icons, Start Menu shortcuts, IE pages, redirects, assets).
3. Copy `.env.example` to `.env.local` and point it at your own Supabase project.
4. Keep this repo as an `upstream` remote and merge periodically to pick up scaffold fixes:

   ```bash
   git remote add upstream https://github.com/CadeDuncan0/win7-web-os.git
   git fetch upstream && git merge upstream/main
   ```

Personal content (your bio, projects, photos, analytics IDs) should never be PR'd back here.

## Contribute back (improve the scaffold)

Bug fixes, new Windows 7 primitives, window-manager improvements, and a11y work are all welcome.

- **Where things live:** the OS engine is `src/store/slices/` (state) +
  `src/components/screens/desktop/` (chrome); reusable Win7 primitives are
  `src/components/windows7/`, each with a Storybook story.
- **Adding an app window:** extend the `WindowKind` union, add a `WindowManager` case and
  `taskbarApps.ts` meta, then register a launcher in `desktopIcons.ts` / `startMenuItems.ts`.
  Keep demo content generic — no personal data in the scaffold.
- **Style:** match the existing code. CSS goes through the Aero Glass tokens in `globals.css`
  (the `check:tokens` script flags hardcoded literals); asset paths go through
  `src/lib/assetPaths.ts`.

### Quality gates

Every change must pass the same gates CI runs:

```bash
npm run lint        # ESLint, zero warnings
npm run test        # Vitest unit + component suite
npm run build       # production build + type-check
```

Pre-commit hooks (Husky + lint-staged) auto-run ESLint/Prettier on staged files, and commitlint
enforces [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`,
`test:`, `chore:`, …). Don't bypass hooks with `--no-verify` — fix the root cause.

### Pull requests

- Keep PRs focused — one concern per PR.
- Include or update tests for behavior you change; stories for visual components.
- Describe what changed and why; screenshots/GIFs help for anything visual.
