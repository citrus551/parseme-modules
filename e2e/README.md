# E2E Tests

End-to-end tests that validate parseme against a diverse set of real-world repositories.

## Overview

These tests clone/generate example projects and run parseme to ensure:
- Framework detection works correctly
- API endpoints are discovered (when applicable)
- Project structure is analyzed
- Output files are generated properly

## Test Repositories

### Backend Frameworks

| Framework | Repository | Path |
|-----------|------------|------|
| NestJS | [nestjs/nest](https://github.com/nestjs/nest) | sample/01-cats-app |
| Express.js | [prisma/prisma-examples](https://github.com/prisma/prisma-examples) | orm/express |
| Express.js (generated) | `npx express-generator` | . |
| Fastify | [fastify/demo](https://github.com/fastify/demo) | . |

### Frontend Frameworks

| Framework | Repository | Path |
|-----------|------------|------|
| React.js (Next.js) | [ai-ng/2txt](https://github.com/ai-ng/2txt) | . |
| React.js (generated) | `npx create-react-router@latest` | . |
| Vue.js | [posva/pinia-colada](https://github.com/posva/pinia-colada) | . |
| Vue.js (generated) | `npx create-vue@latest` | . |
| Angular | [angular/examples](https://github.com/angular/examples) | walk-my-dog |
| Angular (generated) | `@angular/cli new` | . |
| Svelte | [hmmhmmhm/svelte-template](https://github.com/hmmhmmhm/svelte-template) | . |

### Fullstack Frameworks

| Framework | Repository | Path |
|-----------|------------|------|
| Next.js | [vercel/next.js](https://github.com/vercel/next.js) | examples/hello-world |
| Next.js (generated) | `npx create-next-app@latest` | . |
| Nuxt.js | [zackha/habit](https://github.com/zackha/habit) | . |

### NPM Packages & Libraries

| Type | Repository | Path |
|------|------------|------|
| TypeScript utilities | [piotrwitek/utility-types](https://github.com/piotrwitek/utility-types) | . |
| JavaScript helpers | [lodash/lodash](https://github.com/lodash/lodash) | . |
| Node.js modules | [axios/axios](https://github.com/axios/axios) | . |
| Monorepo packages | [lerna/lerna](https://github.com/lerna/lerna) | . |

### Development Tools

| Type | Repository | Path |
|------|------------|------|
| CLI tools | [lirantal/ls-mcp](https://github.com/lirantal/ls-mcp) | . |
| Build plugins | [hannoeru/vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages) | . |
| Desktop applications | [responsively-org/responsively-app](https://github.com/responsively-org/responsively-app) | . |
| Testing utilities | [jestjs/jest](https://github.com/jestjs/jest) | . |

### Other

| Type | Repository | Path |
|------|------------|------|
| Vanilla JS | [ymw0331/vanilla-javascript-20-projects](https://github.com/ymw0331/vanilla-javascript-20-projects) | 014-nasa-apod |

## Prerequisites

- Node.js >= 20.19.5
- Git
- Built parseme package (`npm run build` in `npm/` directory)

## Running Tests

### Setup

First, clone/generate all test repositories:

```bash
# From the e2e directory
npm run setup
```

This will clone all repositories and generate test projects as defined in `test-repositories-list.json`.

### Run All Tests

```bash
# From the e2e directory
npm test
```

This will run tests against all configured repositories.

### Run Specific Repository Tests

```bash
# Run tests for a specific repository
node --test tests/test-repositories.test.js -t "NestJS"
node --test tests/test-repositories.test.js -t "Next.js"
node --test tests/test-repositories.test.js -t "Axios"
```

### Manual Steps

```bash
# 1. Setup repositories
npm run setup

# 2. Build npm package (if not already built)
cd ../npm
npm run build
cd ../e2e

# 3. Run tests
npm test
```

## What Tests Validate

For each repository, tests verify:

1. **Initialization**: Can create a `parseme.config.json` file
2. **Context Generation**: Can generate context without errors
3. **Output Files**: Creates `PARSEME.md` and `parseme-context/` directory
4. **Framework Detection**: Correctly identifies the framework (or "unknown" for non-framework projects)
5. **Structure Analysis**: Generates `structure.json` with analyzed file data
6. **Endpoint Detection**: Detects API routes with minimum thresholds (when applicable)

## Test Configuration

All test repositories are configured in `test-repositories-list.json`. Each entry specifies:

- **type**: Either `"clone"` (from GitHub) or `"generate"` (using CLI tools)
- **repo**: GitHub repository URL (for clone type)
- **branch**: Git branch to clone
- **path**: Subdirectory within the repository (if needed)
- **generate**: Command and arguments (for generate type)
- **modifications**: (Optional) Modifications to apply after cloning
  - `package.json`: Object with properties to add/merge into package.json
- **assertions**: Expected test outcomes
  - `shouldDetectFramework`: Expected framework name or "unknown"
  - `shouldHaveEndpoints`: Whether endpoints should be detected
  - `minEndpoints`: Minimum number of endpoints to detect

### Repository Modifications

Some test repositories require modifications to validate specific functionality. For example, the Express repository has modifications applied to test git diff functionality:

```json
"modifications": {
  "package.json": {
    "gitDiff-test": "added"
  }
}
```

These modifications are applied automatically during the setup process.

## Cleaning Up

Generated files are automatically cleaned before tests. To manually clean:

```bash
# Remove all cloned/generated repositories
rm -rf repos/

# Or remove only generated parseme files
rm -rf repos/*/PARSEME.md repos/*/parseme-context repos/*/parseme.config.json
```

## Notes

- Tests run with `CI=true` environment to skip interactive prompts
- Generated projects use `--no-git` flag for faster execution
- Each repository runs independent tests in parallel
- Framework detection is case-sensitive in assertions
