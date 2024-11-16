# Development Guide

## Environment Setup

### Prerequisites

- Node.js 20 (LTS)
- npm
- VS Code (recommended)
- Git

### Initial Setup

1. **Install Node.js**

   ```bash
   # Using nvm (recommended)
   nvm install
   nvm use
   ```

1. **Install Dependencies**

   ```bash
   npm install
   ```

1. **Setup Environment**

   ```bash
   npm run setup-env
   ```

1. **VS Code Setup**
   Install recommended extensions:
   - ESLint
   - Prettier
   - TypeScript

## Development Workflow

### Build

```bash
# Build project
npm run build

# Watch mode
npm run build:watch

# Clean build
npm run build:clean
```

### Test

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Performance tests
npm run test:perf
```

### Lint

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Debug

1. **VS Code Debug Config**

   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Tests",
     "program": "${workspaceFolder}/node_modules/.bin/jest",
     "args": ["--runInBand"],
     "console": "integratedTerminal",
     "internalConsoleOptions": "neverOpen"
   }
   ```

1. **Debug Logging**

   ```bash
   # Enable all debug logs
   DEBUG=swiss-pairing* npm start

   # Specific component logs
   DEBUG=swiss-pairing:telemetry npm start
   ```

## Project Structure

```bash
src/
├── cli/               # CLI interface
├── commands/          # Command implementations
├── formatters/        # Output formatting
├── parsers/          # Input parsing
├── swiss-pairing/    # Core algorithm
├── telemetry/        # Usage tracking
├── types/            # Type definitions
├── utils/            # Shared utilities
└── validators/       # Input validation

test/
├── fixtures/         # Test data
├── integration/      # Integration tests
└── unit/            # Unit tests
```

## Common Tasks

### Adding a New Command

1. Define types in `commandTypes.ts`

   ```typescript
   export interface NewCommand {
     readonly param1: string;
     readonly param2: number;
   }
   ```

1. Create command handler

   ```typescript
   export async function handleNewCommand(command: NewCommand): Promise<Result<Output>> {
     // Implementation
   }
   ```

1. Add tests

   ```typescript
   describe('handleNewCommand', () => {
     it('should handle command successfully', async () => {
       // Test implementation
     });
   });
   ```

### Adding a New Feature

1. Create feature branch

   ```bash
   git checkout -b feature/new-feature
   ```

1. Add tests first

   ```typescript
   describe('newFeature', () => {
     // Test cases
   });
   ```

1. Implement feature

   ```typescript
   function newFeature(): Result<Output> {
     // Implementation
   }
   ```

1. Update documentation
   - Add JSDoc comments
   - Update relevant guides
   - Add examples if needed

### Updating Dependencies

1. Check outdated packages

   ```bash
   npm outdated
   ```

1. Update packages

   ```bash
   npm update
   ```

1. Run tests

   ```bash
   npm run test:coverage
   ```

1. Check types

   ```bash
   npm run build
   ```

## Troubleshooting

### Common Issues

1. **Build Errors**

   - Check TypeScript version
   - Clear build cache: `npm run clean`
   - Check for type errors: `tsc --noEmit`

1. **Test Failures**

   - Run specific test: `npm test -- -t "test name"`
   - Check test environment
   - Debug with VS Code

1. **Linting Issues**
   - Run autofix: `npm run lint:fix`
   - Check ESLint config
   - Update Prettier config

### Getting Help

1. Check existing issues
1. Read error messages carefully
1. Enable debug logging
1. Create detailed bug report
