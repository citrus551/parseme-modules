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

- **Project Analysis** - AST-based code analysis with automatic endpoint, component, and service discovery
- **Universal Pattern Detection** - Dynamic code analysis that works across many JavaScript/TypeScript frameworks
- **Git Integration** - Includes repository status and change tracking
- **Configurable** - Comprehensive configuration options via JavaScript, TypeScript, or JSON
- **Dev Tool Integration** - Works seamlessly as a npm script

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
- **JavaScript (ES6+)** - Modern JavaScript with ES features
- **JSX/TSX** - React and other JSX-based frameworks
- **Mixed codebases** - Projects with both JS and TS files

## Supported Projects

PARSEME aims to automatically analyse any JavaScript or TypeScript project like:

### **Backend APIs**

- **NestJS** - Controllers, services, decorators, dependency injection
- **Express.js** - Routes, middleware, error handlers
- **Fastify** - Route registration, plugins, hooks

### **Frontend Applications**

- **React** - Components (functional & class), hooks, JSX patterns
- **Vue.js** - Components (Composition & Options API), composables
- **Angular** - Components, services, decorators, modules
- **Svelte** - Components, stores, reactive patterns
- **Lit** - Web components, custom elements
- **Vanilla JS/TS** - Functions, classes, modules, event handlers

### **Fullstack Frameworks**

- **Next.js** - Pages, API routes, middleware, components
- **Nuxt.js** - Pages, server routes, composables, components

### **Packages & Libraries**

- **TypeScript utilities** - Types, interfaces, enums, generic helpers
- **JavaScript helpers** - Functions, classes, utilities, data manipulation
- **Node.js modules** - Exports, imports, CommonJS/ESM patterns
- **Monorepo packages** - Shared utilities, cross-package dependencies

### **Development Tools**

- **CLI tools** - Commands, options, argument parsing
- **Build plugins** - Plugin functions, configuration handlers
- **Desktop apps** - Main processes, renderers, IPC handlers
- **Testing utilities** - Test functions, mocks, utilities, custom matchers

## Installation

```bash
npm install --save-dev parseme
```

## Quick Start

1. **Initialize configuration**:

   ```bash
   npx parseme init
   # or use the alias
   npx parseme i
   ```

   You'll be prompted for:
   - Context directory path (default: `parseme-context`)
   - Exclude patterns (default: `node_modules/**`, `dist/**`, `.git/**` - in git repositories, additional patterns on top of git-tracked files)

   A minimal config file will be created with only your custom settings.

   Setup tips will be displayed:
   - How to add parseme script to package.json
   - How to integrate with git hooks
   - README section to help AI agents find context

2. **Add to your package.json scripts** (optional, for easier execution):

   ```json
   {
     "scripts": {
       "parseme": "parseme generate"
     }
   }
   ```

3. **Generate context**:
   ```bash
   npm run parseme
   # or
   npx parseme generate
   # or use the alias
   npx parseme g
   ```

This creates:

- `PARSEME.md` - Main overview with links to context files
- `parseme-context/` - Structured data files (file list, AST structure, routes, git diff)

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
  analyzeFileTypes: ['ts', 'tsx', 'js', 'jsx'],
  excludePatterns: ['**/*.test.ts', 'dist/**'],
  maxDepth: 10,

  // Git integration
  includeGitInfo: true, // Include git repository information in context
  useGitForFiles: true, // Use git to discover files (respects .gitignore)

  // Size limits
  limits: {
    maxFilesPerContext: 5000,
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

#### Example JSON Configuration

```json
{
  "contextDir": "parseme-context",
  "excludePatterns": ["node_modules/**", "dist/**", ".git/**"]
}
```

#### Example TypeScript Configuration

```typescript
import type { ParsemeConfigFile } from 'parseme';

const config: ParsemeConfigFile = {
  contextDir: 'parseme-context',
  excludePatterns: ['node_modules/**', 'dist/**', '.git/**'],
  // ... other options
};

export default config;
```

#### Example JavaScript Configuration

```javascript
/** @type {import('parseme').ParsemeConfigFile} */
const config = {
  contextDir: 'parseme-context',
  excludePatterns: ['node_modules/**', 'dist/**', '.git/**'],
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
- `analyzeFileTypes` - File extensions to analyze (default and supported: `['ts', 'tsx', 'js', 'jsx']`)
- `excludePatterns` - Additional glob patterns to exclude files. In git repositories, only git-tracked files are analyzed (respecting all `.gitignore` files automatically). Use `excludePatterns` to exclude additional files beyond what git ignores.
- `maxDepth` - Maximum directory depth to traverse (default: `10`)

#### Git Integration

- `includeGitInfo` - Include git repository information in context files (default: `true`)
- `useGitForFiles` - Use git to discover files, respecting .gitignore (default: `true`)

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

- `limits.maxFilesPerContext` - Maximum number of files to analyze (default: `5000`)

## Output Format

PARSEME always generates the following output files:

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
npx parseme generate
npx parseme g  # alias

# Initialize configuration (JSON by default)
npx parseme init
npx parseme i  # alias

# Initialize with TypeScript format
npx parseme init --format ts

# Initialize with JavaScript format
npx parseme init --format js

# Use custom config file
npx parseme generate --config custom.config.js

# If added to package.json scripts, use npm run
npm run parseme

# Auto-generate context with git hooks (when configured)
# Runs automatically after each commit

# Override config with CLI flags
npx parseme generate --output custom.md --context-dir docs/context --root ./src

# Disable git info generation (keeps git for file discovery)
npx parseme generate --no-git-info

# Disable git for file discovery (keeps git info generation)
npx parseme generate --no-git-files

# Disable both git info and git file discovery
npx parseme generate --no-git-info --no-git-files

# Specify file types and exclude patterns
npx parseme generate --file-types ts js --exclude "**/*.test.ts"
```

### CLI Options

#### Generate Command (`parseme generate` or `parseme g`)

- `-c, --config <path>` - Config file path
- `-o, --output <path>` - Output file path
- `-r, --root <path>` - Root directory to analyze
- `--context-dir <path>` - Context directory path (default: parseme-context)
- `--file-types <types...>` - File types to analyze (e.g., ts tsx js jsx)
- `--exclude <patterns...>` - Additional exclude patterns (glob, in git repositories on top of git-tracked files)
- `--no-git-info` - Disable git info generation (keeps git for file discovery)
- `--no-git-files` - Disable git for file discovery (uses filesystem crawling instead)
- `--max-depth <number>` - Maximum directory depth

#### Init Command (`parseme init` or `parseme i`)

- `-f, --force` - Overwrite existing config
- `--format <format>` - Config format: json, ts, or js (default: json)

### Interactive Configuration

When running `parseme init` interactively (TTY, not CI), you'll be prompted to configure:

- **Context directory** - Where to store context files (default: `parseme-context`)
- **Exclude patterns** - Comma-separated glob patterns (default: `node_modules/**`, `dist/**`, `.git/**` - in git repositories, additional patterns on top of git-tracked files)

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
- Module structure detection w
- Dependency injection mapping

### Fastify

- Route registration detection
- Plugin identification
- Hook analysis

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

Keep your AI context automatically updated by integrating parseme with git hooks. The recommended setup uses three hooks to ensure context files always have git info locally but stay clean on remote:

### Recommended Hook Setup

#### Manual Setup

```bash
# 1. Post-commit: Generate context with git info after each commit
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh

npx parseme generate
EOF

# 2. Pre-push: Regenerate without git info and amend before pushing
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh

# Regenerate without git info for clean remote state
npx parseme generate --no-git-info

# Stage parseme files (parseme-context/ may be different if configured)
git add parseme-context/ PARSEME.md

# Amend the commit with updated parseme files
git commit --amend --no-edit --no-verify
EOF

# 3. Post-push: Restore git info locally after push completes
cat > .git/hooks/post-push << 'EOF'
#!/bin/sh

# Regenerate with git info for local development
npx parseme generate
EOF

# Make hooks executable
chmod +x .git/hooks/post-commit .git/hooks/pre-push .git/hooks/post-push
```

**Note:** If you've configured a custom `contextDir` (either in your config file or via the `--context-dir` CLI flag), update the `git add` path in the pre-push hook accordingly (e.g., `git add docs/context/ PARSEME.md`).

### Using Husky

```json
// package.json
{
  "husky": {
    "hooks": {
      "post-commit": "npx parseme generate",
      "pre-push": "npx parseme generate --no-git-info && git add parseme-context/ PARSEME.md && git commit --amend --no-edit --no-verify",
      "post-push": "npx parseme generate"
    }
  }
}
```

**Note:** If using a custom `contextDir`, update the `git add` path to match your configuration.

### How It Works

1. **post-commit**: After you commit, parseme generates context files with git info (current branch, recent commits, git diff) for local development
2. **pre-push**: Before pushing, parseme regenerates without git info (`--no-git-info` flag) and amends the commit to keep remote clean
3. **post-push**: After push completes, parseme regenerates with git info again so your local working copy maintains full context

The `--no-verify` flag in pre-push prevents an infinite loop by skipping hook execution on the amend.

This automatically keeps your AI context files synchronized with your code while maintaining clean context on remote and detailed context locally!

## Requirements

- Node.js ≥20.19.5
- npm ≥10.8.2

## License

MIT
