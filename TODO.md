# TODO: Project Enhancements

## In Progress

- Telemetry using PostHog
  - mention telemetry in readme
  - ensure no user data in errors

## Functionality

## Code Quality

- consider refactor to extract cliAction to separate command
- Improve code coverage

```
Looking at the coverage report, there are several areas to improve:

src/cli/cli.ts - Lines 128-130
These are likely error handling paths. Add tests for error scenarios in cli.test.ts
src/telemetry/TelemetryClient.ts - Most critical gaps:


Line 35: Constructor path
Lines 65-66: Record path
Line 94, 98: Flush/shutdown paths
Add test cases in TelemetryClient.test.ts for error handling and edge cases


src/telemetry/telemetryUtils.ts - Lines 128-136
Add tests for file system operations in installation ID generation
src/validators/csvValidator.ts - Lines 46, 61
Add edge cases to test validation logic for different CSV formats

General approach:

Focus first on TelemetryClient.ts as it has the most gaps
Use jest.spyOn() to mock file system operations
Test error paths by making mocks throw errors
```

- prevent pushing directly to remote master branch

## Documentation

- Scripts
  - Add a section on scripts to the readme
  - Document the scripts
- Debug
  - Add a section on debug logging to the readme

## Project Configuration

- Set up CI/CD pipeline (e.g., GitHub Actions)
  - see first attempt in .github/workflows/ci.yml
- [ ] Implement semantic versioning practices
- [ ] Implement automated dependency updates (e.g., Dependabot)
- Add dependency visualization

## Additional Tooling to Consider

- [ ] Commitlint for enforcing consistent commit messages (works well with 📦 Semantic Release)
- [ ] Semantic Release for automating version management and package publishing

## Distribution

- NPM package
- Homebrew for macOS/Linux
- Chocolatey/winget for Windows
- Direct binary downloads as fallback
