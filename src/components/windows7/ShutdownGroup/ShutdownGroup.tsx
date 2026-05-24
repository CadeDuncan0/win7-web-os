'use client'

/* ShutdownGroup — bottom-right power control from the lockscreen.
   Mirrors .shutdown-group from
   public/copycats/signin/signin.htm. The copycat renders a power button
   plus a caret-style dropdown listing Restart / Shut down. The portfolio
   does not actually power-off, so the dropdown is purely visual — the
   onShutdown callback is invoked for either control. */
interface ShutdownGroupProps {
  onShutdown?: () => void
}

export function ShutdownGroup({ onShutdown }: ShutdownGroupProps) {
  return (
    <div className="shutdown-group">
      <button
        type="button"
        aria-label="Shut down"
        className="shutdown-button logon__form-button"
        onClick={onShutdown}
      >
        <PowerIcon />
      </button>
      <button
        type="button"
        aria-label="Power options"
        className="shutdown-dropdown logon__form-button"
        onClick={onShutdown}
      >
        <CaretIcon />
      </button>
    </div>
  )
}

function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.5v6M4.5 4a5 5 0 1 0 7 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CaretIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <polyline
        points="2,4 5,7 8,4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
