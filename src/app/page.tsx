import { debug } from '@/lib/debug'

export default function Home() {
  debug.log('[debug] GRAPHQL_URL from container:', process.env.NEXT_PUBLIC_GRAPHQL_URL)
  return (
    <main>
      <pre>
        <h1>Portfolio Website - Windows 7 TEST</h1>
      </pre>
    </main>
  )
}
