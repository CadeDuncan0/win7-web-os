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

# Final Solution

# Sources

- All `accountIconBorderOutlineShaded` images in `public/imgs/windows7/assets`
