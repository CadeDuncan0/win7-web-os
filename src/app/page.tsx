import { debug } from '@/lib/debug'
import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) {
    debug.error(error)
  }

  debug.log('Supabase connection test:', data)
  return (
    <main>
      <h1>Connection test — check browser console</h1>
    </main>
  )
}
