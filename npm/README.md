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
- **Highly Configurable** - Comprehensive configuration options via JavaScript, TypeScript, or JSON
- **Dev Tool Integration** - Works seamlessly as an npm script

### 🔍 **What PARSEME Detects**

PARSEME uses AST analysis to identify:

- **📡 API Endpoints** - HTTP routes, GraphQL resolvers, RPC methods
- **🧩 Components** - UI components across all major frameworks
- **⚙️ Services** - Business logic classes and service functions
- **📋 Data Models** - Interfaces, types, schemas, DTOs
- **🔗 Middleware** - Request/response handlers and interceptors
- **🛠️ Utilities** - Helper functions, hooks, composables
- **📁 Project Structure** - Organized by detected patterns and purpose

## **Language Support**

- **TypeScript** - Full support including advanced types, decorators, interfaces
- **JavaScript (ES6+)** - Modern JavaScript with all ES features
- **JSX/TSX** - React and other JSX-based frameworks
- **Mixed codebases** - Projects with both JS and TS files

## Supported Projects

PARSEME aims to automatically analyse any JavaScript or TypeScript project:

### 🖥️ **Backend APIs**

- **NestJS** - Controllers, services, decorators, dependency injection
- **Express.js** - Routes, middleware, error handlers
- **Fastify** - Route registration, plugins, hooks
- **Koa.js** - Context-based middleware, routing
- **Hapi.js** - Route configuration, server plugins
- **Custom frameworks** - Any HTTP endpoint patterns

### 🎨 **Frontend Applications**

- **React** - Components (functional & class), hooks, JSX patterns
- **Vue.js** - Components (Composition & Options API), composables
- **Angular** - Components, services, decorators, modules
- **Svelte** - Components, stores, reactive patterns
- **Lit** - Web components, custom elements
- **Vanilla JS/TS** - Any component or module patterns

### 📦 **NPM Packages & Libraries**

- **TypeScript libraries** - Interfaces, types, utility functions
- **JavaScript utilities** - Helper functions, class libraries
- **Node.js modules** - CommonJS and ES modules
- **Monorepo packages** - Lerna, Nx, Rush, Turborepo

### 🛠️ **Development Tools**

- **CLI applications** - Command-line tools and scripts
- **Build tools** - Webpack plugins, Vite configurations
- **Desktop applications** - Electron, Tauri apps
- **Testing utilities** - Jest plugins, test helpers

### 🏗️ **Fullstack Frameworks**

- **Next.js** - Pages, API routes, middleware, components
- **Nuxt.js** - Vue-based fullstack applications
- **SvelteKit** - Svelte-based fullstack applications
- **Remix** - React-based fullstack applications
-

## Development Status

**This project is currently in active development and beta phase.**

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
- Share your use cases and experiences
- Star the repo if you find it useful

## Installation

```bash
npm install --save-dev parseme
```

## Quick Start

1. **Initialize configuration**:

   ```bash
   npx parseme init
   ```

   This command will:
   - Create a configuration file (`parseme.config.js` by default)
   - Display setup tips for package.json scripts and git hooks

2. **Add to your package.json scripts** (for easier manual execution or hook integration):

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
   ```

This will create a `PARSEME.md` file and a `parseme-context/` directory with comprehensive project context.

## Configuration

PARSEME supports multiple configuration formats with automatic discovery and priority handling.

```javascript
/** @type {import('parseme').ParsemeConfigFile} */
export default {
  // Output settings
  outputPath: 'PARSEME.md',
  contextDir: 'parseme-context', // or "docs/context", "/absolute/path"

  // Analysis settings
  includePatterns: ['src/**/*.ts', 'src/**/*.js', 'package.json'],
  excludePatterns: ['node_modules/**', 'dist/**', '**/*.test.ts'],

  // AI-friendly size limits
  limits: {
    maxLinesPerFile: 1000,
    maxCharsPerFile: 50000,
    maxFilesPerContext: 20,
    truncateStrategy: 'split', // or 'truncate'
  },

  // Content sections
  sections: {
    overview: true,
    architecture: true,
    routes: true,
    dependencies: true,
    git: true,
    fileStructure: true,
  },
};
```

### Configuration File Formats & Priority

PARSEME supports three configuration formats with the following priority:

1. **TypeScript** (`.ts`) - `parseme.config.ts`, `.parsemerc.ts`
2. **JavaScript** (`.js`) - `parseme.config.js`, `.parsemerc.js`
3. **JSON** (`.json`) - `parseme.config.json`, `.parsemerc.json`, `.parsemerc`

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

#### JSON Configuration

```json
{
  "outputPath": "PARSEME.md",
  "contextDir": "parseme-context",
  "includePatterns": ["src/**/*.ts"]
}
```

### Configuration Priority

Configuration values are resolved in the following order (highest to lowest priority):

1. **CLI flags** - `--output`, `--root`, `--include`, etc.
2. **Config file** - Based on file format priority above
3. **Default values** - Built-in sensible defaults

**Example**: `npx parseme --output custom.md` overrides `outputPath` from config file.

### Configuration Options

#### Output Settings

- `outputPath` - Where to save the main PARSEME.md file (default: "PARSEME.md")
- `contextDir` - Directory for detailed context files (default: "parseme-context")

#### Analysis Settings

- `rootDir` - Project root directory (default: current directory)
- `includePatterns` - Glob patterns for files to analyze
- `excludePatterns` - Glob patterns for files to ignore
- `maxDepth` - Maximum directory depth to traverse

#### Framework Settings

Configure framework-specific analysis:

- **Express**: `detectMiddleware`, `documentRoutes`
- **NestJS**: `includeDecorators`, `documentModules`
- **Fastify**: `includePlugins`

#### Content Sections

Toggle which sections to include:

- `overview` - Project overview and metadata
- `architecture` - File type breakdown
- `routes` - API endpoints and routing
- `dependencies` - Package dependencies
- `git` - Repository information
- `fileStructure` - Detailed file listing

#### Style Options

- `includeLineNumbers` - Add line numbers to code references
- `includeFileStats` - Include file statistics
- `groupByType` - Group files by detected type
- `sortOrder` - "alphabetical", "type", or "size"

## Output Format

PARSEME always generates multi-file output:

- `PARSEME.md` - Main overview and summary (Markdown format)
- Context directory (default: `parseme-context/`) with detailed JSON files:
  - `structure.json` - Detailed AST analysis with file exports, imports, functions, and classes
  - `routes.json` - API routes documentation with methods, paths, and handlers
  - `dependencies.json` - Production dependency analysis with package versions
  - `git.json` - Git repository information with branch, status, and changed files

The context directory location can be customized via the `contextDir` configuration option.

## CLI Commands

```bash
# Generate context (auto-detects config file)
npx parseme

# Initialize configuration (JavaScript by default)
npx parseme init

# Initialize with TypeScript format
npx parseme init --format ts

# Initialize with JSON format
npx parseme init --format json

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

- `-c, --config <path>` - Config file path
- `-o, --output <path>` - Output file path
- `-r, --root <path>` - Root directory to analyze
- `--context-dir <path>` - Context directory path (default: parseme-context)
- `--include <patterns...>` - Include patterns (glob)
- `--exclude <patterns...>` - Exclude patterns (glob)
- `--no-git` - Disable git information
- `--max-depth <number>` - Maximum directory depth
- `--no-readme-suggestion` - Disable README.md section suggestion

### Interactive Configuration

When the README suggestion setting is not configured and you're running parseme interactively, you'll be prompted to configure:

- **README suggestion** - Whether to show the README.md section suggestion for AI agents

The prompt is automatically disabled in:

- CI environments (when `CI=true`)
- Non-interactive terminals (no TTY)
- When the value is explicitly provided via CLI flags or config files

Example interactive session:

```
$ npx parseme

Show README.md section suggestion for AI agents? [y]: y

Context generated successfully
```

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

## Integration Examples

### Basic Express Project

```javascript
// parseme.config.js
export default {
  includePatterns: ['src/**/*.js', 'routes/**/*.js', 'middleware/**/*.js'],
  frameworks: {
    express: {
      detectMiddleware: true,
      documentRoutes: true,
    },
  },
};
```

### TypeScript NestJS Project

```javascript
// parseme.config.js
export default {
  includePatterns: ['src/**/*.ts', '!src/**/*.spec.ts'],
  frameworks: {
    nestjs: {
      includeDecorators: true,
      documentModules: true,
    },
  },
  sections: {
    overview: true,
    architecture: true,
    routes: true,
    dependencies: true,
  },
};
```

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
