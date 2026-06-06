Cypress.Commands.add('loginAsGuest', () => {
  cy.session(
    'guest',
    () => {
      cy.visit('/login')
      cy.findByText(/^guest$/i)
        .parent()
        .findByRole('button')
        .click()
      cy.url().should('include', '/desktop')
    },
    {
      validate() {
        cy.getCookie('portfolio.guest').should('exist')
      },
    }
  )
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.session(
    'admin',
    () => {
      cy.visit('/login')
      cy.findByText(/^admin$/i)
        .parent()
        .findByRole('button')
        .click()
      cy.findByLabelText(/password/i).type(Cypress.env('ADMIN_PASSWORD'))
      cy.findByRole('button', { name: /sign in/i }).click()
      cy.url().should('include', '/desktop')
    },
    {
      validate() {
        cy.getCookies().then((cookies) => {
          const hasAuth = cookies.some((c) => c.name.startsWith('sb-'))
          expect(hasAuth).to.equal(true)
        })
      },
    }
  )
})
