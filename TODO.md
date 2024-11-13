# TODO: Project Enhancements

## In Progress

- Telemetry using PostHog
  - rename posthogclient
  - simplify point of use
  - mention telemetry in readme
  - enable telemetry for production (how to securely store API key?)

## Functionality

## Code Quality

- consider refactor to extract cliAction to separate command
- Review code coverage
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

## Additional Tooling to Consider

- [ ] Commitlint for enforcing consistent commit messages (works well with 📦 Semantic Release)
- [ ] Semantic Release for automating version management and package publishing
