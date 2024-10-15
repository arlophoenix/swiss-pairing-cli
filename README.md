# Swiss Pairing CLI

A simple command-line interface tool for generating Swiss pairings for tournaments.

## Features

- Generate Swiss pairings for a given list of teams
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

````bash
Usage: swiss-pairing [options]

A CLI tool for generating Swiss-style tournament pairings

Options:
  -t, --teams <names...>      List of team names in order from top standing to bottom
                              e.g. Alice Bob Charlie David
  -n, --num-rounds <number>   Number of rounds to generate (default: 1)
  -s, --start-round <number>  Name the generated rounds starting with this number (default: 1)
  -o, --order <order>         The sequence in which teams should be paired (default: top-down)
  --format <format>           Output format (default: text)
  --file <path>               Path to input file (.csv, .json). Options provided via cli override file contents
  -m, --matches <matches...>  List of pairs of team names that have already played against each other
                              e.g. "Alice,Bob" "Charlie,David"
  -h, --help                  display help for command

Examples:

1. Generate random pairings for 4 teams:

  swiss-pairing --teams Alice Bob Charlie David --order random

2. Generate pairings for 4 teams, on round 2, with some matches already played:

  swiss-pairing --teams Alice Bob Charlie David --start-round 2 --matches "Alice,Bob" "Charlie,David"

3. Generate pairings using a CSV file:

  swiss-pairing --file tournament_data.csv

4. Generate pairings using a JSON file, overriding the pairing order:

  swiss-pairing --file tournament_data.json --order bottom-up

5. Generate multiple rounds of pairings:

  swiss-pairing --teams Alice Bob Charlie David --num-rounds 3```

<!-- CLI_USAGE_END -->

### Using Input Files

You can provide tournament data using CSV or JSON files. To use a file, use the `-f` or `--file` option:

```bash
swiss-pairing --file path/to/your/input.csv
````

or

```bash
swiss-pairing --file path/to/your/input.json
```

Note: When using an input file, any options provided will be overridden by the matching command-line arguments.

#### CSV File Format

The CSV file should have the following structure:

```csv
teams,num-rounds,start-round,order,matches1,matches2
Team1,3,1,random,Team2,Team3
Team2,,,,
Team3,,,,
Team4,,,,
```

- The first row must be a header
- Column headers correspond to the CLI options except matches which is split into two columns: matches1 and matches2
- The `teams` column is required

#### JSON File Format

The JSON file should have the following structure:

```json
{
  "teams": ["Team1", "Team2", "Team3", "Team4"],
  "num-rounds": 3,
  "start-round": 1,
  "order": "random",
  "matches": [
    ["Team1", "Team2"],
    ["Team3", "Team4"]
  ]
}
```

- Fields in the JSON file correspond to the CLI options
- The `teams` column is required

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
