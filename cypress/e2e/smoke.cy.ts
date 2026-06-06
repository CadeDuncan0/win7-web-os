describe('Cypress harness smoke', () => {
  it('Guest reaches the desktop via the real login flow', () => {
    cy.loginAsGuest()
    cy.visit('/desktop')
    cy.url().should('include', '/desktop')
  })
})
