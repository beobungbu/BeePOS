// Own Jest config for phase-08 per-prop behavior tests. Extends the same
// jest-expo preset + moduleNameMapper + native-module stubs the phase-07
// claims suite already established (scripts/audit/claims/jest.config.js),
// scoped to this directory only. The app's own root jest config
// (BeePOS/package.json's "jest" key) is never touched — see the sibling
// `/scripts/audit/props/` entry added to its testPathIgnorePatterns.
const path = require('node:path');

module.exports = {
  preset: 'jest-expo',
  rootDir: path.join(__dirname, '..', '..', '..'),
  roots: ['<rootDir>/scripts/audit/props'],
  testMatch: ['<rootDir>/scripts/audit/props/__tests__/**/*.props.test.[jt]s?(x)'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@beemvp|class-variance-authority|uniwind|react-native-teleport|@gorhom))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  moduleNameMapper: {
    '^@beemvp/beeui-ui$': '<rootDir>/node_modules/@beemvp/beeui-ui/dist/commonjs/index.js',
    '^@beemvp/beeui-core$': '<rootDir>/node_modules/@beemvp/beeui-core/dist/commonjs/index.js',
    '^@beemvp/beeui-tokens$': '<rootDir>/node_modules/@beemvp/beeui-tokens/dist/commonjs/index.js',
  },
  setupFilesAfterEnv: ['<rootDir>/scripts/audit/claims/jest.setup.js'],
};
