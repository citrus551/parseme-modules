# PARSEME

**Local code analysis and context generation to improve token efficiency of AI Coding agents
Cross-project access via Cloud MCP**

PARSEME analyzes your TypeScript/JavaScript projects and generates a PARSEME.md file—a README.md for AI agents. This file provides comprehensive context documentation that helps AI assistants understand your codebase structure, architecture, and patterns. By providing persistent, reusable context, PARSEME prevents AI agents from repeatedly analyzing your codebase from scratch—saving valuable tokens and improving efficiency for every interaction.

## Table of Contents

- [Development Status](#development-status)
- [Features](#features)
  - [What PARSEME Detects](#what-parseme-detects)
  - [Language Support](#language-support)
  - [Supported Projects](#supported-projects)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Automation Options](#automation-options)
  - [Option 1: Manual Execution](#option-1-manual-execution)
  - [Option 2: Automatic Local Generation](#option-2-automatic-local-generation)
  - [Option 3: Automatic Local and Remote Generation (Advanced Git Hooks)](#option-3-automatic-local-and-remote-generation-advanced-git-hooks)
  - [Option 4: GitHub Actions for Remote Generation paired with Local Generation](#option-4-github-actions-for-remote-generation-paired-with-local-generation)
- [Configuration](#configuration)
  - [Configuration File Formats & Priority](#configuration-file-formats--priority)
  - [Configuration Priority](#configuration-priority)
  - [Configuration Options](#configuration-options)
  - [CLI Options](#cli-options)
  - [Interactive Configuration](#interactive-configuration)
- [CLI Commands](#cli-commands)
- [Programmatic API](#programmatic-api)
- [Output Format](#output-format)
- [AI Agent Integration](#ai-agent-integration)
- [Requirements](#requirements)
- [License](#license)

## Development Status

**This project is currently in active development.**

The core functionality is working, but expect:

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

**Note:** PARSEME provides specialized analysis for **Express.js**, **NestJS**, and **Fastify**, including route detection, middleware identification, and decorator analysis. All other frameworks benefit from universal AST-based analysis.

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
   - AI agent configuration files to reference PARSEME.md

2. **Generate context**:
   ```bash
   npx parseme generate
   # or use the alias
   npx parseme g
   ```

This creates:

- `PARSEME.md` - Main overview with links to context files
- `parseme-context/` - Structured data files (file list, AST structure, routes, git diff)

## Automation Options

PARSEME can be integrated into your workflow in several ways, from manual execution to fully automated generation. Choose the approach that best fits your needs:

### Option 1: Manual Execution

Run parseme manually whenever you need updated context.

**Setup:**

Add to your `package.json` scripts (optional, for convenience):

```json
{
  "scripts": {
    "parseme": "parseme generate"
  }
}
```

**Usage:**

```bash
npm run parseme
# or directly
npx parseme generate
```

**Best for:** Small projects, occasional updates, or when you prefer full control over when context is generated.

---

### Option 2: Automatic Local Generation

Automatically generate parseme files locally after every commit. Files are committed to the repository.

**Setup with Husky:**

```bash
# Install Husky (if not already installed)
npm install --save-dev husky
npx husky init

# Create post-commit hook
cat > .husky/post-commit << 'EOF'
#!/bin/sh

# Generate PARSEME files locally after commit
npx parseme generate
EOF

# Make hook executable
chmod +x .husky/post-commit
```

**Setup with manual git hooks:**

```bash
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh

npx parseme generate
EOF

chmod +x .git/hooks/post-commit
```

**How it works:**

- After each commit, parseme automatically generates context files with full git info
- Files are ready to be staged and committed with your next commit
- Simple setup with minimal configuration

**Best for:** Solo developers or small teams wanting automatic local updates with committed parseme files.

**Note:** If using a custom `contextDir`, ensure the path is consistent across your team's configuration.

---

### Option 3: Automatic Local and Remote Generation (Advanced Git Hooks)

Automatically update parseme files locally and remotely with git hooks. Keeps the remote version clean (without git-specific info) while maintaining full context locally. Uses multiple git hooks to manage local vs remote state.

**Setup with Husky:**

```bash
# Install Husky (if not already installed)
npm install --save-dev husky
npx husky init

# Create post-commit hook
cat > .husky/post-commit << 'EOF'
#!/bin/sh

npx parseme generate
EOF

# Create pre-push hook
cat > .husky/pre-push << 'EOF'
#!/bin/sh

# Regenerate without git info for clean remote state
npx parseme generate --no-git-info

# Stage parseme files
git add parseme-context/ PARSEME.md

# Amend the commit with updated parseme files
git commit --amend --no-edit --no-verify
EOF

# Create post-push hook
cat > .husky/post-push << 'EOF'
#!/bin/sh

# Regenerate with git info for local development
npx parseme generate
EOF

# Make hooks executable
chmod +x .husky/post-commit .husky/pre-push .husky/post-push
```

**Setup with manual git hooks:**

```bash
# Post-commit: Generate context with git info after each commit
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh

npx parseme generate
EOF

# Pre-push: Regenerate without git info and amend before pushing
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh

# Regenerate without git info for clean remote state
npx parseme generate --no-git-info

# Stage parseme files
git add parseme-context/ PARSEME.md

# Amend the commit with updated parseme files
git commit --amend --no-edit --no-verify
EOF

# Post-push: Restore git info locally after push completes
cat > .git/hooks/post-push << 'EOF'
#!/bin/sh

# Regenerate with git info for local development
npx parseme generate
EOF

# Make hooks executable
chmod +x .git/hooks/post-commit .git/hooks/pre-push .git/hooks/post-push
```

**How it works:**

1. **post-commit**: Generates context files with full git info locally
2. **pre-push**: Regenerates without git info and amends the commit before pushing
3. **post-push**: Restores full git info locally after push completes

The `--no-verify` flag in pre-push prevents an infinite loop by skipping hook execution on the amend.

**Best for:** Teams that want detailed local context for development while keeping clean, portable context in the repository.

**Note:** If using a custom `contextDir`, update the `git add` path in the pre-push hook (e.g., `git add docs/context/ PARSEME.md`).

---

### Option 4: GitHub Actions for Remote Generation paired with Local Generation

Use GitHub Actions to automatically manage remote parseme files while keeping them updated locally with git hooks. This is the recommended approach for teams using GitHub.

**Setup:**

**1. Add parseme files to `.gitignore`:**

```gitignore
# Parseme documentation (generated locally and by CI)
parseme-context/
PARSEME.md
```

**2. Create `.github/workflows/parseme-update.yml`:**

```yaml
name: Update PARSEME Documentation

on:
  push:
    branches:
      - main

jobs:
  update-parseme:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    env:
      GITHUB_TOKEN: ${{ secrets.GH_SERVICE_ACCOUNT_TOKEN }}

    steps:
      - name: Check if pusher is service account
        id: check_pusher
        run: |
          if [ "${{ github.event.pusher.name }}" = "${{ secrets.GH_SERVICE_ACCOUNT_USERNAME }}" ]; then
            echo "is_bot=true" >> $GITHUB_OUTPUT
          else
            echo "is_bot=false" >> $GITHUB_OUTPUT
          fi

      - name: Checkout code
        if: steps.check_pusher.outputs.is_bot == 'false'
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GH_SERVICE_ACCOUNT_TOKEN }}

      - name: Setup Node.js
        if: steps.check_pusher.outputs.is_bot == 'false'
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Configure Git
        if: steps.check_pusher.outputs.is_bot == 'false'
        run: |
          git config user.name "${{ secrets.GH_SERVICE_ACCOUNT_USERNAME }}"
          git config user.email "${{ secrets.GH_SERVICE_ACCOUNT_USERNAME }}@users.noreply.github.com"

      - name: Install dependencies
        if: steps.check_pusher.outputs.is_bot == 'false'
        run: npm ci

      - name: Generate ParseMe documentation
        if: steps.check_pusher.outputs.is_bot == 'false'
        run: npx parseme generate --no-git-info

      - name: Force add parseme files (ignored in .gitignore)
        if: steps.check_pusher.outputs.is_bot == 'false'
        run: git add -f parseme-context/ PARSEME.md

      - name: Check for changes
        if: steps.check_pusher.outputs.is_bot == 'false'
        id: check_changes
        run: |
          if git diff --cached --quiet; then
            echo "changes=false" >> $GITHUB_OUTPUT
          else
            echo "changes=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit and amend
        if: steps.check_pusher.outputs.is_bot == 'false' && steps.check_changes.outputs.changes == 'true'
        run: |
          git commit --amend --no-edit --no-verify
          git push --force-with-lease
```

**3. Configure GitHub secrets:**

- `GH_SERVICE_ACCOUNT_TOKEN`: A GitHub personal access token with repo write permissions
- `GH_SERVICE_ACCOUNT_USERNAME`: The username of your service account (to prevent infinite loops)

**4. Setup local git hooks with Husky:**

```bash
# Install Husky (if not already installed)
npm install --save-dev husky
npx husky init

# Create post-commit hook
cat > .husky/post-commit << 'EOF'
#!/bin/sh

# Generate PARSEME files locally after commit
npx parseme generate
EOF

# Create post-merge hook
cat > .husky/post-merge << 'EOF'
#!/bin/sh

# Untrack parseme files after merge/pull to keep them gitignored locally
git rm --cached -r parseme-context/ PARSEME.md 2>/dev/null || true
EOF

# Make hooks executable
chmod +x .husky/post-commit .husky/post-merge
```

**How it works:**

1. **Local development**: Parseme files are generated locally after each commit with full git info
2. **Ignored by git**: Files are listed in `.gitignore` so they're not committed manually
3. **Remote updates**: GitHub Actions automatically generates and commits parseme files (without git info) when pushing to main
4. **After pull/merge**: The post-merge hook ensures parseme files stay untracked locally, preventing conflicts

**Best for:** Teams using GitHub that want automated CI-managed remote updates with local context for development.

**Notes:**

- The workflow only runs on the `main` branch (adjust as needed for your branching strategy)
- If using a custom `contextDir`, update both the `.gitignore` entry, the workflow's `git add -f` path, and the post-merge hook's `git rm --cached -r` path accordingly

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
- AI agent configuration files to reference PARSEME.md

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

## Programmatic API

You can also use PARSEME programmatically:

```typescript
import { ParsemeGenerator } from 'parseme';

const generator = await ParsemeGenerator.fromConfig('./custom.config.js');
const context = await generator.generate();

// Or generate directly to file
await generator.generateToFile('./output/PARSEME.md');
```

## Output Format

PARSEME generates the following output files:

- `PARSEME.md` - Main overview with links to context files and project summary (Markdown)
- Context directory (default: `parseme-context/`) with structured data files:
  - `files.md` - Complete list of all project files (Markdown)
  - `structure.json` - AST analysis with exports, imports, functions, classes, and route references (JSON)
  - `routes.json` - API routes with methods, paths, and handlers (JSON, only if routes detected)
  - `gitDiff.md` - Git diff statistics from generation time (Markdown, only if git is enabled and changes exist)

The context directory location can be customized via the `contextDir` configuration option.

## AI Agent Integration

To help AI coding assistants efficiently understand your codebase structure and context, add instructions to your agent configuration files:

### Claude Code (`.claude/README.md` or `.claude/instructions.md`)

```markdown
Read PARSEME.md and parseme-context/ to understand the codebase structure and context.
```

### GitHub Copilot (`.github/copilot-instructions.md`)

```markdown
Read PARSEME.md and parseme-context/ to understand the codebase structure and context.
```

### Cursor (`.cursorrules`)

```
Read PARSEME.md and parseme-context/ to understand the codebase structure and context.
```

### ChatGPT / Custom GPT

Add to project instructions or system prompt:

```
Read PARSEME.md and parseme-context/ to understand the codebase structure and context.
```

This ensures AI assistants use your pre-generated context for efficient codebase understanding.

## Requirements

- Node.js ≥20.19.5 <21 || ≥22.21.1
- npm ≥10.8.2

## License

MIT
