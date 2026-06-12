// Guards against git-index ↔ disk filename casing drift.
//
// On case-insensitive filesystems (Windows, macOS default) a directory can be
// renamed to a different casing without git noticing — the index keeps the old
// name, the disk has the new one, and imports written against the disk casing
// build locally but break on case-sensitive Linux (CI, Vercel). This script
// compares every tracked path against its true on-disk casing and fails on
// any mismatch. On case-sensitive filesystems it is a cheap no-op.
//
// Wired into the Husky pre-push hook; also runnable via `npm run check:casing`.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = fs.realpathSync.native(process.cwd())

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)

const mismatches = []

for (const tracked of trackedFiles) {
  const absolute = path.join(repoRoot, tracked)
  let realPath
  try {
    realPath = fs.realpathSync.native(absolute)
  } catch {
    continue // deleted from disk but still in the index — not a casing issue
  }
  const onDisk = path.relative(repoRoot, realPath).split(path.sep).join('/')
  if (onDisk !== tracked) {
    mismatches.push(`  index: ${tracked}\n  disk:  ${onDisk}`)
  }
}

if (mismatches.length > 0) {
  console.error('Filename casing mismatch between the git index and the filesystem.')
  console.error('Linux checkouts (CI, Vercel) will use the INDEX casing — fix with a')
  console.error('two-step rename: git mv <path> <tmp> && git mv <tmp> <corrected-path>\n')
  console.error(mismatches.join('\n\n'))
  process.exit(1)
}
