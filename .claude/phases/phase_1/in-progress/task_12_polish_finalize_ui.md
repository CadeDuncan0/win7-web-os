# 🎯 Task 12: Polish & Finalize UI

---

## 🧠 Engineering Context & Rationale

### Why This Task Exists

Tasks 8 and 9 delivered the login screen as a **rough draft** — the primitives are
real components, the layout assembles, the animations fire, but the visual fidelity
against the actual Windows 7 login UI is approximate. Glow falloffs, tile borders,
caret behavior on focus, the precise grey of the lock-screen wallpaper, the exact
weight of the "Switch User" affordance — every one of these is "close enough" today.
This task closes the gap to **pixel-parity** with the real OS.

The reason this is a separate task — and not bundled into Task 9 — is that visual
finalization requires the authentication flow to be locked. If a tile size changes,
its hit target changes, and the click handler from Task 9 needs re-verification. If
the password input grows a chrome detail, its focus-trap behavior may shift. By
deferring the polish pass until Tasks 1–11 are green, every visual edit lands on a
stable functional base, and any regression is unambiguously a visual regression.

### The Reference Material

CLAUDE.md and AGENTS.md both name the reference sources:

- `https://github.com/osama2kabdullah/win-7` — a fan recreation; useful for cross-check
- `https://unpkg.com/7.css` — packaged CSS; reference only, do not import

Neither is to be imported. The Aero Glass token system (Task 6) is the single source
of truth for color, shadow, blur, gradient, and radius — those tokens may need to
**expand** to cover gaps discovered during this polish pass. Adding tokens is allowed;
hardcoding values is not.

### Verification Model

Pure code review cannot prove a UI is pixel-perfect — only side-by-side comparison
can. This task verifies via two mechanisms:

1. **Eyeball test** — open the real Windows 7 login screen reference image and the
   running portfolio's login screen side-by-side at matched zoom levels. Walk every
   visible element: wallpaper, tile shape, tile border, tile glow, tile spacing,
   shutdown affordance, password input chrome, caret, error state, button gradient,
   button border, OS branding text, transition smoothness.
2. **Image comparison** — pairs of reference screenshots and portfolio screenshots
   stored under `public/imgs/login/`, named with the convention:

- `os_{n}.png` — the authentic Windows 7 screen at state `{n}`
- `portfolio_{n}.png` — the portfolio's recreation at the same state
  States to cover (each gets a numbered pair):

| `{n}` | State                                                   |
| ----- | ------------------------------------------------------- |
| 1     | Initial — both account tiles visible, neither focused   |
| 2     | Guest tile hover / focused                              |
| 3     | Admin tile selected, password input visible, empty      |
| 4     | Password input focused with caret                       |
| 5     | Admin sign-in error state (wrong password)              |
| 6     | Mid-transition (Admin tile selection → password reveal) |

The reference (`os_{n}.png`) is captured once and committed. The portfolio
counterpart (`portfolio_{n}.png`) is recaptured on every meaningful change and
re-committed alongside it.

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Capture Reference Screenshots

Before changing any code, capture the six `os_{n}.png` screenshots from an authentic
Windows 7 source. Acceptable sources:

- A running Windows 7 VM (highest fidelity)
- An archived screenshot from `github.com/osama2kabdullah/win-7` or a comparable
  high-resolution reference
- A combination — VM for states that can be reproduced, archive for transitions

Commit the six `os_{n}.png` files to `public/imgs/login/` in a dedicated commit. This
freezes the baseline.

### Step 2 — Walk the Eyeball-Test Inventory

For each visual element below, open the running portfolio at `http://localhost:3000/login`
and the `os_1.png` reference at matched zoom. Note every divergence. Do not change
anything yet — list first, fix second.

- **Wallpaper / background**: hue, gradient stops, vignette
- **Account tile**: dimensions, border radius, border color, border width, glow on
  focus, shadow on idle, internal padding, avatar circle, account-name typography
- **Tile spacing**: horizontal gap between tiles, vertical offset from top
- **Shutdown affordance**: position, icon weight, label typography
- **Password input chrome**: border, focus ring, caret color, caret blink rate,
  internal padding, placeholder treatment
- **Submit button**: gradient stops, border, focus ring, hover state, active state
- **OS branding text**: position, weight, color, opacity
- **Animations**: entrance timing, tile-select transition, password reveal,
  back-to-tile transition

### Step 3 — Fix in Order of Visibility

Address the divergences from Step 2 in order from largest visual mass to smallest:
wallpaper → tiles → password input → buttons → typography → micro-interactions. After
each fix, recapture `portfolio_{n}.png` for every affected state and compare. A fix
that improves state 1 must not regress states 2–6.

Every new color, shadow, blur, gradient, or radius value lands as a CSS custom
property in `globals.css` first. Component stylesheets reference the new tokens —
they never hardcode the values. If an existing token needs adjustment, update it in
`globals.css` and recapture every dependent screenshot.

### Step 4 — Final Side-by-Side Sweep

Once all states have been polished, run the full inventory one more time. For each
of the six `{n}` states:

- Open `os_{n}.png` and `portfolio_{n}.png` side-by-side at 100% zoom.
- The pair must be **indistinguishable except for** unavoidable rendering differences
  (subpixel hinting, OS font smoothing). Layout, color, glow, gradient, and radius
  must match.

Failure of any single state sends the task back to Step 3 for that state.

### Step 5 — Token Audit & Storybook Refresh

After visual polish lands, repeat Task 11's Check 8 (design token coverage audit):

```powershell
Get-ChildItem -Recurse -Filter "*.module.css" -Path src |
  Select-String -Pattern '#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|blur\(\d'
```

Every match must be inside a `var(...)` reference or otherwise justified. Any raw
literal is a regression introduced during the polish pass and must be moved to
`globals.css`.

Refresh Storybook for every login primitive (`AccountTile`, `PasswordInput`,
`SignInButton`) so the documented variants reflect the final visuals — old story
snapshots must not show pre-polish chrome.

---

## 📝 Validation Report

```
## Phase 1 — Visual Finalization Checklist

| #   | Check                                                          | Status |
| --- | -------------------------------------------------------------- | ------ |
| 1   | All six `os_{n}.png` reference screenshots committed           |   ?   |
| 2   | All six `portfolio_{n}.png` final screenshots committed        |   ?   |
| 3   | State 1 (initial) — pair indistinguishable                     |   ?   |
| 4   | State 2 (Guest hover/focus) — pair indistinguishable           |   ?   |
| 5   | State 3 (Admin selected, password empty) — pair indistinguishable | ?   |
| 6   | State 4 (password focused with caret) — pair indistinguishable |   ?   |
| 7   | State 5 (sign-in error) — pair indistinguishable               |   ?   |
| 8   | State 6 (tile-to-password mid-transition) — pair indistinguishable | ? |
| 9   | Zero raw color/shadow/blur literals in component CSS modules   |   ?   |
| 10  | Storybook stories regenerated to reflect final visuals         |   ?   |
| 11  | `npm run build` succeeds                                       |   ?   |
| 12  | `npm run build-storybook` succeeds                             |   ?   |

Validated by: Cade
Validated on:
```

---
