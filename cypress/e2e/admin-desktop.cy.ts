describe('Admin Desktop Journey', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/desktop')
  })

  it('renders the desktop for Admin', () => {
    cy.findByRole('main', { name: /desktop/i }).should('exist')
    cy.findByRole('navigation', { name: /taskbar/i }).should('exist')
  })

  it('opens multiple windows and promotes z-index on focus', () => {
    cy.findByRole('button', { name: 'Welcome' }).dblclick()
    cy.findByRole('button', { name: 'About This PC' }).dblclick()

    cy.findByTestId('managed-window-win-1').should('exist')
    cy.findByTestId('managed-window-win-2').should('exist')

    cy.findByTestId('managed-window-win-2')
      .invoke('css', 'z-index')
      .then((z2) => {
        cy.findByTestId('managed-window-win-1')
          .invoke('css', 'z-index')
          .then((z1) => {
            expect(parseInt(String(z2))).to.be.greaterThan(parseInt(String(z1)))
          })
      })

    cy.findByTestId('managed-window-win-1').click()

    cy.findByTestId('managed-window-win-1')
      .invoke('css', 'z-index')
      .then((z1) => {
        cy.findByTestId('managed-window-win-2')
          .invoke('css', 'z-index')
          .then((z2) => {
            expect(parseInt(String(z1))).to.be.greaterThan(parseInt(String(z2)))
          })
      })
  })

  it('maximizes and restores a window via the title bar button', () => {
    cy.findByRole('button', { name: 'Welcome' }).dblclick()

    cy.findByTestId('managed-window-win-1').invoke('css', 'left').as('originalLeft')

    cy.findByTestId('managed-window-win-1').findByRole('button', { name: 'Maximize' }).click()

    cy.findByTestId('managed-window-win-1')
      .should('have.css', 'left', '0px')
      .and('have.css', 'top', '0px')

    cy.findByTestId('managed-window-win-1')
      .findByRole('button', { name: 'Restore' })
      .should('exist')

    cy.findByTestId('managed-window-win-1').findByRole('button', { name: 'Restore' }).click()

    cy.get('@originalLeft').then((origLeft) => {
      cy.findByTestId('managed-window-win-1').invoke('css', 'left').should('eq', origLeft)
    })
  })
})
