// cypress/support/commands.ts

declare global {
  namespace Cypress {
    interface Chainable {
      login(role: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (role: string) => {
  localStorage.setItem('vunachain_role', role);
  localStorage.setItem('vunachain_token', 'mock-token');
  localStorage.setItem('vunachain_user', `Test ${role}`);
});

export {};
