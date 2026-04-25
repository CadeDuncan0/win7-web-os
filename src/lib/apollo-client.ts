import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'

import { store } from '@/store'
import { selectJwt } from '@/store/slices/sessionSlice'

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
})

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const authLink = new SetContextLink((prevContext, _) => {
  const state = store.getState()
  const jwt = selectJwt(state)

  const authValue = jwt ?? ANON_KEY

  return {
    headers: {
      ...prevContext.headers,
      apikey: ANON_KEY,
      Authorization: `Bearer ${authValue}`,
    },
  }
})

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
  },
})

export default apolloClient
