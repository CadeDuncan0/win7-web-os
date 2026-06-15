**Status:** Complete
**Completed:** 2026-06-15

# Description

The account icon on the logon page has a passable but inaccurate implementation for the outline which appears when an account is selected. Users will only see this outline for a moment unless holding their click (marking the account as selected but not firing the click event). This issue is visual not functional.

# Requirement

The AccountIcon outline must be more dynamic against the wallpaper, and appear more 'inset'.

# Brain Storm

- Determine if a dynamic solution is possible, or if svgs are the most flexible solution.

- May not be possible provided DOM rendering restrictions. The best solution for the first deployment may be to create two specific outlines: 1 for the Guest account and 1 for the Admin account.

# Attempts

### Pure HTML & CSS (FAILED)

#### PROS

- Outlines are able to achieve the inset look

#### CONS

- The precise shape is incapable of being rendered through only HTML and CSS styling
- Outlines cannot be multi-color and border the outline
  - EX: top layer: 1px medium lightblue, middle layer: 1px black, bottom layer: 1px strong lightblue

### SVG (PARTIAL SUCCESS)

#### PROS

- The precise shape is captured
- The outline can be multi-color and have a border

#### CONS

- The output is static, different locations produce different visuals against the wallpaper
- The rendered output doesn't look flush with the wallpaper
- Adding more accounts requires creating location-specific outlines and adjusting previous outlines provided their new locations

### Dynamic Inline SVG (PARTIAL SUCCESS)

#### PROS

- Most accurate representation yet
- Each ring is easily adjusted via CSS
- The glow produces the best "inset" outline visual yet

#### CONS

- Colors are hard-coded
- The light ring is more difficult to identify against lighter sections of the wallpaper
- The glow is more difficult to identify against ligher sections of the wallpaper

# Final Solution

**Approach: dynamic inline SVG outline — one dark ring with an inner glow (no per-account assets).**

Render the selection outline as a live inline SVG (reusing the existing precise rounded-square
`pathD`/`viewBox`). A single crisp dark ring (color sampled from
`accountIconBorderOutlineShaded_layer{1,2,3}.png`) sits over a soft light glow clipped to the path
interior. Because it is drawn live, it blends against any wallpaper at any on-screen position — no
baked per-account images, and it scales to any number of accounts.

Composition (all colors/opacity/blur are `--avatar-outline-*` tokens in `globals.css`, referenced
from `AccountIcon.module.css`):

- **Dark ring** — a single thin `<use>` of the shared path (`rgb(3 24 37)`), the one crisp line.
- **Inner glow** — a blurred light-blue `<use>` wrapped in a `<g clip-path>` of the same path
  (fill region = interior) so the blur falls _inward_ only → the inset effect.

Why this is the most accurate yet: the inner glow supplies the authentic inset depth, while the thin
near-black ring stays legible against any wallpaper (it does not wash out the way a light ring did).
This is the chosen treatment for the first production deployment.

# Sources

- All `accountIconBorderOutlineShaded` images in `public/imgs/windows7/assets`
