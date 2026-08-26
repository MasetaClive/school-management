module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  roots: ['<rootDir>/src'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    'src/app/api/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
