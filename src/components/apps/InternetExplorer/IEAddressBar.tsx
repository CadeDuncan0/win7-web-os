'use client'

import { useId, useRef, useState } from 'react'

import styles from './IEToolbar.module.css'
import {
  filterPages,
  IE_ENABLED_PAGES,
  inputToRoute,
  pageUrl,
  resolvePage,
} from '@/config/ieRoutes'
import { assetPaths, withBasePath } from '@/lib/assetPaths'

interface IEAddressBarProps {
  /** Nickname of the current page (history-stack value). */
  currentUrl: string
  onOpentab: (nickname: string) => void
  onNavigate: (nickname: string) => void
  onRefresh: () => void
}

/**
 * Editable, typing-allowed address bar with an autocomplete dropdown of the
 * project's pages. Resting state shows the current page's full URL; focusing
 * selects it and opens the full page list; typing filters that list; choosing a
 * result (or pressing Enter on a match) navigates. The Clear button empties the
 * field and re-opens the list — same as clicking into an empty address bar.
 */
export function IEAddressBar({ currentUrl, onOpentab, onNavigate, onRefresh }: IEAddressBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  // Set when Clear programmatically focuses the input, so the resulting focus
  // event doesn't re-seed the field with the current URL.
  const pendingClear = useRef(false)

  // `editing` toggles the combobox open; `query` is the typed text; `dirty`
  // distinguishes "just focused, untouched" (show every page) from "typed"
  // (filter). Resting (not editing) shows the current page URL.
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [dirty, setDirty] = useState(false)

  const displayUrl = pageUrl(currentUrl)
  const inputValue = editing ? query : displayUrl
  const results = dirty ? filterPages(query) : IE_ENABLED_PAGES

  function openWithSelection() {
    if (pendingClear.current) {
      pendingClear.current = false
      return
    }
    setEditing(true)
    setDirty(false)
    setQuery(displayUrl)
    // Defer so the value is committed before selecting it.
    requestAnimationFrame(() => inputRef.current?.select())
  }

  // Redirect entries hand off to onOpentab (new browser tab + in-app redirect
  // page); everything else is a normal in-app navigation.
  function commit(nickname: string) {
    if (resolvePage(nickname)?.redirect) {
      onOpentab(nickname)
    } else {
      onNavigate(nickname)
    }
    setEditing(false)
    setDirty(false)
    inputRef.current?.blur()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setDirty(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const nickname = inputToRoute(query)
      if (nickname) {
        commit(nickname)
      }
    } else if (e.key === 'Escape') {
      setEditing(false)
      setDirty(false)
      inputRef.current?.blur()
    }
  }

  function handleClear() {
    pendingClear.current = true
    setEditing(true)
    setQuery('')
    setDirty(true)
    inputRef.current?.focus()
    // If the input was already focused, no focus event fires to consume the
    // guard — drop it after this tick so the next real focus opens normally.
    requestAnimationFrame(() => {
      pendingClear.current = false
    })
  }

  // Close only when focus leaves the address bar entirely (so Tab into the
  // refresh/clear buttons doesn't collapse the suggestions).
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setEditing(false)
      setDirty(false)
    }
  }

  return (
    <div className={styles.addressBar} onBlur={handleBlur}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.favicon}
        src={withBasePath(assetPaths.desktopIcons.internetExplorer)}
        alt=""
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        className={styles.addressInput}
        type="text"
        value={inputValue}
        role="combobox"
        aria-label="Address and search"
        aria-expanded={editing}
        aria-controls={listboxId}
        aria-autocomplete="list"
        spellCheck={false}
        onClick={openWithSelection}
        onFocus={openWithSelection}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <button
        className={styles.refreshBtn}
        onClick={onRefresh}
        aria-label="Refresh"
        title="Refresh"
        type="button"
      >
        <RefreshIcon />
      </button>

      <button
        className={styles.clearBtn}
        onClick={handleClear}
        aria-label="Clear"
        title="Clear"
        type="button"
      >
        <ClearIcon />
      </button>

      {editing && (
        <ul
          className={styles.dropdown}
          id={listboxId}
          role="listbox"
          aria-label="Address suggestions"
        >
          {results.length === 0 ? (
            <li className={styles.dropdownEmpty}>No matching pages</li>
          ) : (
            results.map((page) => (
              <li
                key={page.nickname}
                className={styles.dropdownItem}
                role="option"
                aria-selected={page.nickname === currentUrl}
                // mousedown (not click) fires before the input's blur and is
                // preventDefault-ed so focus stays put; commit() then navigates
                // and closes the list.
                onMouseDown={(e) => {
                  e.preventDefault()
                  commit(page.nickname)
                }}
              >
                <span className={styles.dropdownTitle}>{page.title}</span>
                <span className={styles.dropdownUrl}>{page.url}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

/* Both glyphs copy the internet-explorer-{refresh,clear}.png reference bitmaps,
   which bake a thin white outline into the icon. Each shape is drawn twice: a
   wider white underlay (the halo) with the colored shape layered on top.
   Gradient ids go through useId so two IE windows never collide. */

/** IE7 refresh: teal→blue arrow arcing over the top-left with a down-pointing
 *  head, and a blue up-arrow whose tail hooks dark under the bottom-right. */
function RefreshIcon() {
  const ARROW =
    'M 5.51 49.00 C 2.00 49.08 4.22 49.18 3.70 49.50 C 3.18 49.83 2.65 50.40 2.37 50.95 C 2.09 51.51 1.96 52.21 2.02 52.82 C 2.09 53.44 -2.33 48.68 2.75 54.65 C 7.83 60.63 27.16 82.81 32.50 88.65 C 37.83 94.49 33.99 89.64 34.77 89.70 C 35.55 89.75 31.76 94.77 37.16 88.96 C 42.55 83.14 62.00 60.74 67.12 54.80 C 72.25 48.87 67.85 54.04 67.89 53.33 C 67.94 52.62 67.88 51.27 67.40 50.55 C 66.92 49.84 69.46 49.31 65.02 49.04 C 60.59 48.77 45.00 49.10 40.81 48.93 C 36.62 48.77 40.16 48.80 39.86 48.07 C 39.56 47.34 39.19 46.67 39.02 44.57 C 38.85 42.48 38.44 38.45 38.82 35.48 C 39.21 32.50 40.48 28.96 41.35 26.73 C 42.21 24.50 42.96 23.58 44.02 22.08 C 45.08 20.58 46.36 19.05 47.71 17.74 C 49.06 16.42 50.48 15.28 52.12 14.19 C 53.76 13.10 56.38 11.96 57.57 11.19 C 58.75 10.41 58.79 10.11 59.21 9.52 C 59.63 8.92 59.91 8.29 60.09 7.61 C 60.28 6.93 60.36 6.12 60.31 5.42 C 60.27 4.72 60.12 4.05 59.84 3.40 C 59.57 2.75 59.21 2.10 58.68 1.54 C 58.15 0.97 57.40 0.37 56.65 0.01 C 55.90 -0.35 54.98 -0.57 54.17 -0.62 C 53.37 -0.68 52.72 -0.60 51.82 -0.32 C 50.93 -0.03 50.72 -0.12 48.78 1.09 C 46.85 2.30 42.79 4.71 40.21 6.97 C 37.64 9.23 35.18 12.13 33.34 14.67 C 31.49 17.21 30.26 19.64 29.13 22.20 C 28.01 24.76 27.18 27.47 26.59 30.03 C 26.01 32.60 25.65 34.68 25.61 37.58 C 25.56 40.49 26.28 45.61 26.31 47.45 C 26.35 49.29 26.07 48.36 25.81 48.62 C 25.56 48.88 28.16 48.94 24.77 49.00 C 21.39 49.06 9.02 48.92 5.51 49.00 Z'
  return (
    <svg
      width="16"
      height="16"
      viewBox="-4 -4 148 138"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      role="img"
      aria-label="Refresh"
    >
      <defs>
        <linearGradient id="refreshIconFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6AAEBB" />
          <stop offset="0.45" stopColor="#4776B2" />
          <stop offset="1" stopColor="#26383F" />
        </linearGradient>
      </defs>

      {/* Each arrow is one closed path, so the white outline hugs the
          union silhouette instead of showing an internal seam. */}
      <g
        fill="url(#refreshIconFill)"
        stroke="#FFFFFF"
        strokeWidth="20"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        paintOrder="stroke fill"
      >
        <path d={ARROW} />
        <path d={ARROW} transform="rotate(180 70 65)" />
      </g>
    </svg>
  )
}

/** IE7 clear: thick rounded red X, salmon at the top fading to maroon. */
function ClearIcon() {
  const CROSS =
    'M 2.20 -0.90 C -0.13 -0.78 0.73 -0.62 0.22 -0.18 C -0.29 0.26 -0.68 -0.68 -0.86 1.72 C -1.05 4.12 -0.97 11.88 -0.90 14.21 C -0.83 16.54 -6.06 9.88 -0.45 15.69 C 5.17 21.50 27.18 43.34 32.79 49.05 C 38.40 54.77 33.20 49.68 33.20 50.00 C 33.20 50.32 38.39 45.24 32.79 50.95 C 27.19 56.65 5.22 78.41 -0.39 84.22 C -6.00 90.02 -0.81 83.52 -0.90 85.79 C -0.98 88.06 -1.05 95.46 -0.90 97.82 C -0.75 100.19 -0.50 99.46 -0.01 99.98 C 0.49 100.49 -0.30 100.74 2.07 100.90 C 4.44 101.05 11.92 100.98 14.21 100.90 C 16.49 100.81 9.98 106.00 15.78 100.39 C 21.59 94.78 43.35 72.81 49.05 67.21 C 54.76 61.61 49.68 66.80 50.00 66.80 C 50.32 66.80 45.24 61.61 50.95 67.21 C 56.65 72.81 78.41 94.78 84.22 100.39 C 90.02 106.00 83.52 100.81 85.79 100.90 C 88.06 100.98 95.46 101.05 97.82 100.90 C 100.19 100.75 99.46 100.50 99.98 100.01 C 100.49 99.51 100.74 100.30 100.90 97.93 C 101.05 95.56 100.98 88.08 100.90 85.79 C 100.81 83.51 106.00 90.02 100.39 84.22 C 94.78 78.41 72.81 56.65 67.21 50.95 C 61.61 45.24 66.80 50.32 66.80 50.00 C 66.80 49.68 61.61 54.76 67.21 49.05 C 72.81 43.35 94.78 21.59 100.39 15.78 C 106.00 9.98 100.81 16.48 100.90 14.21 C 100.98 11.94 101.05 4.54 100.90 2.18 C 100.75 -0.19 100.50 0.54 100.01 0.02 C 99.51 -0.49 100.30 -0.74 97.93 -0.90 C 95.56 -1.05 88.08 -0.98 85.79 -0.90 C 83.51 -0.81 90.02 -6.00 84.22 -0.39 C 78.41 5.22 56.65 27.19 50.95 32.79 C 45.24 38.39 50.32 33.20 50.00 33.20 C 49.68 33.20 54.74 38.37 49.05 32.79 C 43.37 27.21 21.72 5.31 15.91 -0.30 C 10.10 -5.92 16.49 -0.80 14.21 -0.90 C 11.92 -1.00 4.53 -1.02 2.20 -0.90 Z'
  return (
    <svg
      width="12"
      height="12"
      viewBox="-4 -4 108 108"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
      role="img"
      aria-label="Close"
    >
      <defs>
        <linearGradient id="crossIconFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C6A5A7" />
          <stop offset="0.45" stopColor="#e88782" />
          <stop offset="0.75" stopColor="#b85c58" />
          <stop offset="1" stopColor="#8e4e40" />
        </linearGradient>
      </defs>

      {/* The two bars are unioned into one closed path, so the white
          outline traces the silhouette with no seam at the crossing. */}
      <path
        d={CROSS}
        fill="url(#crossIconFill)"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        paintOrder="stroke fill"
      />
    </svg>
  )
}
