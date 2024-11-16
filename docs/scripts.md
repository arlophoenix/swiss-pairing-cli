# Scripts Guide

## Overview

Development utility scripts for automating common tasks and maintaining project quality.

## Performance Testing

### performance-test.ts

Tests Swiss pairing algorithm performance across tournament sizes.

```typescript
// Run performance tests
npm run test:perf

// Output
Teams: 8, Rounds: 3, Avg Time: 1.23ms
Teams: 16, Rounds: 3, Avg Time: 2.45ms
...
```

## Documentation

### update-readme-examples.ts

Updates README examples with live CLI output.

```typescript
// Update examples
npm run readme:update-examples

// Validates examples are current
npm run readme:update-examples -- --check
```

### update-readme-usage.ts

Updates README CLI usage documentation.

```typescript
// Update usage docs
npm run readme:update-usage
```

## Environment

### setup-env.ts

Creates environment configuration files.

```typescript
// Setup development environment
npm run setup-env

// Outputs
- .env (development)
- .env.test (testing)
```

### update-nvmrc.ts

Updates Node.js version from package.json.

```typescript
// Update .nvmrc
npm run update-nvmrc
```

## Package Scripts

### Build Scripts

- `build`: Compiles TypeScript to JavaScript
- `build:clean`: Cleans output directory and rebuilds
- `clean`: Removes compiled output files

### Test Scripts

- `test:unit`: Runs unit tests only
- `test:integration`: Runs integration tests only
- `test:coverage`: Runs all tests with coverage report
- `test:watch`: Runs tests in watch mode, excluding integration
- `test:perf`: Runs performance tests across tournament sizes

### Lint and Format Scripts

- `lint`: Runs all linting checks (ESLint, Prettier, TODOs)
- `lint:fix`: Automatically fixes linting and formatting issues
- `eslint`: Checks code style with ESLint
- `format`: Checks code formatting with Prettier

### Development Scripts

- `setup-env`: Sets up development environment configuration
- `readme:update-usage`: Updates README CLI usage documentation
- `readme:update-examples`: Updates README CLI examples with live output
- `todo:report`: Generates Markdown report of TODO comments
- `validate`: Runs full validation suite (lint + tests)
