## Description

This task will cover all logon page and React components. The user will manually verify that each component and page is working and visually accurately to the project vision.

## Adjustments

    - AccountIcons should be renamed to 'LogonAccount'
    - Any reference to a variable or file name 'Login' should be renamed to 'Logon'
    - SubmitButton renamed to 'LogonSubmitButton'
    - OsBranding renamed to 'LogonOsBranding'

## Sub Tasks

- Spinner should be smoother, with different timings depending on animation location
  - See https://www.youtube.com/watch?v=64A0dQUThBM

- AccountIcon outline needs to be more dynamic against the wallpaper, and appear more 'inset'.
  - Reference all `accountIconBorderOutlineShaded` images in `public/imgs/windows7/assets`
  - May want to create two different outlines for each current account in the AccountSelection page.
  - Determine if a dynamic solution is possible, or if svgs are the most flexible solution.

## Checklist

| Task | Name                   | Status          |
| ---- | ---------------------- | --------------- |
| 1    | Account Selection Page | ❌ Not Verified |
| 1.1  | Account Icon           | ❌ Not Verified |
| 2    | Sign In Page           | ✅ Not Verified |
| 2.1  | Sign In Button         | ✅ Not Verified |
| 2.2  | Password Input         | ✅ Not Verified |
| 2.3  | Switch User Button     | ✅ Not Verified |
| 2.4  | Sign In Avatar Icon    | ✅ Not Verified |
| 3    | Logo + Project Label   | ✅ Not Verified |
| 4    | Transition Page        | ❌ Not Verified |
| 4.1  | Spinner                | ❌ Not Verified |
| 4.2  | Transition Message     | ❌ Not Verified |

## Sources

    - logon screen: https://www.youtube.com/watch?v=64A0dQUThBM
