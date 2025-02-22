# Scripts Guide

## Overview

Development utility scripts for automating common tasks and maintaining project quality.

## Documentation

### update-readme-examples.ts

Updates README examples with live CLI output.

```typescript
// Update examples
npm run docs:readme:examples

// Validates examples are current
npm run docs:readme:examples -- --check
```

### update-readme-usage.ts

Updates README CLI usage documentation.

```typescript
// Update usage docs
npm run docs:readme:usage
```

## Environment

### setup-env.ts

Creates environment configuration files and checks external dependencies are installed.

```typescript
// Setup development environment
npm run env:setup

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
- `test:watch`: Runs tests in watch mode, excluding integration
- `test:performance`: Runs performance tests across tournament sizes

### Lint and Format Scripts

- `lint`: Runs all linting checks (ESLint, Prettier, TODOs)
- `lint:fix`: Automatically fixes linting and formatting issues
- `eslint`: Checks code style with ESLint
- `format`: Checks code formatting with Prettier

### Development Scripts

- `docs:dependencies:detailed`: Generates per file dependencies visulization
- `docs:dependencies:overview`: Generates per module dependencies visulization
- `docs:dependencies:validate`: Validates dependencies rules are satisfied
- `docs:readme:usage`: Updates README CLI usage documentation
- `docs:readme:examples`: Updates README CLI examples with live output
- `setup-env`: Sets up development environment configuration
- `todo:report`: Generates Markdown report of TODO comments
- `validate`: Runs full validation suite (lint + tests + dependency check)
