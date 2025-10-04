#!/usr/bin/env node

import { join } from 'path';

import { Command } from 'commander';

import { ParsemeConfig, type ParsemeConfigFile } from './config.js';
import { ParsemeGenerator } from './generator.js';
import { confirmPrompt } from './prompt.js';

const program = new Command();

async function promptForMissingConfig(
  config: ParsemeConfigFile,
  cliOptions: Partial<ParsemeConfigFile>,
): Promise<ParsemeConfigFile> {
  const finalConfig = { ...config };

  // Only prompt if running interactively (stdin is a TTY) and not in CI
  if (!process.stdin.isTTY || process.env.CI) {
    return finalConfig;
  }

  // Prompt for README suggestion if not set via CLI or config
  if (cliOptions.readmeSuggestion === undefined && config.readmeSuggestion === undefined) {
    const wantReadmeSuggestion = await confirmPrompt(
      'Show README.md section suggestion for AI agents?',
      true,
    );
    finalConfig.readmeSuggestion = wantReadmeSuggestion;
  }

  return finalConfig;
}

program.name('parseme').description('AI Project Context Generator').version('0.1.0');

// Main command - just run parseme
program
  .description('Generate project context using config file')
  .option('-c, --config <path>', 'Config file path')
  .option('-o, --output <path>', 'Output file path')
  .option('-r, --root <path>', 'Root directory to analyze')
  .option('--context-dir <path>', 'Context directory path (default: parseme-context)')
  .option('--include <patterns...>', 'Include patterns (glob)')
  .option('--exclude <patterns...>', 'Exclude patterns (glob)')
  .option('--no-git', 'Disable git information')
  .option('--max-depth <number>', 'Maximum directory depth', parseInt)
  .option('--no-readme-suggestion', 'Disable README.md section suggestion')
  .action(async (options) => {
    try {
      // Convert CLI options to config format
      const cliOptions = {
        ...(options.output && { outputPath: options.output }),
        ...(options.root && { rootDir: options.root }),
        ...(options.contextDir && { contextDir: options.contextDir }),
        ...(options.include && { includePatterns: options.include }),
        ...(options.exclude && { excludePatterns: options.exclude }),
        ...(options.git === false && { includeGitInfo: false }),
        ...(options.maxDepth && { maxDepth: options.maxDepth }),
        ...(options.readmeSuggestion === false && { readmeSuggestion: false }),
      };

      const configFromFile = await ParsemeConfig.fromFile(options.config, {
        showWarnings: true,
        throwOnNotFound: true,
      });
      const interactiveConfig = await promptForMissingConfig(configFromFile.get(), cliOptions);

      // Merge: CLI options > interactive prompts > config file > defaults
      const finalConfig = {
        ...interactiveConfig,
        ...cliOptions,
      };

      const config = new ParsemeConfig(finalConfig);
      const generator = new ParsemeGenerator(config.get());
      await generator.generateToFile();
      console.log('Context generated successfully');

      const shouldShowReadmeSuggestion = finalConfig.readmeSuggestion !== false;
      if (shouldShowReadmeSuggestion) {
        console.log('Tip: Add this section to your README.md to help AI agents find the context:');
        console.log('');
        console.log('## For AI Assistants');
        console.log('This project includes AI-optimized documentation:');
        console.log('- `PARSEME.md` - Main project context and overview');
        console.log(
          '- `parseme-context/` - Detailed JSON files with code structure, dependencies, and git info',
        );
        console.log('');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('No configuration file found')) {
        console.error(error.message);
        process.exit(1);
      }
      console.error('Failed to generate context:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize parseme configuration')
  .option('-f, --force', 'Overwrite existing config')
  .option('--format <format>', 'Config format: js, ts, or json', 'js')
  .action(async (options) => {
    try {
      // Validate format
      if (!['js', 'ts', 'json'].includes(options.format)) {
        console.error('Invalid format. Use js, ts, or json');
        process.exit(1);
      }

      const configPath = join(process.cwd(), `parseme.config.${options.format}`);
      const config = new ParsemeConfig();

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

      await config.save(configPath);
      console.log(`Configuration file created at ${configPath}`);

      if (options.format === 'ts') {
        console.log('For TypeScript configs, ensure tsx or ts-node is available to load .ts files');
      }

      console.log(
        'Tip: Add "parseme": "parseme" to your package.json scripts for easier manual execution or hook integration',
      );
      console.log(
        'Tip: Add parseme as a git hook to keep context auto-updated! See README for setup instructions.',
      );
    } catch (error) {
      console.error('Failed to create configuration:', error);
      process.exit(1);
    }
  });

// If no command and no args, run main action
if (process.argv.length <= 2) {
  // Run the default action
  (async () => {
    try {
      const configFromFile = await ParsemeConfig.fromFile(undefined, {
        showWarnings: true,
        throwOnNotFound: true,
      });
      const interactiveConfig = await promptForMissingConfig(configFromFile.get(), {});

      const config = new ParsemeConfig(interactiveConfig);
      const generator = new ParsemeGenerator(config.get());
      await generator.generateToFile();
      console.log('Context generated successfully');

      const shouldShowReadmeSuggestion = interactiveConfig.readmeSuggestion !== false;
      if (shouldShowReadmeSuggestion) {
        console.log('Tip: Add this section to your README.md to help AI agents find the context:');
        console.log('');
        console.log('## For AI Assistants');
        console.log('This project includes AI-optimized documentation:');
        console.log('- `PARSEME.md` - Main project context and overview');
        console.log(
          '- `parseme-context/` - Detailed JSON files with code structure, dependencies, and git info',
        );
        console.log('');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('No configuration file found')) {
        console.error(error.message);
        process.exit(1);
      }
      console.error('Failed to generate context:', error);
      process.exit(1);
    }
  })();
} else {
  program.parse();
}
