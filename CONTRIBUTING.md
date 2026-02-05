# Contributing to go-go-try

Thank you for your interest in contributing to go-go-try! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npx vitest

# Run tests with coverage
npx vitest run --coverage
```

### Linting

```bash
npm run lint
```

## Coding Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by Biome)
- Write comprehensive tests for new features
- Ensure all tests pass before submitting PR

## Commit Guidelines

- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run the full test suite: `npm test`
3. Update documentation if needed
4. Submit PR with a clear description of changes
5. Wait for CI checks to pass
6. Address any review feedback

## Adding New Features

When adding new features:

1. Add type definitions first
2. Implement the feature with full type safety
3. Add comprehensive tests covering:
   - Happy path
   - Error cases
   - Edge cases (null, undefined, etc.)
4. Update README.md with usage examples
5. Update CHANGELOG.md

## Reporting Bugs

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Node.js and TypeScript versions
- Minimal code example if possible

## Questions?

Feel free to open an issue for any questions or discussions.
