# Documentation Guide

## Project Documentation

```bash
README.md            # Project overview & usage
docs/
├── architecture.md   # System design & patterns
├── contributing.md   # Development workflow and standards
├── development.md    # Setting up your environment
├── documentaion.md   # This guide
├── scripts.md        # Scripts & automation
├── telemetry.md      # Privacy & data collection
└── testing.md        # Testing approach & practices
```

## Code Documentation

Focus on documenting complex or non-obvious code that future maintainers will thank you for explaining. Keep it minimal but meaningful.

### Module Documentation

Document complex modules with a brief TSDoc header explaining:

```typescript
/**
 * Swiss tournament pairing generator.
 * Handles:
 * - Team pairing with squad constraints
 * - Match history tracking
 * - Backtracking for optimal pairings
 *
 * Error handling via Result type with specific failure modes.
 */
```

### Function Documentation

Focus on complex functions, especially those with constraints:

```typescript
/**
 * Generates tournament pairings using Swiss matching.
 * Backtracks when constraints prevent valid matches.
 *
 * @param teams Teams in rank order
 * @returns Rounds or validation error
 *
 * @example
 * generateRounds({ teams: ['A', 'B'], rounds: 1 })
 */
```

### Type Documentation

Document complex types where constraints aren't obvious:

```typescript
/**
 * Tournament configuration.
 * Squads cannot play against each other.
 * Requires even number of teams.
 */
interface TournamentConfig {
  readonly teams: Team[];
  readonly squadMap: Map<string, string>;
}
```

### Command Documentation

Document commands with validation and telemetry:

```typescript
/**
 * Process tournament input and generate pairings.
 * Validates:
 * - Even team count
 * - Unique team names
 * - Valid squad assignments
 *
 * Records telemetry for command invocation and completion.
 * Exit codes: 0=success, 1=validation error
 */
```

### Comments

Use sparingly for non-obvious code:

```typescript
// Backtrack if no valid pairings found for current team
if (!findValidPairing(team)) {
  return null;
}
```

## File Formats

### CSV Format

```csv
teams,squads,num-rounds
Team1,Red,3
Team2,Red,
```

### JSON Format

```json
{
  "teams": ["Team1", "Team2"],
  "num-rounds": 2
}
```

## Updating Readme

```bash
# Update examples
npm run readme:update-examples

# Update usage
npm run readme:update-usage
```
