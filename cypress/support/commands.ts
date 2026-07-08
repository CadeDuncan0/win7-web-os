Cypress.Commands.add('loginAsGuest', () => {
  cy.session(
    'guest',
    () => {
      cy.visit('/win7')
      cy.findByText(/^guest$/i)
        .parent()
        .findByRole('button')
        .click()
      cy.url().should('include', '/win7/desktop')
    },
    {
      validate() {
        cy.getCookie('win7.guest').should('exist')
      },
    }
  )
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.session(
    'admin',
    () => {
      cy.env(['ADMIN_PASSWORD']).then(({ ADMIN_PASSWORD }) => {
        cy.visit('/win7')
        cy.findByText(/^admin$/i)
          .parent()
          .findByRole('button')
          .click()
        cy.findByLabelText(/password/i).type(ADMIN_PASSWORD)
        cy.findByRole('button', { name: /sign in/i }).click()
        cy.url().should('include', '/win7/desktop')
      })
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
