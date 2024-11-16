# TODO: Project Enhancements

## In Progress

## Functionality

## Code Quality

- prevent pushing directly to remote master branch

## Documentation

- Commands
  - document command types
  - document modules and command functions
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
