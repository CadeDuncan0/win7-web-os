'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

import { debug } from '@/lib/debug'

const GET_PROJECTS = gql`
  query GetAllProjects {
    projectsCollection {
      edges {
        node {
          id
          title
          visibility
        }
      }
    }
  }
`

export default function Home() {
  const { data, loading, error } = useQuery(GET_PROJECTS)

  // TODO: Using what you know about the debug utility, log all three
  // response values (data, loading, error) at this checkpoint with
  // an appropriate namespace label. Then explain in a comment above
  // the debug call why logging 'loading' alongside data and error
  // is more useful here than logging data and error alone.

  // logging loading is useful in order to see the data and error objects at every loading status
  // if an error is thrown while the client is loading, it is useful to know for bug-fixing purposes.
  // Having an identifiable timestamp of when the error may have occured is extremely useful information.
  debug.log('page.tsx:Home testing ApolloClient', { data, loading, error })

  if (loading) {
    return <p>Loading...</p>
  }
  if (error) {
    return <p>Error: {error.message}</p>
  }

  return (
    <main>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
