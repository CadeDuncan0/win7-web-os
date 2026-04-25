'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

import { signInAsAdmin, signOut } from '@/lib/auth'
import { debug } from '@/lib/debug'
import { useAppDispatch } from '@/store/hooks'
import { setSession, clearSession } from '@/store/slices/sessionSlice'

export default function Home() {
  const dispatch = useAppDispatch()

  const TEST_QUERY = gql`
    query Get_Projects {
      projectsCollection(first: 1) {
        edges {
          node {
            title
          }
        }
      }
    }
  `
  const { loading, error, data } = useQuery(TEST_QUERY, { fetchPolicy: 'network-only' })

  debug.log('Pages.tsx:useQuery', { loading, error, data })

  // ── TEMPORARY: remove after Step 3 verification ──────────────────────────
  const goGuest = () => dispatch(setSession({ role: 'guest', jwt: null, startedAt: Date.now() }))

  const goAdmin = async () => {
    const password = prompt('Admin password')
    if (password) {
      await signInAsAdmin(password)
    }
  }

  const goSignOut = async () => {
    await signOut()
    dispatch(clearSession())
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main>
      <h1>Portfolio Website - Windows 7</h1>

      {/* TEMPORARY: remove after Step 3 verification */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button onClick={goGuest}>→ Guest</button>
        <button onClick={goAdmin}>→ Admin</button>
        <button onClick={goSignOut}>→ Sign Out</button>
      </div>
    </main>
  )
}
