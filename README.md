# Swiss Pairing CLI

A simple command-line interface tool for generating Swiss pairings for tournaments.

## Features

- Generate Swiss pairings for a given list of players
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

## Help

<!-- CLI_USAGE_START -->

```bash
Usage: swiss-pairing [options]

A CLI tool for generating Swiss-style tournament pairings

Options:
  -p, --players <names...>                    List of player names in order from top standing
                                              to bottom
                                              e.g. player1 player2 player3 player4
  -m, --matches <matches...>                  List of pairs of player names that have already
                                              played against each other
                                              e.g. "player1,player2" "player3,player4"
  -n, --num-rounds <number>                   Number of rounds to generate (default: 1)
  -s, --start-round <number>                  Name the generated rounds starting with this
                                              number (default: 1)
  -o --order <top-down | random | bottom-up>  The sequence in which players should be paired.
                                              (default: "top-down")
  -f, --file <path>                           Path to input file (CSV or JSON). Options
                                              provided via cli take precedence over file
                                              contents.
  -h, --help                                  Display this help information
```

<!-- CLI_USAGE_END -->

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
