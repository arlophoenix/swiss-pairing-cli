# Contributing Guide

## Development Workflow

1. **Fork & Clone**

   ```bash
   git clone https://github.com/<your-username>/swiss-pairing-cli.git
   cd swiss-pairing-cli
   ```

1. **Branch**

   ```bash
   git checkout -b feature/your-feature-name   # For new features
   git checkout -b fix/bug-description        # For bug fixes
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
   Follow the Conventional Commits specification:

   ```bash
   # Format: type(scope): description

   git commit -m "feat(core): implement new pairing algorithm"
   git commit -m "fix(cli): handle odd number of teams"
   git commit -m "docs: update usage examples"
   ```

   Types:

   - **feat**: New features
   - **fix**: Bug fixes
   - **docs**: Documentation changes
   - **style**: Code formatting
   - **refactor**: Code restructuring
   - **perf**: Performance improvements
   - **test**: Test changes
   - **build**: Build system changes
   - **ci**: CI/CD changes
   - **chore**: General maintenance

   Scopes:

   - **cli**: Command line interface
   - **core**: Core algorithm
   - **parser**: Input parsing
   - **format**: Output formatting
   - **test**: Testing infrastructure
   - **build**: Build configuration
   - **deps**: Dependencies

   Breaking Changes:

   ```bash
   git commit -m "feat!(core): rename core API functions

   BREAKING CHANGE: All core functions renamed for consistency"
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

## Dependencies & Architecture

- Check Dependency [Overview](dependencies-overview.html) and [Details](dependencies-detailed.html) for project structure
- Review dependency rules in [`.dependency-cruiser.mjs`](../.dependency-cruiser.mjs)
- Pre-push hooks validate dependency rules
- No circular dependencies allowed
- Utils must remain independent of domain code

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
   - [ ] Dependency rules not violated

3. **Review Response**

   - Address all comments
   - Request re-review
   - Update PR description

4. **Merge Requirements**
   - All checks passing
   - Approved review
   - Up-to-date branch
