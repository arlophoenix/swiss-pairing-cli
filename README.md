# Swiss Pairing CLI

A simple command-line interface tool for generating Swiss pairings for tournaments.

## Features

- Generate Swiss (or random) pairings for a given list of teams
- Support for squads to prevent intra-squad matchups
- Specify the number of rounds for the tournament
- Easy-to-use CLI interface

## Installation

You can install the Swiss Pairing CLI globally using npm:

```bash
npm install -g swiss-pairing
```

or you can use npx to run it directly:

```bash
npx swiss-pairing ...options
```

## Usage

You can use the Swiss Pairing CLI in two ways:

1. Providing options directly via command-line arguments
2. Using an input file (CSV or JSON format)

<!-- CLI_USAGE_START -->

```bash
Usage: swiss-pairing [options]

A CLI tool for generating Swiss-style tournament pairings

Options:
  -t, --teams <names...>      List of team names in order from top standing to
                              bottom, with optional squad in square brackets
                              e.g. "Alice [Home]" "Bob [Home]" "Charlie [Away]"
                              "David [Away]"
  -n, --num-rounds <number>   Number of rounds to generate
                              (default: 1)
  -s, --start-round <number>  Name the generated rounds starting with this
                              number
                              (default: 1)
  -o, --order <order-enum>    The sequence in which teams should be paired; one
                              of: top-down|bottom-up|random
                              (default: top-down)
  --format <format-enum>      Output format; one of:
                              csv|json-plain|json-pretty|text-markdown|text-plain
                              (default: text-markdown)
  --file <path{.csv|.json}>   Path to input file. Options provided via cli
                              override file contents
  -m, --matches <matches...>  List of pairs of team names that have already
                              played against each other
                              e.g. "Alice,Bob" "Charlie,David"
  -h, --help                  display help for command
```

<!-- CLI_USAGE_END -->

<!-- CLI_EXAMPLES_START -->

**Examples:**

1. Generate random pairings for 4 teams with squads

```bash
>swiss-pairing --teams "Alice [Home]" "Bob [Home]" "Charlie [Away]" "David [Away]" --order random
**Round 1**

1. Bob vs Charlie
2. Alice vs David
```

2. Generate swiss pairings for 4 teams without squads, on round two, with round one matches already played

```bash
>swiss-pairing --teams Alice Bob Charlie David --start-round 2 --matches "Alice,Bob" "Charlie,David"
**Round 2**

1. Alice vs Charlie
2. Bob vs David
```

3. Generate pairings using a CSV file

```bash
>swiss-pairing --file example_data/tournament_round1.csv
**Round 1**

1. Alice vs Bob
2. Charlie vs David
```

4. Generate pairings using a JSON file, overriding the pairing order and the output format

```bash
>swiss-pairing --file example_data/tournament_round2.json --order bottom-up --format json-pretty
{
  "Round 2": [
    [
      "David",
      "Bob"
    ],
    [
      "Charlie",
      "Alice"
    ]
  ]
}
```

5. Generate multiple rounds of random pairings

```bash
>swiss-pairing --teams Alice Bob Charlie David --num-rounds 3 --order random
# Matches

**Round 1**

1. David vs Charlie
2. Alice vs Bob

**Round 2**

1. David vs Alice
2. Charlie vs Bob

**Round 3**

1. David vs Bob
2. Charlie vs Alice
```

<!-- CLI_EXAMPLES_END -->

### Using Squads

To use squads, you can specify them after the team names using square brackets. For example:

```bash
swiss-pairing --teams "Alice [Home]" "Bob [Home]" "Charlie [Away]" "David [Away]"
```

This will ensure that teams from the same squad (e.g., Alice and Charlie, or Bob and David) are not paired against each other.

### Using Input Files

You can provide tournament data using CSV or JSON files. To use a file, use the `-f` or `--file` option:

```bash
swiss-pairing --file path/to/your/input.csv
```

or

```bash
swiss-pairing --file path/to/your/input.json
```

Note: When using an input file, any options provided will be overridden by the matching command-line arguments.

#### CSV File Format

The CSV file should have the following structure:

```csv
teams,squads,num-rounds,start-round,order,matches-home,matches-away
Alice,Home,3,2,random,Bob,Charlie
Bob,Home,,,,Charlie,David
Charlie,Away,,,,
David,Away,,,,
```

- The first row must be a header
- Column headers correspond to the CLI options except:
  - `teams` which is split into two columns: `teams` and `squads`
  - `matches` which is split into two columns: `matches-home` and `matches-away`
- The `teams` column is required, all others are optional

#### JSON File Format

The JSON file should have the following structure:

```json
{
  "teams": [
    { "name": "Alice", "squad": "Home" },
    { "name": "Bob", "squad": "Home" },
    { "name": "Charlie", "squad": "Away" },
    { "name": "David", "squad": "Away" }
  ],
  "num-rounds": 3,
  "start-round": 2,
  "order": "random",
  "matches": [
    ["Alice", "Bob"],
    ["Charlie", "David"]
  ]
}
```

- Fields in the JSON file correspond to the CLI options
- `teams` can be either:
  1. an array of strings e.g. `["Alice", "Bob"]`
  2. or an array of objects with `name` and `squad` properties e.g `[{"name": "Alice", "squad": "Home"}, {"name": "Bob", "squad": "Away"}]`
- The `teams` field is required, all others are optional

## Development

### Prerequisites

- Node.js (LTS version recommended)
- npm

### Setup

1. Clone the repository:

```bash
   git clone https://github.com/arlophoenix/swiss-pairing.git
   cd swiss-pairing
```

2. Install dependencies:

```bash
   npm install
```

3. Build the project:

```bash
   npm run build
```

### Running Tests

To run the test suite:

```bash
npm test
```

or to run tests on file changes:

```bash
npm run test:watch
```

### Linting

To lint the code:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

#### Run locally

```bash
npm start -- ...options
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

Please ensure your code adheres to the existing style and passes all tests.

## Architecture

### Design Principles

The project follows functional programming principles:

- Immutable data using readonly types
- Pure functions with explicit dependencies
- Error handling via Result type pattern
- Side effects isolated to system boundaries
- Single-object arguments for better maintainability and type safety

### Core Components

#### CLI Layer (`cli/`)

Handles command parsing, file I/O, option validation, and output formatting.

#### Tournament Logic (`swiss-pairing/`)

Implements the Swiss pairing algorithm with support for:

- Match history tracking
- Squad constraints
- Round validation

#### Error Handling

Uses discriminated union Result type for error handling:

```typescript
type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly message: string };
```

### Validation Pipeline

1. Parse CLI/File input into raw options
2. Validate options (types, ranges, etc)
3. Validate tournament rules (team counts, etc)
4. Generate and validate pairings
5. Format output

## Documentation Principles

### File Level

Each file should start with a TSDoc comment explaining:

- Purpose of the module
- Key exports and their relationships
- Any important implementation details

Example:

```typescript
/**
 * Swiss tournament pairing core algorithm.
 *
 * Generates optimal pairings for tournament rounds based on:
 * - Previous match history
 * - Squad constraints
 * - Swiss tournament rules
 *
 * @module swiss-pairing
 */
```

### Function Level

Functions should have JSDoc comments with:

- Clear description of purpose
- @param descriptions including constraints
- @returns description
- @throws if applicable
- @example for non-obvious usage

Example:

```typescript
/**
 * Generates matches for the next tournament round.
 *
 * @param teams - List of team names ordered by rank
 * @param playedTeams - Map of previous matchups
 * @param squadMap - Optional squad assignments
 * @returns Generated matches or error message
 * @throws Never - Uses Result type for errors
 *
 * @example
 * const result = generateRound({
 *   teams: ['A','B','C','D'],
 *   playedTeams: new Map([['A', new Set(['B'])]])
 * });
 */
```

### Interface/Type Level

Interfaces and types should document:

- Purpose of the type
- Constraints on fields
- Relationships to other types

Example:

```typescript
/**
 * Represents a tournament team with optional squad assignment.
 * Team names must be unique within a tournament.
 * Teams in the same squad cannot play each other.
 */
interface Team {
  /** Unique identifier for the team */
  readonly name: string;

  /** Optional squad grouping */
  readonly squad?: string;
}
```

### Inline Comments

- Use sparingly - prefer self-documenting code
- Explain complex algorithms
- Document non-obvious constraints
- Note edge cases and workarounds

Example:

```typescript
// Fisher-Yates shuffle to randomize team order
// Note: Math.random() is sufficient for this use case
function shuffle<T>(array: readonly T[]): readonly T[] {
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project.
- Inspired by the need for a simple, reliable Swiss pairing generator for tournaments.
