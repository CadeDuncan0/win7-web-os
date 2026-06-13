describe('Guest Desktop Journey', () => {
  beforeEach(() => {
    cy.loginAsGuest()
    cy.visit('/desktop')
  })

  it('renders the desktop shell with icons and taskbar', () => {
    cy.findByRole('main', { name: /desktop/i }).should('exist')
    cy.findByTestId('icon-grid').should('exist')
    cy.findByRole('navigation', { name: /taskbar/i }).should('exist')

    cy.findByRole('button', { name: 'Internet Explorer' }).should('exist')
    cy.findByRole('button', { name: 'Resume' }).should('exist')
    cy.findByRole('button', { name: 'Projects' }).should('exist')
    cy.findByRole('button', { name: 'Welcome' }).should('exist')
    cy.findByRole('button', { name: 'About This PC' }).should('exist')
  })

  it('opens a window by double-clicking a desktop icon', () => {
    cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()
    cy.findByTestId('managed-window-win-1').should('exist')

    cy.findByRole('navigation', { name: /taskbar/i })
      .findByRole('button', { name: 'Internet Explorer' })
      .should('exist')
  })

  it('minimizes a window via the title bar and restores from the taskbar', () => {
    cy.findByRole('button', { name: 'Welcome' }).dblclick()
    cy.findByTestId('managed-window-win-1').should('exist')

    cy.findByTestId('managed-window-win-1').findByRole('button', { name: 'Minimize' }).click()

    cy.findByTestId('managed-window-win-1').should('not.exist')

    cy.findByRole('navigation', { name: /taskbar/i })
      .findByRole('button', { name: 'Welcome' })
      .should('exist')

    cy.findByRole('navigation', { name: /taskbar/i })
      .findByRole('button', { name: 'Welcome' })
      .click()

    cy.findByTestId('managed-window-win-1').should('exist')
  })

  it('closes a window via the title bar Close button', () => {
    cy.findByRole('button', { name: 'Welcome' }).dblclick()
    cy.findByTestId('managed-window-win-1').should('exist')

    cy.findByTestId('managed-window-win-1').findByRole('button', { name: 'Close' }).click()

    cy.findByTestId('managed-window-win-1').should('not.exist')
    cy.findByRole('navigation', { name: /taskbar/i })
      .findByRole('button', { name: 'Welcome' })
      .should('not.exist')
  })
})
