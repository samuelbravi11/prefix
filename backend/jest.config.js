// backend/jest.config.js
export default {
  testEnvironment: 'node',
  // Carica le variabili d'ambiente prima di ogni test
  setupFiles: ['<rootDir>/test/setup.js'], 
  transform: {}, // Non serve trasformare nulla se usiamo moduli nativi
};