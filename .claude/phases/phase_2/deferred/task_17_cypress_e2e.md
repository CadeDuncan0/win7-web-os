<!-- Created: 2026-06-13 01:46:27 -->

# Task 17: Cypress E2E Suite — Desktop Journeys

---

### Task: Cypress E2E Suite — Desktop Journeys

#### Rationale

Unit and RTL tests verify component behavior in isolation. E2E tests verify that the
full application — login, session, Redux hydration, routing, desktop composition, window
lifecycle — works as a user experiences it. Cypress runs a real browser against the
production build, catching integration failures that unit tests structurally cannot.

The existing Cypress harness (Task 4) provides:

| Asset                         | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `cypress.config.ts`           | baseUrl `http://localhost:3000`, video off                          |
| `cypress/support/commands.ts` | `cy.loginAsGuest()` and `cy.loginAsAdmin()` session commands        |
| `cypress/support/e2e.ts`      | Imports commands + `@testing-library/cypress`                       |
| `cypress/support/index.d.ts`  | Type declarations for custom commands                               |
| `cypress/e2e/smoke.cy.ts`     | Smoke test: both roles reach `/desktop`                             |
| `.github/workflows/ci.yml`    | `cypress` job (needs `quality`) using `cypress-io/github-action@v6` |

This task adds three spec files covering the four flows specified in the phase overview:

```
Flow A — Guest Desktop Journey
  login → desktop renders → open window → minimize → restore → close

Flow B — Admin Desktop Journey
  login → open multiple windows → z-index stacking → maximize/restore

Flow C — Right-click context menus
  DEFERRED — no context menu component exists in the Phase 2 task list.
  The Menu primitive (src/components/windows7/Menu/) is built but not
  wired into any desktop or icon surface. Context menus are a Phase 4
  or future-phase concern.

Flow D — Start Menu + IE Navigation
  Start orb → Start Menu → search filter → open IE windows via shortcuts
  and desktop icons → IE back/forward → Sign Out → /login
```

**Selector strategy:** Cypress queries use `@testing-library/cypress` methods
(`cy.findByRole`, `cy.findByText`, `cy.findByLabelText`, `cy.findByTestId`)
which mirror RTL's accessible-query approach. This avoids brittle CSS selectors
and keeps E2E tests aligned with the a11y contracts the components already expose.

**Pointer-event testing:** Window dragging uses `setPointerCapture` + `pointermove`,
which Cypress can simulate via `cy.trigger('pointerdown')` / `cy.trigger('pointermove')`
/ `cy.trigger('pointerup')`. Icon dragging via `@dnd-kit` requires specialized sensor
activation that is unreliable in Cypress synthetic events — icon drag is covered by RTL
tests (Task 7) and is not duplicated here.

#### Implementation Outline

### Step 0 — Spec file: `cypress/e2e/guest-desktop.cy.ts`

```tsx
// TODO: [Action Required: write the Guest Desktop Journey spec] - 15 min
//
//   This is the core happy-path E2E test for a Guest user. It validates
//   the full post-login experience: desktop rendering, window lifecycle
//   (open → minimize → restore → close), and taskbar integration.
//
//   The spec uses cy.loginAsGuest() from the existing support commands,
//   then visits /desktop. All queries use @testing-library/cypress methods.
//
//   describe('Guest Desktop Journey')
//
//     beforeEach(() => {
//       cy.loginAsGuest()
//       cy.visit('/desktop')
//     })
//
//     it('renders the desktop shell with icons and taskbar')
//       - cy.findByRole('main', { name: /desktop/i }).should('exist')
//       - cy.findByTestId('icon-grid').should('exist')
//       - cy.findByRole('navigation', { name: /taskbar/i }).should('exist')
//       - Verify at least 5 icon buttons exist (IE, Resume, Projects, Welcome, About This PC)
//         cy.findByRole('button', { name: 'Internet Explorer' }).should('exist')
//         cy.findByRole('button', { name: 'Resume' }).should('exist')
//         cy.findByRole('button', { name: 'Projects' }).should('exist')
//         cy.findByRole('button', { name: 'Welcome' }).should('exist')
//         cy.findByRole('button', { name: 'About This PC' }).should('exist')
//
//     it('opens a window by double-clicking a desktop icon')
//       - cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()
//       - cy.findByTestId('managed-window-win-1').should('exist')
//       - The taskbar should show a button for the opened window:
//         cy.findByRole('navigation', { name: /taskbar/i })
//           .findByRole('button', { name: 'Internet Explorer' })
//           .should('exist')
//
//     it('minimizes a window via the title bar and restores from the taskbar')
//       - Open a window: cy.findByRole('button', { name: 'Welcome' }).dblclick()
//       - Verify window is visible: cy.findByTestId('managed-window-win-1').should('exist')
//       - Click the Minimize button in the window's title bar:
//         cy.findByTestId('managed-window-win-1')
//           .findByRole('button', { name: 'Minimize' })
//           .click()
//       - Window should disappear from DOM (selectVisibleWindows filters it):
//         cy.findByTestId('managed-window-win-1').should('not.exist')
//       - The taskbar button should still exist:
//         cy.findByRole('navigation', { name: /taskbar/i })
//           .findByRole('button', { name: 'Welcome' })
//           .should('exist')
//       - Click the taskbar button to restore:
//         cy.findByRole('navigation', { name: /taskbar/i })
//           .findByRole('button', { name: 'Welcome' })
//           .click()
//       - Window should reappear:
//         cy.findByTestId('managed-window-win-1').should('exist')
//
//     it('closes a window via the title bar Close button')
//       - Open a window: cy.findByRole('button', { name: 'Welcome' }).dblclick()
//       - cy.findByTestId('managed-window-win-1').should('exist')
//       - Click Close:
//         cy.findByTestId('managed-window-win-1')
//           .findByRole('button', { name: 'Close' })
//           .click()
//       - Window and taskbar button should both be gone:
//         cy.findByTestId('managed-window-win-1').should('not.exist')
//         cy.findByRole('navigation', { name: /taskbar/i })
//           .findByRole('button', { name: 'Welcome' })
//           .should('not.exist')
```

### Step 1 — Spec file: `cypress/e2e/admin-desktop.cy.ts`

```tsx
// TODO: [Action Required: write the Admin Desktop Journey spec] - 15 min
//
//   Admin exercises the same features as Guest plus multi-window
//   z-index stacking and the maximize/restore toggle. The Admin
//   login requires the CYPRESS_ADMIN_PASSWORD env var (already
//   configured in ci.yml).
//
//   describe('Admin Desktop Journey')
//
//     beforeEach(() => {
//       cy.loginAsAdmin()
//       cy.visit('/desktop')
//     })
//
//     it('renders the desktop for Admin')
//       - cy.findByRole('main', { name: /desktop/i }).should('exist')
//       - cy.findByRole('navigation', { name: /taskbar/i }).should('exist')
//
//     it('opens multiple windows and promotes z-index on focus')
//       - Open two windows:
//         cy.findByRole('button', { name: 'Welcome' }).dblclick()
//         cy.findByRole('button', { name: 'About This PC' }).dblclick()
//       - Both windows should exist:
//         cy.findByTestId('managed-window-win-1').should('exist')
//         cy.findByTestId('managed-window-win-2').should('exist')
//       - The second window (win-2) should have a higher z-index:
//         cy.findByTestId('managed-window-win-2')
//           .invoke('css', 'z-index')
//           .then((z2) => {
//             cy.findByTestId('managed-window-win-1')
//               .invoke('css', 'z-index')
//               .then((z1) => {
//                 expect(parseInt(z2 as string)).to.be.greaterThan(parseInt(z1 as string))
//               })
//           })
//       - Click the first window to focus it (pointerdown promotes z-index):
//         cy.findByTestId('managed-window-win-1').click()
//       - Now win-1 should have the higher z-index:
//         cy.findByTestId('managed-window-win-1')
//           .invoke('css', 'z-index')
//           .then((z1) => {
//             cy.findByTestId('managed-window-win-2')
//               .invoke('css', 'z-index')
//               .then((z2) => {
//                 expect(parseInt(z1 as string)).to.be.greaterThan(parseInt(z2 as string))
//               })
//           })
//
//     it('maximizes and restores a window via the title bar button')
//       - Open a window: cy.findByRole('button', { name: 'Welcome' }).dblclick()
//       - Record original position:
//         cy.findByTestId('managed-window-win-1')
//           .invoke('css', 'left')
//           .as('originalLeft')
//       - Click Maximize button:
//         cy.findByTestId('managed-window-win-1')
//           .findByRole('button', { name: 'Maximize' })
//           .click()
//       - Window should be at position 0,0 with full viewport dimensions:
//         cy.findByTestId('managed-window-win-1')
//           .should('have.css', 'left', '0px')
//           .and('have.css', 'top', '0px')
//       - The button label should change to 'Restore' (7.css convention):
//         cy.findByTestId('managed-window-win-1')
//           .findByRole('button', { name: 'Restore' })
//           .should('exist')
//       - Click Restore:
//         cy.findByTestId('managed-window-win-1')
//           .findByRole('button', { name: 'Restore' })
//           .click()
//       - Window should return to its original position:
//         cy.get('@originalLeft').then((origLeft) => {
//           cy.findByTestId('managed-window-win-1')
//             .invoke('css', 'left')
//             .should('eq', origLeft)
//         })
```

### Step 2 — Spec file: `cypress/e2e/start-menu-ie.cy.ts`

```tsx
// TODO: [Action Required: write the Start Menu + IE Navigation spec] - 20 min
//
//   This spec covers the Start Menu interaction flow and Internet Explorer
//   navigation. It verifies that the Start Menu opens from the orb, that
//   search filtering works, that shortcuts launch correct windows, that IE
//   navigates between stub routes, and that Sign Out returns to /login.
//
//   describe('Start Menu + IE Navigation')
//
//     beforeEach(() => {
//       cy.loginAsGuest()
//       cy.visit('/desktop')
//     })
//
//     it('opens the Start Menu via the Start orb')
//       - cy.findByRole('button', { name: 'Start' }).click()
//       - cy.findByRole('menu', { name: /start menu/i }).should('exist')
//       - Verify menu items are visible:
//         cy.findByRole('menuitem', { name: 'Resume' }).should('exist')
//         cy.findByRole('menuitem', { name: 'Projects' }).should('exist')
//         cy.findByRole('menuitem', { name: 'GitHub' }).should('exist')
//         cy.findByRole('menuitem', { name: 'LinkedIn' }).should('exist')
//         cy.findByRole('menuitem', { name: 'Source Code' }).should('exist')
//         cy.findByRole('menuitem', { name: 'Sign Out' }).should('exist')
//
//     it('filters shortcuts with the search box')
//       - cy.findByRole('button', { name: 'Start' }).click()
//       - cy.findByLabelText(/search programs/i).should('exist')
//       - Type 'res' into the search box:
//         cy.findByLabelText(/search programs/i).type('res')
//       - Only 'Resume' should be visible in the left column:
//         cy.findByRole('menuitem', { name: 'Resume' }).should('exist')
//         cy.findByRole('menuitem', { name: 'Projects' }).should('not.exist')
//       - Right column shortcuts should remain unaffected:
//         cy.findByRole('menuitem', { name: 'GitHub' }).should('exist')
//       - Clear search and all left items return:
//         cy.findByLabelText(/search programs/i).clear()
//         cy.findByRole('menuitem', { name: 'Projects' }).should('exist')
//
//     it('dismisses the Start Menu on Escape')
//       - cy.findByRole('button', { name: 'Start' }).click()
//       - cy.findByRole('menu', { name: /start menu/i }).should('exist')
//       - cy.get('body').type('{esc}')
//       - cy.findByRole('menu', { name: /start menu/i }).should('not.exist')
//
//     it('opens Resume from the Start Menu at the correct IE route')
//       - cy.findByRole('button', { name: 'Start' }).click()
//       - cy.findByRole('menuitem', { name: 'Resume' }).click()
//       - The Start Menu should close:
//         cy.findByRole('menu', { name: /start menu/i }).should('not.exist')
//       - An IE window should open showing the resume route:
//         cy.findByTestId('managed-window-win-1').should('exist')
//         cy.contains('portfolio://resume').should('exist')
//
//     it('opens Internet Explorer from a desktop icon at about:home')
//       - cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()
//       - cy.findByTestId('managed-window-win-1').should('exist')
//       - Address bar should show 'about:home':
//         cy.contains('about:home').should('exist')
//       - The home page content should be visible:
//         cy.contains('Welcome to Internet Explorer').should('exist')
//
//     it('navigates IE via favorites bar and back/forward')
//       - Open IE: cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()
//       - Navigate to Resume via the favorites bar button:
//         cy.findByRole('toolbar', { name: 'Favorites' })
//           .findByRole('button', { name: 'Resume' })
//           .click()
//       - Address bar should update to 'portfolio://resume':
//         cy.contains('portfolio://resume').should('exist')
//       - The Back button should now be enabled:
//         cy.findByRole('toolbar', { name: 'Navigation' })
//           .findByRole('button', { name: 'Back' })
//           .should('not.be.disabled')
//       - Click Back:
//         cy.findByRole('toolbar', { name: 'Navigation' })
//           .findByRole('button', { name: 'Back' })
//           .click()
//       - Should be back at about:home:
//         cy.contains('about:home').should('exist')
//       - The Forward button should now be enabled:
//         cy.findByRole('toolbar', { name: 'Navigation' })
//           .findByRole('button', { name: 'Forward' })
//           .should('not.be.disabled')
//       - Click Forward:
//         cy.findByRole('toolbar', { name: 'Navigation' })
//           .findByRole('button', { name: 'Forward' })
//           .click()
//       - Should be at portfolio://resume again:
//         cy.contains('portfolio://resume').should('exist')
//
//     it('Sign Out from the Start Menu returns to /login')
//       - cy.findByRole('button', { name: 'Start' }).click()
//       - cy.findByRole('menuitem', { name: 'Sign Out' }).click()
//       - cy.url().should('include', '/login')
//       - The desktop should no longer be visible:
//         cy.findByRole('main', { name: /desktop/i }).should('not.exist')
```

### Step 3 — Delete the smoke test

```tsx
// TODO: [Action Required: remove the smoke test] - 2 min
//
//   The smoke test at cypress/e2e/smoke.cy.ts was scaffolding from Task 4.
//   Its two tests (Guest reaches desktop, Admin reaches desktop) are now
//   fully subsumed by the beforeEach blocks in guest-desktop.cy.ts and
//   admin-desktop.cy.ts. Delete the file:
//
//   rm cypress/e2e/smoke.cy.ts
//
//   Why delete rather than keep? Redundant tests slow the CI E2E job and
//   create false confidence — if the smoke passes but a journey spec fails,
//   the passing smoke is noise. Every assertion the smoke made is now
//   covered by stronger, more specific assertions.
```

### Step 4 — Run the E2E suite locally

```tsx
// TODO: [Action Required: run Cypress and verify all specs pass] - 10 min
//
//   1. Start the dev server in one terminal:
//      npm run dev
//
//   2. Run Cypress in headed mode to watch the tests:
//      npx cypress open
//      Select "E2E Testing" → choose a browser → run each spec file
//
//   3. Or run headlessly for CI parity:
//      npx cypress run
//
//   All three spec files should pass. If any test fails:
//   - Check that the login session commands still work (Guest cookie,
//     Admin Supabase session)
//   - Check that @testing-library/cypress methods match the component's
//     accessible names (aria-label, role, text content)
//   - For timing issues, Cypress auto-retries findBy* queries (4s default
//     timeout). If animations cause flakiness, add:
//       cy.findByTestId('managed-window-win-1', { timeout: 6000 })
//
//   4. Verify the existing CI workflow will pick up the new specs.
//     The ci.yml cypress job uses `cypress-io/github-action@v6` with
//     no specPattern override — it defaults to cypress/e2e/**/*.cy.{ts,js},
//     so new specs are automatically included.
```

### Step 5 — Verify CI compatibility

```tsx
// TODO: [Action Required: verify CI workflow covers the new specs] - 5 min
//
//   Open .github/workflows/ci.yml and confirm:
//
//   1. The cypress job's `build` and `start` commands will serve /desktop
//      and /login correctly on ubuntu-latest.
//
//   2. Environment variables are passed:
//      - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
//        NEXT_PUBLIC_GRAPHQL_URL (build + runtime)
//      - NEXT_PUBLIC_ADMIN_EMAIL (runtime, via vars not secrets)
//      - CYPRESS_ADMIN_PASSWORD (runtime, Cypress reads via cy.env)
//
//   3. No specPattern filter is needed — the default glob picks up
//      all *.cy.ts files in cypress/e2e/.
//
//   4. The cypress job `needs: quality`, ensuring lint + build + unit
//      tests pass before E2E runs. This is already configured.
//
//   No changes to ci.yml should be needed. The infrastructure from
//   Task 4 handles everything.
```

---

## File Inventory

| File                              | Type                                | New/Modified |
| --------------------------------- | ----------------------------------- | ------------ |
| `cypress/e2e/guest-desktop.cy.ts` | Guest journey E2E spec              | New          |
| `cypress/e2e/admin-desktop.cy.ts` | Admin journey E2E spec              | New          |
| `cypress/e2e/start-menu-ie.cy.ts` | Start Menu + IE navigation E2E spec | New          |
| `cypress/e2e/smoke.cy.ts`         | Scaffolding smoke test              | Deleted      |

---

## Validation Checklist

```
## Task 17 — Cypress E2E Suite Validation Checklist

| #  | Gate                                                                               | Verified by       | Status     |
| -- | ---------------------------------------------------------------------------------- | ----------------- | ---------- |
| 1  | guest-desktop.cy.ts exists with beforeEach calling cy.loginAsGuest()              | code review       | Pending |
| 2  | Guest spec verifies desktop shell renders (role="main", icon-grid, taskbar)       | code review       | Pending |
| 3  | Guest spec opens a window by double-clicking a desktop icon                       | code review       | Pending |
| 4  | Guest spec minimizes a window via title bar Minimize button                       | code review       | Pending |
| 5  | Guest spec restores a minimized window from the taskbar button                    | code review       | Pending |
| 6  | Guest spec closes a window via title bar Close button                             | code review       | Pending |
| 7  | admin-desktop.cy.ts exists with beforeEach calling cy.loginAsAdmin()              | code review       | Pending |
| 8  | Admin spec opens multiple windows and verifies z-index stacking                   | code review       | Pending |
| 9  | Admin spec maximizes and restores a window via title bar                           | code review       | Pending |
| 10 | start-menu-ie.cy.ts exists with Start Menu interaction tests                      | code review       | Pending |
| 11 | Start Menu spec opens Start Menu via the Start orb button                         | code review       | Pending |
| 12 | Start Menu spec verifies search filtering of left-column shortcuts                | code review       | Pending |
| 13 | Start Menu spec dismisses Start Menu on Escape                                    | code review       | Pending |
| 14 | Start Menu spec opens Resume from Start Menu at portfolio://resume                | code review       | Pending |
| 15 | IE spec opens Internet Explorer from desktop icon at about:home                   | code review       | Pending |
| 16 | IE spec navigates via favorites bar and verifies back/forward                     | code review       | Pending |
| 17 | Start Menu spec Sign Out returns to /login                                        | code review       | Pending |
| 18 | smoke.cy.ts is deleted (subsumed by journey specs)                                | code review       | Pending |
| 19 | All queries use @testing-library/cypress methods (findByRole, etc.)               | code review       | Pending |
| 20 | npx cypress run passes all specs locally                                          | npx cypress run   | Pending |
| 21 | CI workflow picks up new specs without config changes                              | code review       | Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **Three spec files replace the smoke scaffolding.** `guest-desktop.cy.ts` covers the
  core window lifecycle (open, minimize, restore, close). `admin-desktop.cy.ts` adds
  multi-window z-index stacking and maximize/restore. `start-menu-ie.cy.ts` covers the
  Start Menu (orb toggle, search filter, Escape dismiss, shortcut → window) and IE
  navigation (favorites bar, back/forward, address bar verification).
- **Flow C (right-click context menus) is deferred.** The `Menu` primitive exists but no
  desktop or icon context menu is wired in the Phase 2 task list. Testing non-existent
  UI is not possible; this is tracked for a future phase.
- **Selector strategy mirrors RTL.** `@testing-library/cypress` provides `findByRole`,
  `findByText`, `findByLabelText`, and `findByTestId` — same accessible queries used
  in the unit tests. No CSS selectors or `cy.get('.className')`.
- **Icon drag is not tested in Cypress.** `@dnd-kit`'s sensor activation model does not
  reliably respond to Cypress's synthetic `trigger()` events. Icon drag is fully covered
  by RTL tests in Task 7; duplicating it in E2E adds fragility without coverage gain.
- **Interview probe:** "Why test z-index stacking in E2E when the reducer is unit-tested?"
  — The reducer test verifies `zCounter` increments correctly in isolation. The E2E test
  verifies the full roundtrip: `pointerdown` → `focusWindow` dispatch → Redux state update
  → React re-render → `style.zIndex` reflects on the DOM element. Each layer could break
  independently; E2E catches integration failures between them.
