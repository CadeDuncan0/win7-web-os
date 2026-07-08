'use client'

import { useId, useRef, useState } from 'react'

import { filterPages, IE_PAGES, inputToRoute, pageUrl, resolvePage } from './ieRoutes'
import styles from './IEToolbar.module.css'
import { assetPaths } from '@/lib/assetPaths'

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
  const results = dirty ? filterPages(query) : IE_PAGES

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
        src={assetPaths.desktopIcons.internetExplorer}
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
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M12.5 4.5a5.5 5.5 0 1 0 1.2 4"
          />
          <path fill="currentColor" d="M12.8 1.8l1 3.4-3.4-.6z" />
        </svg>
      </button>

      <button
        className={styles.clearBtn}
        onClick={handleClear}
        aria-label="Clear"
        title="Clear"
        type="button"
      >
        <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M4 4l8 8M12 4l-8 8"
          />
        </svg>
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
