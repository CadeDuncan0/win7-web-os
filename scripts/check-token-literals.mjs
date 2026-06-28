// Guards the design-token contract for component CSS Modules.
//
// CLAUDE.md bans hardcoded colors/gradients in *.module.css — every color lives
// in globals.css as a `--w7-*` / project custom property, and modules reference
// it via var(...). This script scans each tracked *.module.css for raw color
// literals (hex, rgb()/rgba(), hsl()/hsla()) and fails on any. globals.css —
// where the tokens are DEFINED — is intentionally not a module and not scanned.
//
// Scope is colors/gradients: the clearest, most common "magic value" and the
// only literal category currently present. Literal lengths (radius / shadow
// offsets) are out of scope by present convention; tighten here if that changes.
//
// Wired to `npm run check:tokens`.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = fs.realpathSync.native(process.cwd())

const moduleCssFiles = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter((file) => file.endsWith('.module.css'))

// Raw color literals that must instead be var(--…) tokens. `var(` and the
// CSS-wide keywords (transparent / currentColor / inherit) never match these.
const COLOR_LITERAL_PATTERNS = [
  { name: 'hex color', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'rgb()/rgba()', re: /\brgba?\(/ },
  { name: 'hsl()/hsla()', re: /\bhsla?\(/ },
]

// Blank out /* … */ comments (including multiline) while preserving newlines, so
// colors mentioned in prose are ignored and reported line numbers stay accurate.
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
}

const violations = []

for (const file of moduleCssFiles) {
  const absolute = path.join(repoRoot, file)
  const source = stripComments(fs.readFileSync(absolute, 'utf8'))
  source.split('\n').forEach((line, index) => {
    for (const { name, re } of COLOR_LITERAL_PATTERNS) {
      if (re.test(line)) {
        violations.push(`  ${file}:${index + 1}  (${name})  ${line.trim()}`)
        break
      }
    }
  })
}

if (violations.length > 0) {
  console.error('Raw color literals found in CSS Modules. Define the value as a')
  console.error('custom property in globals.css and reference it via var(--…)')
  console.error('(see CLAUDE.md → Design Token Constraints).\n')
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log(`token audit clean — ${moduleCssFiles.length} module stylesheet(s) scanned`)
