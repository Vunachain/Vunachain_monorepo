describe('Vunachain MVP E2E Workflows', () => {
  beforeEach(() => {
    // Basic setup for all tests
    cy.viewport(1280, 720);
  });

  it('verifies Vunachain branding and login redirection', () => {
    cy.visit('/login');
    cy.contains('Vunachain').should('be.visible');
    cy.get('img[alt="Vunachain Logo"]').should('be.visible');
    
    // Simulate login as CoopManager
    cy.login('CoopManager');
    cy.visit('/dashboard/coop');
    cy.url().should('include', '/dashboard/coop');
    cy.contains('Cooperative Operations').should('be.visible');
  });

  it('completes the Digital Contracting workflow: Off-taker -> Coop Manager', () => {
    // 1. Off-taker posts a Need
    cy.login('Offtaker');
    cy.intercept('POST', '**/api/v1/contracts/', {
      statusCode: 201,
      body: { id: 'test-contract-1', status: 'OPEN', crop_type: 'Coffee', quantity_required: 500 }
    }).as('createContract');

    cy.visit('/dashboard/offtaker?tab=needs');
    cy.get('input[name="crop"]').type('Coffee');
    cy.get('input[name="quantity"]').type('500');
    cy.get('button').contains('Post New Production Need').click();
    cy.wait('@createContract');
    cy.contains('Need posted successfully').should('be.visible');

    // 2. Coop Manager accepts the Contract
    cy.login('CoopManager');
    cy.intercept('GET', '**/api/v1/contracts/', {
      statusCode: 200,
      body: [{ id: 'test-contract-1', status: 'OPEN', crop_type: 'Coffee', quantity_required: 500 }]
    }).as('getContracts');
    
    cy.intercept('POST', '**/api/v1/contracts/test-contract-1/accept/', {
      statusCode: 200,
      body: { id: 'test-contract-1', status: 'ACTIVE' }
    }).as('acceptContract');

    cy.visit('/dashboard/coop?tab=contracts');
    cy.wait('@getContracts');
    cy.contains('Coffee').should('be.visible');
    cy.get('button').contains('Accept & Allocate').click();
    cy.wait('@acceptContract');
    cy.contains('Contract active').should('be.visible');
  });

  it('validates Farmer Onboarding for Field Agents', () => {
    cy.login('FieldAgent');
    cy.intercept('POST', '**/api/v1/farmers/', {
      statusCode: 201,
      body: { id: 'farmer-123', name: 'John Doe' }
    }).as('createFarmer');

    cy.visit('/dashboard/field?view=onboarding');
    cy.contains('Farmer Registration').should('be.visible');
    
    cy.get('input[placeholder="Full Name"]').type('John Doe');
    cy.get('input[placeholder="0712 XXX XXX"]').type('0712345678');
    cy.get('button').contains('Next: Plot Information').click();
    
    cy.get('input[placeholder="Plot Name (e.g. North Hill)"]').type('North Hill Plot');
    cy.get('button').contains('Capture GPS Boundary').click();
    
    cy.get('button').contains('Complete Onboarding').click();
    cy.wait('@createFarmer');
    cy.contains('Farmer onboarded successfully').should('be.visible');
  });

  it('validates Plot Verification for Agronomists', () => {
    cy.login('Agronomist');
    cy.intercept('GET', '**/api/v1/plots/', {
      statusCode: 200,
      body: [{ id: 'plot-1', name: 'West Valley', is_eudr_compliant: false, farmer: 'F-99', area_hectares: 2.5 }]
    }).as('getPlots');

    cy.intercept('POST', '**/api/v1/plots/plot-1/approve/', {
      statusCode: 200,
      body: { message: 'Plot approved', status: 'COMPLIANT' }
    }).as('approvePlot');

    cy.visit('/dashboard/agro?tab=verification');
    cy.wait('@getPlots');
    cy.contains('West Valley').should('be.visible');
    cy.get('button').contains('Approve EUDR').click();
    cy.wait('@approvePlot');
    cy.contains('All plots verified').should('be.visible');
  });

  it('verifies Case Officer market oversight dashboard', () => {
    cy.login('CaseOfficer');
    cy.visit('/dashboard/case');
    cy.contains('Vunachain Marketplace Oversight').should('be.visible');
    cy.contains('Network Health').should('be.visible');
  });
});
