# TODO: Project Enhancements

## In Progress

## Functionality

- Test on Windows

## Code Quality

- prevent pushing directly to remote master branch

## Documentation

- Add a Release Guide
- Add a changelog

## Project Configuration

- automatically run setup-env script on npm install (or similar lifecycle)
- Set up CI/CD pipeline (e.g., GitHub Actions)
  - see first attempt in .github/workflows/ci.yml
- [ ] Implement semantic versioning practices
- [ ] Implement automated dependency updates (e.g., Dependabot)
- Add dependency visualization

## Additional Tooling to Consider

- those nifty repo tags that show passing tests, coverage, depenencies, etc.
- [ ] Commitlint for enforcing consistent commit messages (works well with 📦 Semantic Release)
- [ ] Semantic Release for automating version management and package publishing

## Distribution

- NPM package
- Homebrew for macOS/Linux
- Chocolatey/winget for Windows
- Direct binary downloads as fallback
