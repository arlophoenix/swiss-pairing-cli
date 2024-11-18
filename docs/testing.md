# Testing Guide

## Testing Philosophy

The project follows a test-first development approach with:

- Unit tests for pure functions
- Integration tests for commands
- Performance tests for scaling
- Strong type checking
- Comprehensive test coverage

## Test Types

### Unit Tests

Test pure functions in isolation:

```typescript
describe('validateTeams', () => {
  it('should validate valid teams', () => {
    const result = validateTeams({
      teams: ['Team1', 'Team2'],
      origin: 'CLI',
    });
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

Test complete workflows with fixtures:

```typescript
describe('CLI Integration', () => {
  it('should process CSV input', async () => {
    const result = await runCLI({
      args: '--file teams.csv',
    });
    expect(result.success).toBe(true);
  });
});
```

### Performance Tests

Test scaling characteristics:

```typescript
describe('Performance', () => {
  it('should handle large tournaments', () => {
    const teams = generateTeams(1000);
    const startTime = performance.now();
    generateRounds({ teams, rounds: 9 });
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });
});
```

## Test Structure

### Directory Layout

```bash
test/
├── fixtures/           # Test data files
│   ├── teams.csv
│   └── config.json
├── integration/        # Integration tests
│   └── cli.test.ts
└── unit/              # Unit tests
    ├── validators/
    └── generators/
```

### Test Files

```typescript
// example.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Component', () => {
  describe('function', () => {
    it('should handle success case', () => {
      // Test
    });

    it('should handle error case', () => {
      // Test
    });
  });
});
```

## Testing Practices

### Pure Function Testing

```typescript
// Pure function
function add(a: number, b: number): number {
  return a + b;
}

// Test
describe('add', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

### Command Testing

```typescript
describe('Command', () => {
  // Setup common test data
  const defaultOptions = {
    teams: ['Team1', 'Team2'],
    rounds: 1,
  };

  it('should handle valid input', async () => {
    const result = await handleCommand(defaultOptions);
    expect(result.success).toBe(true);
  });

  it('should handle validation failure', async () => {
    const result = await handleCommand({
      ...defaultOptions,
      teams: [], // Invalid
    });
    expect(result.success).toBe(false);
  });
});
```

### Mock Testing

```typescript
describe('TelemetryClient', () => {
  let mockPostHog: jest.Mock;

  beforeEach(() => {
    mockPostHog = jest.fn();
    jest.mock('posthog-node', () => mockPostHog);
  });

  it('should record event', () => {
    const client = new TelemetryClient();
    client.recordEvent({ name: 'test' });
    expect(mockPostHog).toHaveBeenCalled();
  });
});
```

## Test Coverage

- Displayed when running any of the test commands e.g. `npm test`
- Generally 99%+ requirement; see [jest.config](jest.config.mjs) for specific

## Test Development

### Adding New Tests

1. Create test file

   ```typescript
   // newFeature.test.ts
   describe('newFeature', () => {
     // Tests
   });
   ```

1. Add test cases

   ```typescript
   it('should handle success case', () => {
     // Happy path
   });

   it('should handle error case', () => {
     // Error path
   });
   ```

1. Run tests

   ```bash
   npm test:unit
   ```

### Testing Guidelines

1. **Test Organization**

   - Group related tests
   - Use clear descriptions
   - Test edge cases
   - Test error paths

1. **Test Quality**

   - Make tests readable
   - Test behavior not implementation
   - Avoid test interdependence
   - Keep tests focused

1. **Test Maintenance**
   - Update tests with code
   - Remove obsolete tests
   - Refactor test code
   - Document test data

## Debugging Tests

### Debug Techniques

1. Use test.only()
1. Use included VS Code debugger statement
1. Add console.logs
1. Check test coverage
