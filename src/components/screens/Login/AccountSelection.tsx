'use client'

import Image from 'next/image'

import { OsBranding } from '@/components/windows7/OsBranding'
import { ShutdownGroup } from '@/components/windows7/ShutdownGroup'

export type AccountId = 'guest' | 'admin'

export interface Account {
  id: AccountId
  label: string
  avatarSrc: string
}

interface AccountSelectionProps {
  accounts: readonly Account[]
  currentId: AccountId
  onSwitch: () => void
  onSelect: (id: AccountId) => void
  disabled?: boolean
}

/* Login → Accounts Selection screen
   Mirrors the .logon__pane layout from
   public/copycats/accountselection/Win7 Simu _ A simulator of Windows 7.htm:

     avatar-button.can-click  (click to log in as this account)
     logon__name              (font-bold text-3xl, "Guest" / "Admin")
     logon__form
       logon__form-button.is-switch  ("Switch User" — cycles to next)

   Single-account-at-a-time view: clicking Switch User cycles to the
   next account so the avatar tile + name swap in place. */
export function AccountSelection({
  accounts,
  currentId,
  onSwitch,
  onSelect,
  disabled,
}: AccountSelectionProps) {
  const current = accounts.find((a) => a.id === currentId) ?? accounts[0]

  return (
    <div className="logon__main">
      <main>
        <section className="logon__pane">
          <button
            type="button"
            className="avatar-button can-click"
            onClick={() => onSelect(current.id)}
            disabled={disabled}
            aria-label={`Log in as ${current.label}`}
          >
            <span className="avatar-mask">
              <Image
                src={current.avatarSrc}
                alt=""
                width={98}
                height={98}
                unoptimized
                className="avatar-image"
              />
            </span>
          </button>

          <div className="logon__name">{current.label}</div>

          {accounts.length > 1 && (
            <div className="logon__form">
              <button
                type="button"
                className="logon__form-button"
                onClick={onSwitch}
                disabled={disabled}
              >
                Switch user
              </button>
            </div>
          )}
        </section>
      </main>
      <OsBranding />
      <ShutdownGroup />
    </div>
  )
}
