/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ["<rootDir>/test"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"]
};