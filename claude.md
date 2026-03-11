# Swiss Pairing CLI

A CLI tool for generating Swiss-style tournament pairings. Installed globally via npm as `swisspair`.

## Tech Stack

- **Language**: TypeScript 5.6, strict mode, ESM modules (`"type": "module"`)
- **Runtime**: Node.js 20 (see `.nvmrc`)
- **CLI Framework**: Commander.js
- **Testing**: Jest with ts-jest (ESM preset)
- **Linting**: ESLint (flat config) + Prettier
- **Build**: `tsc` (output to `dist/`)

## Key Commands

- `npm run build` — Compile TypeScript to `dist/` (`tsc -p tsconfig.src.json`)
- `npm run test:unit` — Run unit tests (excludes integration/performance)
- `npm run test:integration` — Run integration tests with snapshot fixtures
- `npm test` — Run all tests (unit + integration + performance)
- `npm run lint` — ESLint + Prettier check + TODO check
- `npm run lint:fix` — Auto-fix lint and format issues
- `npm run validate` — Full validation (lint + test + dependency rules)

Note: `pretest` and `prestart` hooks auto-run `npm run build`, so the project builds before testing.

## Architecture

### Project Structure

```text
src/
├── cli/              # CLI setup (Commander.js configuration)
├── commands/         # Command pattern pipeline
│   ├── cliAction/    # Entry point, telemetry
│   ├── corePipeline/ # Orchestrates processing → generation → formatting + output ordering
│   ├── processInput/ # Input validation and normalization
│   └── generateRounds/ # Tournament pairing generation
├── formatters/       # Output formatting (CSV, JSON, Markdown, plain text)
├── parsers/          # Input file parsing (CSV, JSON)
├── swiss-pairing/    # Core Swiss pairing algorithm
├── telemetry/        # Telemetry with PostHog (privacy-focused)
├── types/            # Type definitions and Result types
├── utils/            # Shared utilities
├── validators/       # Multi-stage validation (CLI, CSV, JSON)
├── constants.ts      # Project-wide constants
├── Config.ts         # Singleton environment configuration
└── index.ts          # Entry point
```

### Data Flow

CLI Arguments / Input Files → CLI Action Command → Core Pipeline → Process Input → Generate Rounds → Format Output

### Error Handling — Result Pattern

**Never throw exceptions for expected errors.** Use the discriminated union `Result<T>` type:

```typescript
type Result<T> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly message: string };
```

Also use `BooleanResult` for validation-only functions (no return value on success). Check `src/types/errors.ts` for all error types.

Use `formatError()` with `ErrorTemplate` enum from `src/utils/errorUtils.ts` for all error messages. Templates use `${variable}` interpolation with compile-time type checking.

### Dependency Rules (enforced by dependency-cruiser)

- **No circular dependencies**
- **Utils cannot depend on domain modules** (swiss-pairing, validators, parsers, formatters)
- **Test files cannot be imported into source code**
- **No dependencies on test folder from source**

Run `npm run docs:dependencies:validate` to check.

## Coding Conventions

### Functional Style

- **Immutable data**: Use `readonly` on all types, interfaces, and arrays. The `functional/immutable-data` and `functional/prefer-readonly-type` ESLint rules enforce this.
- **Pure functions**: Prefer pure functions. Isolate side effects to system boundaries.
- **No `console.log`**: The `no-console` ESLint rule is enforced in source code (allowed in `scripts/`).

### Function Signatures

- **Single object parameter**: `max-params` ESLint rule is set to 1. Always use a single destructured object parameter:

  ```typescript
  function generateRounds({ teams, numRounds, squadMap }: TournamentConfig): Result<Rounds>;
  ```

- **Arrow functions preferred**: `prefer-arrow-callback` and `arrow-body-style` rules enforced.

### TypeScript

- **Strict mode** enabled
- **`as const` assertions** for constant arrays (e.g., `CLI_OPTION_ORDER`, `CLI_OPTION_FORMAT`)
- Types derived from constants using indexed access types (e.g., `type CLIOptionOrder = (typeof CLI_OPTION_ORDER)[number]`)
- `.js` extensions required in imports (ESM with NodeNext module resolution)

### Naming

- Files: `camelCase.ts`, tests: `camelCase.test.ts`
- Types/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` for module-level, `camelCase` for local
- Functions: `camelCase`

### Documentation

- JSDoc on all exported functions and modules with `@module` tags
- Comments explain "why" not "what"
- Module-level doc comments describe purpose

## Testing Conventions

- **Co-located unit tests**: Test files sit next to source files (e.g., `swissPairing.test.ts` beside `swissPairing.ts`)
- **Integration tests**: In `test/integration.test.ts` using snapshot fixtures from `test/fixtures/`
- **Performance tests**: In `test/performance.test.ts`
- **100% coverage required**: All four metrics (statements, branches, functions, lines) — see `jest.config.mjs`
- **AAA pattern**: Arrange, Act, Assert
- **No `.only` or `.skip`**: Use `xdescribe`/`xit`/`xtest` instead (enforced by ESLint)
- **Test behavior, not implementation**

## Commit Conventions

Uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint + husky:

```text
type(scope): description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
Scopes: `cli`, `core`, `parser`, `format`, `test`, `build`, `deps`
