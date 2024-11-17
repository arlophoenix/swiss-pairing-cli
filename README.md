# Swiss Pairing CLI

Generate Swiss-style tournament pairings from the command line.

## Features

- Swiss or random pairings
- Squad support to prevent intra-team matches
- Multiple round generation
- CSV/JSON input support
- Flexible output formats

## Install

```bash
npm install -g swiss-pairing-cli
```

or you can use npx to run it directly:

```bash
npx swisspair ...options
```

## Quick Start

<!-- CLI_EXAMPLES_START -->

1. Generate random pairings for 4 teams with squads

   ```bash
   >swisspair --teams "Alice [Home]" "Bob [Home]" "Charlie [Away]" "David [Away]" --order random
   **Round 1**

   1. Bob vs Charlie
   2. Alice vs David
   ```

1. Generate swiss pairings for 4 teams without squads, on round two, with round one matches already played

   ```bash
   >swisspair --teams Alice Bob Charlie David --start-round 2 --matches "Alice,Bob" "Charlie,David"
   **Round 2**

   1. Alice vs Charlie
   2. Bob vs David
   ```

1. Generate pairings using a CSV file

   ```bash
   >swisspair --file example_data/tournament_round1.csv
   **Round 1**

   1. Alice vs Bob
   2. Charlie vs David
   ```

1. Generate pairings using a JSON file, overriding the pairing order and the output format

   ```bash
   >swisspair --file example_data/tournament_round2.json --order bottom-up --format json-pretty
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

1. Generate multiple rounds of random pairings

   ```bash
   >swisspair --teams Alice Bob Charlie David --num-rounds 3 --order random
   # Matches

   **Round 1**

   1. Alice vs David
   2. Bob vs Charlie

   **Round 2**

   1. Alice vs Bob
   2. David vs Charlie

   **Round 3**

   1. Alice vs Charlie
   2. David vs Bob
   ```

<!-- CLI_EXAMPLES_END -->

## Documentation

- [Architecture Overview](docs/architecture.md) - System design and patterns
- [Contributing Guide](docs/contributing.md) - Development workflow and standards
- [Dependencies Detailed](docs/dependencies-detailed.md) - Per file dependencies
- [Dependencies Overview](docs/dependencies-overview.md) - Per module dependencies
- [Development Guide](docs/development.md) - Setting up your environment
- [Documentation Guide](docs/documentation.md) - Writing and maintaining documentation
- [Scripts Guide](docs/scripts.md) - Scripts and automation
- [Telemetry Guide](docs/telemetry.md) - Privacy and data collection
- [Testing Guide](docs/testing.md) - Testing approach and practices

## Detailed Usage

You can use the Swiss Pairing CLI in two ways:

1. Providing options directly via command-line arguments
2. Using an input file (CSV or JSON format)

<!-- CLI_USAGE_START -->

```bash
Usage: swisspair [options]

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

### Using Squads

To use squads, you can specify them after the team names using square brackets. For example:

```bash
swisspair --teams "Alice [Home]" "Bob [Home]" "Charlie [Away]" "David [Away]"
```

This will ensure that teams from the same squad (e.g., Alice and Charlie, or Bob and David) are not paired against each other.

### Using Input Files

You can provide tournament data using CSV or JSON files. To use a file, use the `-f` or `--file` option:

```bash
swisspair --file path/to/your/input.csv
# or
swisspair --file path/to/your/input.json
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project.
- Inspired by the need for a simple, reliable Swiss pairing generator for tournaments.
