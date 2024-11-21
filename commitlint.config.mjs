export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New features
        'fix', // Bug fixes
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc)
        'refactor', // Code changes that neither fix bugs nor add features
        'perf', // Performance improvements
        'test', // Test changes
        'chore', // Build process, tooling changes
        'revert', // Revert previous commits
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'cli', // CLI interface
        'core', // Core algorithm
        'parser', // Input parsing
        'format', // Output formatting
        'test', // Testing infrastructure
        'build', // Build configuration
        'deps', // Dependencies
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
