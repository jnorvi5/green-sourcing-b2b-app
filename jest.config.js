
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/frontend/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
