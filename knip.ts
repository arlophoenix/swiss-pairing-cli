import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/index.ts', 'scripts/**/*.ts'],
  project: ['src/**/*.ts', 'scripts/**/*.ts', 'test/**/*.ts'],
  ignoreBinaries: ['dot'],
  // @jest/globals and jest-mock are sub-packages bundled with jest
  // postject is invoked via execSync in scripts/build-binary.ts, not imported
  ignoreDependencies: ['@jest/globals', 'jest-mock', 'postject'],
  // Duplicate exports are intentional named aliases (e.g. CLI_OPTION_FORMAT_DEFAULT = CLI_OPTION_FORMAT_TEXT_MARKDOWN)
  exclude: ['duplicates'],
};

export default config;
