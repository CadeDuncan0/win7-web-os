declare global {
  namespace Cypress {
    interface Chainable {
      loginAsGuest(): Chainable<void>
      loginAsAdmin(): Chainable<void>
    }
  }
}

export {}
