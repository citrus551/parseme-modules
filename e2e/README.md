# E2E Framework Tests

End-to-end tests that validate parseme against framework example repositories.

## Overview

These tests clone example projects and run parseme to ensure:
- Framework detection works correctly
- API endpoints are discovered
- Project structure is analyzed
- Output files are generated properly

## Tested Frameworks

### Backend APIs

| Framework | Repository | Path |
|-----------|------------|------|
| NestJS | [nestjs/nest](https://github.com/nestjs/nest) | sample/01-cats-app |
| Express.js | [expressjs/express](https://github.com/expressjs/express) | examples/multi-router |
| Express.js (generated) | `npx express-generator` | . |
| Fastify | [fastify/demo](https://github.com/fastify/demo) | . |

### Frontend Applications

| Framework | Repository | Path |
|-----------|------------|------|
| React.js | [uixmat/onborda](https://github.com/uixmat/onborda) | . |
| React.js (generated) | `npx create-react-router@latest` | . |
| Vue.js | [vuejs/pinia](https://github.com/vuejs/pinia) | . |
| Vue.js (generated) | `npx create-vue@latest` | . |
| Angular | [angular/examples](https://github.com/angular/examples) | walk-my-dog |
| Angular (generated) | `ng new` | . |
| Svelte | [sveltejs/examples](https://github.com/sveltejs/examples) | examples/todomvc |
| Vanilla JS | [ymw0331/vanilla-javascript-20-projects](https://github.com/ymw0331/vanilla-javascript-20-projects) | 014-nasa-apod |

## Prerequisites

- Node.js >= 20.19.5
- Git
- Built parseme package (`npm run build` in `npm/` directory)

## Running Tests

### Quick Start

```bash
# From the e2e directory
./scripts/run-e2e.sh
```

This will:
1. Clone the example repositories (if not already cloned)
2. Build the npm package (if not already built)
3. Run all E2E tests

### Manual Steps

```bash
# 1. Clone repositories
./scripts/clone-repos.sh

# 2. Build npm package
cd ../npm
npm run build
cd ../e2e

# 3. Run tests
node --test tests/framework-examples.test.js
```

### Run Specific Framework

```bash
# Run only NestJS tests
node --test tests/framework-examples.test.js -t "NestJS"

# Run only Express tests
node --test tests/framework-examples.test.js -t "Express"

# Run only Fastify tests
node --test tests/framework-examples.test.js -t "Fastify"
```

## What Tests Validate

For each framework example:

1. **Initialization**: Can create a config file
2. **Generation**: Can generate context without errors
3. **Output Files**: Creates PARSEME.md and context files
4. **Framework Detection**: Correctly identifies the framework
5. **Structure Analysis**: Generates structure.json with file data
6. **Endpoint Detection**: Detects API routes (when applicable)

## Cleaning Up

Generated files are automatically cleaned up after tests. To manually clean:

```bash
# Remove cloned repositories
rm -rf repos/

# Or remove generated files only
rm -rf repos/*/PARSEME.md repos/*/parseme-context repos/*/parseme.config.json
```
## Notes

- Tests run with `CI=true` environment to skip interactive prompts
- `--no-git` flag is used to skip git information for faster execution
