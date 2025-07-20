// jest.config.js
// Jest configuration for product page testing

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/js/tests/setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/js/tests/**/*.test.js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Transform ignore patterns - allow transformation of ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(gsap|three)/)'
  ],
  
  // Module name mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/tests/**',
    '!src/js/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance testing
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Global variables
  globals: {
    'NODE_ENV': 'test'
  }
};