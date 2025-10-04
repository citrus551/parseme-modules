# PARSEME

AI Project Context Generator - Automated context generation for AI coding assistants.

PARSEME analyzes your TypeScript/JavaScript projects and generates a PARSEME.md file—a README.md for AI agents. This file provides comprehensive context documentation that helps AI assistants understand your codebase structure, architecture, and patterns. By providing persistent, reusable context, PARSEME prevents AI agents from repeatedly analyzing your codebase from scratch—saving valuable tokens and improving efficiency for every interaction.

## Development Status

**This project is currently in active development and pre-alpha phase.**

The core functionality is working, but expect:

- Breaking changes in configuration format
- API modifications as the interface gets refined
- Additional features being added regularly
- Possible bugs and edge cases

### Feedback Welcome!

Your feedback is **highly appreciated** and helps shape the future of this tool! Please:

- [Report bugs or issues](https://github.com/citrus551/parseme-modules/issues)
- [Suggest features or improvements](https://github.com/citrus551/parseme-modules/discussions)
- For other inquiries, contact: mail.citrus551@passmail.net

## Features

- **Universal Pattern Detection** - Dynamic code analysis that works across any JavaScript/TypeScript framework
- **Project Analysis** - AST-based code analysis with automatic endpoint, component, and service discovery
- **Framework Agnostic** - No framework-specific dependencies - works with any codebase structure
- **Configurable Output** - Multi-file context generation optimized for AI assistants
- **Git Integration** - Includes repository status and change tracking
- **Configurable** - Comprehensive configuration options via JavaScript, TypeScript, or JSON
- **Dev Tool Integration** - Works seamlessly as an npm script

### **What PARSEME Detects**

PARSEME uses AST analysis to identify:

- **API Endpoints** - HTTP routes, GraphQL resolvers, RPC methods
- **Components** - UI components across all major frameworks
- **Services** - Business logic classes and service functions
- **Data Models** - Interfaces, types, schemas, DTOs
- **Middleware** - Request/response handlers and interceptors
- **Utilities** - Helper functions, hooks, composables
- **Project Structure** - Organized by detected patterns and purpose

## **Language Support**

- **TypeScript** - Full support including advanced types, decorators, interfaces
- **JavaScript (ES6+)** - Modern JavaScript with all ES features
- **JSX/TSX** - React and other JSX-based frameworks
- **Mixed codebases** - Projects with both JS and TS files

## Supported Projects

PARSEME aims to automatically analyse any JavaScript or TypeScript project like:

### **Backend APIs**

- **NestJS** - Controllers, services, decorators, dependency injection
- **Express.js** - Routes, middleware, error handlers
- **Fastify** - Route registration, plugins, hooks
- **Koa.js** - Context-based middleware, routing
- **Hapi.js** - Route configuration, server plugins
- **Custom frameworks** - Any HTTP endpoint patterns

### **Frontend Applications**

- **React** - Components (functional & class), hooks, JSX patterns
- **Vue.js** - Components (Composition & Options API), composables
- **Angular** - Components, services, decorators, modules
- **Svelte** - Components, stores, reactive patterns
- **Lit** - Web components, custom elements
- **Vanilla JS/TS** - Any component or module patterns

### **NPM Packages & Libraries**

- **TypeScript libraries** - Interfaces, types, utility functions
- **JavaScript utilities** - Helper functions, class libraries
- **Node.js modules** - CommonJS and ES modules
- **Monorepo packages** - Lerna, Nx, Rush, Turborepo

### **Development Tools**

- **CLI applications** - Command-line tools and scripts
- **Build tools** - Webpack plugins, Vite configurations
- **Desktop applications** - Electron, Tauri apps
- **Testing utilities** - Jest plugins, test helpers

### **Fullstack Frameworks**

- **Next.js** - Pages, API routes, middleware, components
- **Nuxt.js** - Vue-based fullstack applications
- **SvelteKit** - Svelte-based fullstack applications
- **Remix** - React-based fullstack applications

## Installation

```bash
npm install --save-dev parseme
```

## Quick Start

1. **Initialize configuration**:

   ```bash
   npx parseme init
   ```

   You'll be prompted for:
   - Context directory path (default: `parseme-context`)
   - Exclude patterns (default: `node_modules/**`, `.git/**` - patterns from `.gitignore` will be ignored by default as well)

   A minimal config file will be created with only your custom settings.

   Setup tips will be displayed:
   - How to add parseme script to package.json
   - How to integrate with git hooks
   - README section to help AI agents find context

2. **Add to your package.json scripts** (optional, for easier execution):

   ```json
   {
     "scripts": {
       "parseme": "parseme"
     }
   }
   ```

3. **Generate context**:
   ```bash
   npm run parseme
   # or
   npx parseme
   ```

This creates:

- `PARSEME.md` - Main overview with links to context files
- `parseme-context/` - Structured data files (AST, dependencies, routes, git info)

## Configuration

PARSEME supports multiple configuration formats with automatic discovery and priority handling.

The `parseme init` command creates a minimal config with only your custom settings. Defaults are applied automatically at runtime.

**Minimal config example** (created by `parseme init`):

```javascript
/** @type {import('parseme').ParsemeConfigFile} */
const config = {
  contextDir: 'parseme-context',
  excludePatterns: ['node_modules/**', '.git/**'],
};

export default config;
```

**Full config example** (all available options):

```javascript
/** @type {import('parseme').ParsemeConfigFile} */
const config = {
  // Output settings
  outputPath: 'PARSEME.md',
  contextDir: 'parseme-context',

  // Analysis settings
  rootDir: './',
  includePatterns: ['src/**/*.ts', 'src/**/*.js', 'package.json'],
  excludePatterns: ['node_modules/**', 'dist/**', '**/*.test.ts'],
  maxDepth: 10,

  // Git integration
  includeGitInfo: true,

  // AI-friendly size limits
  limits: {
    maxLinesPerFile: 1000,
    maxCharsPerFile: 50000,
    maxFilesPerContext: 20,
    truncateStrategy: 'truncate', // 'truncate' | 'split' | 'summarize'
  },

  // Content sections (all default to true)
  sections: {
    overview: true,
    architecture: true,
    routes: true,
    dependencies: true,
    git: true,
    fileStructure: true,
  },

  // Style options
  style: {
    includeLineNumbers: false,
    includeFileStats: true,
    groupByType: true,
    sortOrder: 'type', // 'alphabetical' | 'type' | 'size'
  },
};

export default config;
```

### Configuration File Formats & Priority

PARSEME supports three configuration formats with the following priority:

1. **JSON** (`.json`) - `parseme.config.json`, `.parsemerc.json`, `.parsemerc`
2. **TypeScript** (`.ts`) - `parseme.config.ts`, `.parsemerc.ts`
3. **JavaScript** (`.js`) - `parseme.config.js`, `.parsemerc.js`

#### JSON Configuration

```json
{
  "outputPath": "PARSEME.md",
  "contextDir": "parseme-context",
  "includePatterns": ["src/**/*.ts"]
}
```

#### TypeScript Configuration

```typescript
import type { ParsemeConfigFile } from 'parseme';

const config: ParsemeConfigFile = {
  outputPath: 'PARSEME.md',
  includePatterns: ['src/**/*.ts'],
  // ... other options
};

export default config;
```

#### JavaScript Configuration

```javascript
/** @type {import('parseme').ParsemeConfigFile} */
const config = {
  outputPath: 'PARSEME.md',
  includePatterns: ['src/**/*.ts'],
  // ... other options
};

export default config;
```

### Configuration Priority

Configuration values are resolved in the following order (highest to lowest priority):

1. **CLI flags** - `--output`, `--root`, `--config`, etc.
2. **Config file** - Based on file format priority above
3. **Default values** - Built-in sensible defaults

**Example**: `npx parseme --output custom.md` overrides `outputPath` from config file.

### Configuration Options

#### Output Settings

- `outputPath` - Where to save the main PARSEME.md file (default: `"PARSEME.md"`)
- `contextDir` - Directory for detailed context files (default: `"parseme-context"`)

#### Analysis Settings

- `rootDir` - Project root directory (default: `process.cwd()`)
- `includePatterns` - Glob patterns for files to analyze (default: `['src/**/*.ts', 'src/**/*.js', 'src/**/*.tsx', 'src/**/*.jsx', 'lib/**/*.ts', 'lib/**/*.js', 'package.json', 'tsconfig.json', 'README.md']`)
- `excludePatterns` - Glob patterns for files to ignore (default: `['node_modules/**', '.git/**']` plus patterns from `.gitignore` if available)
- `maxDepth` - Maximum directory depth to traverse (default: `10`)

#### Git Integration

- `includeGitInfo` - Include git repository information (default: `true`)

#### Content Sections

Toggle which sections to include in the output (all default to `true`):

- `sections.overview` - Project overview and metadata
- `sections.architecture` - File type breakdown
- `sections.routes` - API endpoints and routing
- `sections.dependencies` - Package dependencies
- `sections.git` - Repository information
- `sections.fileStructure` - Detailed file listing

#### Style Options

- `style.includeLineNumbers` - Add line numbers to code references (default: `false`)
- `style.includeFileStats` - Include file statistics (default: `true`)
- `style.groupByType` - Group files by detected type (default: `true`)
- `style.sortOrder` - Sort order: `"alphabetical"`, `"type"`, or `"size"` (default: `"type"`)

#### Size Limits

AI-friendly size limits to prevent token overflow:

- `limits.maxLinesPerFile` - Maximum lines per file (default: `1000`)
- `limits.maxCharsPerFile` - Maximum characters per file (default: `50000`)
- `limits.maxFilesPerContext` - Maximum files per context (default: `20`)
- `limits.truncateStrategy` - Strategy: `"truncate"`, `"split"`, or `"summarize"` (default: `"truncate"`)

## Output Format

PARSEME always generates multi-file output:

- `PARSEME.md` - Main overview with links to context files (Markdown)
- Context directory (default: `parseme-context/`) with structured data files:
  - `files.md` - Complete list of analyzed files (Markdown)
  - `structure.json` - AST analysis with exports, imports, functions, and classes (JSON)
  - `api-endpoints.json` - API routes with methods, paths, and handlers (JSON, only if routes detected)
  - `dependencies.json` - Production dependencies with versions (JSON)
  - `framework.json` - Framework details if detected (JSON, optional)
  - `gitDiff.md` - Git diff statistics from generation time (Markdown, if git enabled)

The context directory location can be customized via the `contextDir` configuration option.

## CLI Commands

```bash
# Generate context (auto-detects config file)
npx parseme

# Initialize configuration (JSON by default)
npx parseme init

# Initialize with TypeScript format
npx parseme init --format ts

# Initialize with JavaScript format
npx parseme init --format js

# Use custom config file
npx parseme --config custom.config.js

# If added to package.json scripts, use npm run
npm run parseme

# Auto-generate context with git hooks (when configured)
# Runs automatically after each commit

# Override config with CLI flags
npx parseme --output custom.md --context-dir docs/context --root ./src --no-git

# Include/exclude patterns
npx parseme --include "src/**/*.ts" --exclude "**/*.test.ts"
```

### CLI Options

#### Main Command (`parseme`)

- `-c, --config <path>` - Config file path
- `-o, --output <path>` - Output file path
- `-r, --root <path>` - Root directory to analyze
- `--context-dir <path>` - Context directory path (default: parseme-context)
- `--include <patterns...>` - Include patterns (glob)
- `--exclude <patterns...>` - Exclude patterns (glob)
- `--no-git` - Disable git information
- `--max-depth <number>` - Maximum directory depth

#### Init Command (`parseme init`)

- `-f, --force` - Overwrite existing config
- `--format <format>` - Config format: json, ts, or js (default: json)

### Interactive Configuration

When running `parseme init` interactively (TTY, not CI), you'll be prompted to configure:

- **Context directory** - Where to store context files (default: `parseme-context`)
- **Exclude patterns** - Comma-separated glob patterns (default: `node_modules/**`, `.git/**` - patterns from `.gitignore` will be ignored by default as well)

After initialization, setup tips are displayed:

- Package.json script suggestion
- Git hook integration suggestion
- README.md section suggestion for AI agents

## Framework Support

PARSEME automatically detects and provides specialized analysis for:

### Express.js

- Route detection (`app.get`, `router.post`, etc.)
- Middleware identification
- Request handler mapping

### NestJS

- Controller and decorator analysis
- Module structure detection
- Dependency injection mapping

### Fastify

- Route registration detection
- Plugin identification
- Hook analysis

### Koa & Hapi

- Route and middleware detection
- Framework-specific patterns

## Programmatic API

You can also use PARSEME programmatically:

```typescript
import { ParsemeGenerator } from 'parseme';

const generator = await ParsemeGenerator.fromConfig('./custom.config.js');
const context = await generator.generate();

// Or generate directly to file
await generator.generateToFile('./output/PARSEME.md');
```

## Git Hook Integration

Keep your AI context automatically updated by adding parseme as a post-commit hook:

### Manual Setup

```bash
# Create and make executable
echo '#!/bin/sh\nnpx parseme' > .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

### Using Husky

```json
// package.json
{
  "husky": {
    "hooks": {
      "post-commit": "npx parseme"
    }
  }
}
```

This automatically regenerates your AI context files after every commit, ensuring they're always up-to-date!

## Requirements

- Node.js ≥20.19.5
- npm ≥10.8.2

## License

MIT
