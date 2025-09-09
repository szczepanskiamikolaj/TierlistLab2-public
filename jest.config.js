module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    moduleDirectories: ['node_modules', '<rootDir>/'],
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1', // Resolves @/ to the src directory
    },
  };
  