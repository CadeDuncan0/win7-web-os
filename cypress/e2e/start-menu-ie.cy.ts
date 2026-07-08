describe('Start Menu + IE Navigation', () => {
  beforeEach(() => {
    cy.loginAsGuest()
    cy.visit('/win7/desktop')
  })

  it('opens the Start Menu via the Start orb', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menu', { name: /start menu/i }).should('exist')

    cy.findByRole('menuitem', { name: 'Internet Explorer' }).should('exist')
    cy.findByRole('menuitem', { name: 'Getting Started' }).should('exist')
    cy.findByRole('menuitem', { name: 'GitHub' }).should('exist')
    cy.findByRole('menuitem', { name: 'LinkedIn' }).should('exist')
    cy.findByRole('menuitem', { name: 'Source Code' }).should('exist')
    cy.findByRole('menuitem', { name: 'Sign Out' }).should('exist')
  })

  it('filters shortcuts with the search box', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByLabelText(/search programs/i).should('exist')

    cy.findByLabelText(/search programs/i).type('gett')

    cy.findByRole('menuitem', { name: 'Getting Started' }).should('exist')
    cy.findByRole('menuitem', { name: 'Internet Explorer' }).should('not.exist')

    cy.findByRole('menuitem', { name: 'GitHub' }).should('exist')

    cy.findByLabelText(/search programs/i).clear()
    cy.findByRole('menuitem', { name: 'Internet Explorer' }).should('exist')
  })

  it('dismisses the Start Menu on Escape', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menu', { name: /start menu/i }).should('exist')

    cy.get('body').type('{esc}')

    cy.findByRole('menu', { name: /start menu/i }).should('not.exist')
  })

  it('opens Getting Started from the Start Menu at the correct IE route', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menuitem', { name: 'Getting Started' }).click()

    cy.findByRole('menu', { name: /start menu/i }).should('not.exist')

    cy.findByTestId('managed-window-win-1').should('exist')
    cy.findByRole('combobox', { name: /address/i }).should(
      'have.value',
      'https://www.example.com/getting-started'
    )
  })

  it('opens Internet Explorer from a desktop icon at about:home', () => {
    cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()

    cy.findByTestId('managed-window-win-1').should('exist')
    cy.findByRole('combobox', { name: /address/i }).should(
      'have.value',
      'https://www.example.com/home'
    )
    cy.contains('Welcome to Internet Explorer').should('exist')
  })

  it('navigates IE via page links and back/forward', () => {
    cy.findByRole('button', { name: 'Internet Explorer' }).dblclick()

    cy.findByRole('navigation', { name: 'Pages' })
      .findByRole('button', { name: 'Getting Started' })
      .click()

    cy.findByRole('combobox', { name: /address/i }).should(
      'have.value',
      'https://www.example.com/getting-started'
    )

    cy.findByRole('toolbar', { name: 'Navigation' })
      .findByRole('button', { name: 'Back' })
      .should('not.be.disabled')

    cy.findByRole('toolbar', { name: 'Navigation' }).findByRole('button', { name: 'Back' }).click()

    cy.findByRole('combobox', { name: /address/i }).should(
      'have.value',
      'https://www.example.com/home'
    )

    cy.findByRole('toolbar', { name: 'Navigation' })
      .findByRole('button', { name: 'Forward' })
      .should('not.be.disabled')

    cy.findByRole('toolbar', { name: 'Navigation' })
      .findByRole('button', { name: 'Forward' })
      .click()

    cy.findByRole('combobox', { name: /address/i }).should(
      'have.value',
      'https://www.example.com/getting-started'
    )
  })

  it('Sign Out from the Start Menu returns to the logon screen', () => {
    cy.findByRole('button', { name: 'Start' }).click()
    cy.findByRole('menuitem', { name: 'Sign Out' }).click()

    cy.url().should('match', /\/win7\/?$/)
    cy.findByRole('main', { name: /desktop/i }).should('not.exist')
  })
})
