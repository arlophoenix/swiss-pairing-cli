# Contributing Guide

## Development Workflow

1. **Fork & Clone**

   ```bash
   git clone https://github.com/<your-username>/swiss-pairing.git
   cd swiss-pairing
   ```

1. **Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

1. **Install Dependencies**

   ```bash
   npm install
   ```

1. **Development Loop**

   - Write tests first
   - Implement feature
   - Run tests: `npm test`
   - Check linting: `npm run lint`
   - Format code: `npm run format`

1. **Commit**

   ```bash
   git commit -m "feat: add your feature description"
   ```

1. **Push & PR**
   - Push your branch
   - Create Pull Request
   - Address review feedback

## Code Standards

- Write pure functions where possible
- Use TypeScript types effectively
- Use readonly types for immutability
- Handle errors with Result type
- Write self-documenting code

### Type Conventions

```typescript
// Use readonly types
type Teams = readonly string[];

// Use discriminated unions
type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly message: string };

// Document complex types
interface TournamentConfig {
  /** Teams in rank order */
  readonly teams: Teams;
  /** Number of rounds to generate */
  readonly numRounds: number;
}
```

### Function Conventions

```typescript
// Pure functions with explicit dependencies
function generateRounds({ teams, numRounds, squadMap }: TournamentConfig): Result<Rounds> {
  // Implementation
}

// Use object params for maintainability
function validateTeams({
  teams,
  origin,
}: {
  readonly teams: Teams;
  readonly origin: InputOrigin;
}): Result<Teams> {
  // Implementation
}
```

## Testing Standards

- Unit test pure functions thoroughly
- Use integration tests for commands
- Test error cases explicitly
- Use meaningful test descriptions
- Follow the AAA pattern (Arrange, Act, Assert)

```typescript
describe('validateTeams', () => {
  it('should reject teams with duplicate names', () => {
    // Arrange
    const teams = ['Alice', 'Bob', 'Alice'];

    // Act
    const result = validateTeams({ teams, origin: 'CLI' });

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain('duplicate');
    }
  });
});
```

## Documentation Standards

- Document modules with clear purpose
- Document complex types and constraints
- Include examples for non-obvious usage
- Keep comments focused on "why" not "what"
- Update docs with code changes

```typescript
/**
 * Generates Swiss tournament pairings.
 * Ensures:
 * - No repeat matches
 * - No intra-squad matches
 * - Optimal pairing by rank
 *
 * @param config - Tournament configuration
 * @returns Generated rounds or error message
 */
```

## Pull Request Process

1. **Description**

   - Clear purpose and scope
   - Related issues
   - Implementation approach
   - Testing approach

2. **Review Checklist**

   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No linting errors
   - [ ] No type errors
   - [ ] No console logs
   - [ ] No commented code

3. **Review Response**

   - Address all comments
   - Request re-review
   - Update PR description

4. **Merge Requirements**
   - All checks passing
   - Approved review
   - Up-to-date branch
