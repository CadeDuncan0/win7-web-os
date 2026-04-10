import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'

// --- HTTP Link ---
// Defines the GraphQL endpoint all queries are sent to.
// This is the only place the endpoint URL exists in application code.
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
})

// --- Auth Link ---
// Intercepts every outgoing request and injects Supabase authentication
// headers before forwarding to the HTTP link.
// The second argument destructures the existing headers so they are
// preserved — never replace, always extend.
const authLink = new SetContextLink((prevContext, _) => {
  return {
    headers: {
      ...prevContext.headers,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  }
})

// --- Client ---
// authLink.concat(httpLink) composes the chain:
// every request passes through authLink first, then httpLink.
// InMemoryCache is Apollo's normalized client-side cache.
const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first', // using cache-first since GraphQL data will change extremely infrequently
    },
  },
})

export default apolloClient
