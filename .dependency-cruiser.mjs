/** @type {import('dependency-cruiser').IConfiguration} */
const configuration = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (e.g., use dependency inversion, ensure single responsibility).',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: "This module is likely unused. If it's logical, add an exception; otherwise, remove it.",
      from: {
        orphan: true,
        pathNot: [
          '(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          '[.]d[.]ts$',
          '(^|/)tsconfig[.]json$',
          '(^|/)(?:babel|webpack)[.]config[.](?:js|cjs|mjs|ts|cts|mts|json)$',
          'types[.]ts$',
          'Types[.]ts$',
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      comment: 'A dependency on a deprecated Node.js core module. Find an alternative.',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^v8/tools/.*$',
          '^node-inspect/lib/.*$',
          '^async_hooks$',
          '^punycode$',
          '^domain$',
          '^constants$',
          '^sys$',
          '^_linklist$',
          '^_stream_wrap$',
        ],
      },
    },
    {
      name: 'not-to-deprecated',
      severity: 'warn',
      comment: 'Dependency uses a deprecated npm module. Update or find an alternative.',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment: "Depends on a package missing from 'dependencies' in package.json. Add it.",
      from: {},
      to: {
        dependencyTypes: ['npm-no-pkg', 'npm-unknown'],
      },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: "Depends on a module that can't be resolved. Fix or remove it.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-duplicate-dep-types',
      severity: 'warn',
      comment:
        'Dependency occurs multiple times in package.json (e.g., in devDependencies and dependencies).',
      from: {},
      to: { moreThanOneDependencyType: true, dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'not-to-test-folder',
      comment: "Don't allow dependencies from outside the test folder to test",
      severity: 'error',
      from: {
        pathNot: '^test',
      },
      to: {
        path: '^test',
      },
    },
    {
      name: 'not-to-test-file',
      comment: "Don't allow dependencies to test files",
      severity: 'error',
      from: {},
      to: {
        path: '\\.test\\.ts$',
      },
    },
    {
      name: 'no-utils-to-domains',
      comment: 'Utils should not depend on domain modules',
      severity: 'error',
      from: {
        path: '^src/utils/',
      },
      to: {
        path: ['^src/swiss-pairing/', '^src/validators/', '^src/parsers/', '^src/formatters/'],
      },
    },
  ],
  options: {
    doNotFollow: { path: '^node_modules/' },
    exclude: '^(test|dist|scripts)/|\\.(test)\\.(js|ts)$',
    tsConfig: { fileName: './tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      archi: {
        collapsePattern: '^(?:packages|src|node_modules)/(?:@[^/]+/[^/]+|[^/]+)',
      },
      text: { highlightFocused: true },
    },
  },
};

export default configuration;
