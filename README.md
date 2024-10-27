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
  -t, --teams <names...>                                          List of team names in order from top standing to bottom, with optional squad in square brackets
  e.g. "Alice [Home]" "Bob [Home]" "Charlie [Away]" "David [Away]"
  -n, --num-rounds <number>                                       Number of rounds to generate
  (default: 1)
  -s, --start-round <number>                                      Name the generated rounds starting with this number
  (default: 1)
  -o, --order <top-down|bottom-up|random>                         The sequence in which teams should be paired
  (default: top-down)
  --format <csv|json-plain|json-pretty|text-markdown|text-plain>  Output format
  (default: text-markdown)
  --file <path.csv|.json>                                         Path to input file. Options provided via cli override file contents
  -m, --matches <matches...>                                      List of pairs of team names that have already played against each other
  e.g. "Alice,Bob" "Charlie,David"
  -h, --help                                                      display help for command

Examples:

1. Generate random pairings for 4 teams with squads:

  swiss-pairing --teams "Alice [Home]" "Bob [Home]" "Charlie [Away]" "David [Away]" --order random

2. Generate swiss pairings for 4 teams without squads, on round two, with round one matches already played:

  swiss-pairing --teams Alice Bob Charlie David --start-round 2 --matches "Alice,Bob" "Charlie,David"

3. Generate pairings using a CSV file:

  swiss-pairing --file tournament_data.csv

4. Generate pairings using a JSON file, overriding the pairing order and the output format:

  swiss-pairing --file tournament_data.json --order bottom-up --format json-pretty

5. Generate multiple rounds of random pairings:

  swiss-pairing --teams Alice Bob Charlie David --num-rounds 3 --order random
```

<!-- CLI_USAGE_END -->

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project.
- Inspired by the need for a simple, reliable Swiss pairing generator for tournaments.
