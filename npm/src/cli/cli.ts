#!/usr/bin/env node

import { join } from 'path';

import { Command } from 'commander';

import { ParsemeConfig } from '../core/config.js';
import { ParsemeGenerator } from '../core/generator.js';
import { prompt } from '../utils/prompt.js';

import type { ParsemeConfigFile } from '../core/types.js';

const program = new Command();

async function promptForMissingConfig(config: ParsemeConfigFile): Promise<ParsemeConfigFile> {
  return { ...config };
}

program.name('parseme').description('AI Project Context Generator').version('0.1.0');

// Generate command
program
  .command('generate')
  .alias('g')
  .description('Generate project context using config file')
  .option('-c, --config <path>', 'Config file path')
  .option('-o, --output <path>', 'Output file path')
  .option('-r, --root <path>', 'Root directory to analyze')
  .option('--context-dir <path>', 'Context directory path (default: parseme-context)')
  .option('--file-types <types...>', 'File types to analyze (e.g., ts tsx js jsx)')
  .option('--exclude <patterns...>', 'Exclude patterns (glob)')
  .option('--no-git-files', 'Disable git for file discovery')
  .option('--no-git-info', 'Disable git info generation')
  .option('--max-depth <number>', 'Maximum directory depth', parseInt)
  .action(async (options) => {
    try {
      // Convert CLI options to config format
      const cliOptions = {
        ...(options.output && { outputPath: options.output }),
        ...(options.root && { rootDir: options.root }),
        ...(options.contextDir && { contextDir: options.contextDir }),
        ...(options.fileTypes && { analyzeFileTypes: options.fileTypes }),
        ...(options.exclude && { excludePatterns: options.exclude }),
        ...(options.gitFiles === false && { useGitForFiles: false }),
        ...(options.gitInfo === false && { includeGitInfo: false }),
        ...(options.maxDepth && { maxDepth: options.maxDepth }),
      };

      const configFromFile = await ParsemeConfig.fromFile(options.config, {
        showWarnings: true,
        throwOnNotFound: true,
      });
      const interactiveConfig = await promptForMissingConfig(configFromFile.get());

      // Merge: CLI options > interactive prompts > config file > defaults
      const finalConfig = {
        ...interactiveConfig,
        ...cliOptions,
      };

      const config = new ParsemeConfig(finalConfig);
      const generator = new ParsemeGenerator(config.get());
      await generator.generateToFile();
      console.log('Context generated successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('No configuration file found')) {
        console.error(error.message);
        process.exit(1);
      }
      console.error('Failed to generate context:', error);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .alias('i')
  .description('Initialize parseme configuration')
  .option('-f, --force', 'Overwrite existing config')
  .option('--format <format>', 'Config format: json, ts, or js', 'json')
  .action(async (options) => {
    try {
      // Validate format
      if (!['js', 'ts', 'json'].includes(options.format)) {
        console.error('Invalid format. Use js, ts, or json');
        process.exit(1);
      }

      const configPath = join(process.cwd(), `parseme.config.${options.format}`);

      // Check if config already exists
      if (!options.force) {
        try {
          const fs = await import('fs/promises');
          await fs.access(configPath);
          console.log('Configuration file already exists. Use --force to overwrite.');
          process.exit(1);
        } catch {
          // File doesn't exist, continue
        }
      }

      // Build config with only user-specified values
      const userConfig: Partial<ParsemeConfigFile> = {};

      // Set defaults that would normally be prompted for
      const defaultExcludePatterns = ['node_modules/**', 'dist/**', '.git/**'];
      userConfig.contextDir = 'parseme-context';
      userConfig.excludePatterns = defaultExcludePatterns;

      // Only prompt if interactive (TTY) and not in CI
      if (process.stdin.isTTY && !process.env.CI) {
        // Ask about context directory path
        // Set context directory to what user entered (or default if they pressed enter)
        userConfig.contextDir = await prompt({
          message: 'Context directory path',
          defaultValue: 'parseme-context',
        });

        // Ask about exclude patterns
        const excludePatternsAnswer = await prompt({
          message:
            'Exclude patterns (comma-separated glob patterns - in git repositories, additional to git-tracked files)',
          defaultValue: defaultExcludePatterns.join(', '),
        });
        // Always set exclude patterns to what user entered (or defaults if they pressed enter)
        userConfig.excludePatterns = excludePatternsAnswer
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
      }

      const config = new ParsemeConfig(userConfig);
      await config.save(configPath);
      console.log(`Configuration file created at ${configPath}`);

      if (options.format === 'ts') {
        console.log('For TypeScript configs, ensure tsx or ts-node is available to load .ts files');
      }

      console.log(
        'Tip: Add "parseme": "parseme generate" to your package.json scripts for easier manual execution or hook integration',
      );
      console.log(
        'Tip: Add parseme as git hooks to keep context auto-updated! See README for recommended hook setup (post-commit, pre-push, post-push).',
      );
      console.log('');
      console.log('Tip: Add this section to your README.md to help AI agents find the context:');
      console.log('');
      console.log('## Instructions For AI Agents');
      console.log(
        'This project includes AI-optimized documentation for efficient context providing:',
      );
      console.log('- `PARSEME.md` - Project overview with links to detailed context files');
      console.log(
        '- `parseme-context/` - Structured data files (AST analysis, dependencies, routes, git info)',
      );
      console.log('');
    } catch (error) {
      console.error('Failed to create configuration:', error);
      process.exit(1);
    }
  });

// If no command provided, show error and available commands
if (process.argv.length <= 2) {
  console.error('No command specified.\n');
  console.error('Available commands:');
  console.error('  parseme generate (or parseme g) - Generate project context');
  console.error('  parseme init (or parseme i)     - Initialize parseme configuration');
  console.error('\nUse "parseme --help" for more information');
  process.exit(1);
}

program.parse();
