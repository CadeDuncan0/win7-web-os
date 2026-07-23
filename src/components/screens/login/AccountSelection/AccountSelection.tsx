'use client'

import login from '../Login.module.css'
import styles from './AccountSelection.module.css'
import { AccountIcon } from '@/components/ui/AccountIcon'
import { OsBranding } from '@/components/ui/OsBranding'

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

export function AccountSelection({ accounts, onSelect }: AccountSelectionProps) {
  return (
    <div className={login.main}>
      <main>
        <section className={styles.pane}>
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
