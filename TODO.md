# TODO: Project Enhancements

## Functionality

## Code Quality

- refactor the orchestration layer "cliAction" to be more modular and testable

  1. **Switch to Command/Use Case Pattern** because it:

  - Fits our functional style
  - Simplifies testing by reducing mock complexity
  - Has clear data flow with explicit types
  - Matches CLI paradigm
  - Provides good balance of simplicity vs. extensibility

  2. **Key Components**:

  ```typescript
  interface GenerateMatchesCommand {
    readonly teams: readonly string[];
    readonly numRounds: number;
    readonly startRound: number;
    readonly matches?: readonly ReadonlyMatch[];
    readonly format: CLIOptionFormat;
  }

  class GenerateMatchesUseCase {
    constructor(
      private readonly validator: SwissValidator,
      private readonly formatter: OutputFormatter
    ) {}

    async execute(command: GenerateMatchesCommand): Promise<Result<string>>;
  }
  ```

  3. **Main Benefits**:

  - Single responsibility per use case
  - Clear dependencies
  - Simpler testing with fewer mocks
  - Type-safe data flow
  - Room for future expansion

  4. **Migration Steps**:

  - Create Command interface
  - Implement Use Case class
  - Update CLI layer to use new pattern
  - Refactor tests to simpler structure
  - Retain existing business logic intact

- review documentation for updates after the SwissPairingResult refactor
- prevent pushing directly to remote master branch

## Project Configuration

- [ ] Set up CI/CD pipeline (e.g., GitHub Actions)
- [ ] Implement semantic versioning practices
- [ ] Implement automated dependency updates (e.g., Dependabot)

## Additional Tooling to Consider

- [ ] Commitlint for enforcing consistent commit messages (works well with 📦 Semantic Release)
- [ ] Semantic Release for automating version management and package publishing
- [ ] Telemetry to understand usage
