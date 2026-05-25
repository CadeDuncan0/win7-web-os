'use client'

import { AccountIcon } from '@/components/windows7/AccountIcon'
import { OsBranding } from '@/components/windows7/OsBranding'

export type AccountId = 'guest' | 'admin'

export interface Account {
  id: AccountId
  label: string
  avatarSrc: string
}

interface AccountSelectionProps {
  accounts: readonly Account[]
  onSelect: (id: AccountId) => void
}

/* Login → Accounts Selection screen
   Mirrors the .login__pane layout from
   public/copycats/accountselection/Win7 Simu _ A simulator of Windows 7.htm:

     avatar-button.can-click  (click to log in as this account)
     signin__name             (font-bold text-3xl, "Guest" / "Admin")
     signin__form
       signin__form-button.is-switch  ("Switch User" — cycles to next)

   Single-account-at-a-time view: clicking Switch User cycles to the
   next account so the avatar tile + name swap in place. */
export function AccountSelection({ accounts, onSelect }: AccountSelectionProps) {
  return (
    <div className="login__main">
      <main>
        <section className="login__pane">
          {accounts.map((account) => (
            <AccountIcon
              key={account.id}
              iconSrc={account.avatarSrc}
              subtitle={account.label}
              width={98}
              height={98}
              onClick={() => onSelect(account.id)}
            />
          ))}
        </section>
      </main>
      <OsBranding />
    </div>
  )
}
