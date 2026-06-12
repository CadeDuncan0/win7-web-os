import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Builds a per-request Apollo client. `getAuthToken` is injected by the
 * provider layer — it reads the Admin JWT from that request's Redux store —
 * so this module never couples to a store instance and SSR passes can't
 * share a cache or auth state across requests.
 */
export function makeApolloClient(getAuthToken: () => string | null): ApolloClient {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  })

  const authLink = new SetContextLink((prevContext) => {
    const authValue = getAuthToken() ?? ANON_KEY

    return {
      headers: {
        ...prevContext.headers,
        apikey: ANON_KEY,
        Authorization: `Bearer ${authValue}`,
      },
    }
  })

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-first',
      },
    },
  })
}
