describe('Start Menu + IE Navigation', () => {
  beforeEach(() => {
    cy.loginAsGuest()
    cy.visit('/desktop')
  })

  it('opens the Start Menu via the Start orb', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menu', { name: /start menu/i }).should('exist')

    cy.findByRole('menuitem', { name: 'Resume' }).should('exist')
    cy.findByRole('menuitem', { name: 'Projects' }).should('exist')
    cy.findByRole('menuitem', { name: 'GitHub' }).should('exist')
    cy.findByRole('menuitem', { name: 'LinkedIn' }).should('exist')
    cy.findByRole('menuitem', { name: 'Source Code' }).should('exist')
    cy.findByRole('menuitem', { name: 'Sign Out' }).should('exist')
  })

  it('filters shortcuts with the search box', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByLabelText(/search programs/i).should('exist')

    cy.findByLabelText(/search programs/i).type('res')

    cy.findByRole('menuitem', { name: 'Resume' }).should('exist')
    cy.findByRole('menuitem', { name: 'Projects' }).should('not.exist')

    cy.findByRole('menuitem', { name: 'GitHub' }).should('exist')

    cy.findByLabelText(/search programs/i).clear()
    cy.findByRole('menuitem', { name: 'Projects' }).should('exist')
  })

  it('dismisses the Start Menu on Escape', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menu', { name: /start menu/i }).should('exist')

    cy.get('body').type('{esc}')

    cy.findByRole('menu', { name: /start menu/i }).should('not.exist')
  })

  it('opens Resume from the Start Menu at the correct IE route', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menuitem', { name: 'Resume' }).click()

    cy.findByRole('menu', { name: /start menu/i }).should('not.exist')

    cy.findByTestId('managed-window-win-1').should('exist')
    cy.contains('portfolio://resume').should('exist')
  })

  it('opens Internet Explorer from a desktop icon at about:home', () => {
    cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()

    cy.findByTestId('managed-window-win-1').should('exist')
    cy.contains('about:home').should('exist')
    cy.contains('Welcome to Internet Explorer').should('exist')
  })

  it('navigates IE via favorites bar and back/forward', () => {
    cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()

    cy.findByRole('toolbar', { name: 'Favorites' }).findByRole('button', { name: 'Resume' }).click()

    cy.contains('portfolio://resume').should('exist')

    cy.findByRole('toolbar', { name: 'Navigation' })
      .findByRole('button', { name: 'Back' })
      .should('not.be.disabled')

    cy.findByRole('toolbar', { name: 'Navigation' }).findByRole('button', { name: 'Back' }).click()

    cy.contains('about:home').should('exist')

    cy.findByRole('toolbar', { name: 'Navigation' })
      .findByRole('button', { name: 'Forward' })
      .should('not.be.disabled')

    cy.findByRole('toolbar', { name: 'Navigation' })
      .findByRole('button', { name: 'Forward' })
      .click()

    cy.contains('portfolio://resume').should('exist')
  })

  it('Sign Out from the Start Menu returns to /login', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menuitem', { name: 'Sign Out' }).click()

    cy.url().should('include', '/login')
    cy.findByRole('main', { name: /desktop/i }).should('not.exist')
  })
})
