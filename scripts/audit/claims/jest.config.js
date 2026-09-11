// Own Jest config for phase-07 Worker A behavior-claim tests (A2). Scoped to
// this directory only — the app's own root jest config
// (BeePOS/package.json's "jest" key) is never touched. Extends the same
// jest-expo preset the app already uses, but widens transformIgnorePatterns
// so the installed @beemvp/beeui-ui / beeui-core / beeui-tokens packages
// (published as ESM-only `dist/module/**/*.js`, which Jest's CJS transform
// cannot parse un-transformed) and their own ESM-only runtime deps get
// transformed like first-party RN code, matching the "installed npm
// package" reality source described in the phase brief.
const path = require('node:path');

module.exports = {
  preset: 'jest-expo',
  rootDir: path.join(__dirname, '..', '..', '..'),
  roots: ['<rootDir>/scripts/audit/claims'],
  testMatch: ['<rootDir>/scripts/audit/claims/__tests__/**/*.claims.test.[jt]s?(x)'],
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@beemvp|class-variance-authority|uniwind|react-native-teleport|@gorhom))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
  // BeeUI's package.json `exports` map lists a `"source"` condition (its own
  // CLI's "you own the source" story — see docs/reference/cli/ and the
  // cli-source-ownership guide) ahead of `"require"`/`"import"`, and
  // jest-expo's Metro-style resolver picks it up, pulling in the untransformed
  // TS *source* tree (which in turn eagerly requires native-only modules like
  // react-native-worklets that cannot run under plain Jest). Route straight
  // at the package's compiled CommonJS build instead — this is still "the
  // installed npm package" reality source the phase brief asks for, just the
  // require-condition build rather than the source-condition one.
  moduleNameMapper: {
    '^@beemvp/beeui-ui$': '<rootDir>/node_modules/@beemvp/beeui-ui/dist/commonjs/index.js',
    '^@beemvp/beeui-core$': '<rootDir>/node_modules/@beemvp/beeui-core/dist/commonjs/index.js',
    '^@beemvp/beeui-tokens$': '<rootDir>/node_modules/@beemvp/beeui-tokens/dist/commonjs/index.js',
  },
  setupFilesAfterEnv: ['<rootDir>/scripts/audit/claims/jest.setup.js'],
};
