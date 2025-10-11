import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

import type { ParsemeConfigFile } from './types.js';

export class ParsemeConfig {
  private readonly config: ParsemeConfigFile;
  private readonly userConfig: Partial<ParsemeConfigFile>;

  constructor(config: Partial<ParsemeConfigFile> = {}) {
    this.userConfig = { ...config }; // Store original user config
    this.config = this.mergeWithDefaults(config);
  }

  static async fromFileWithOptions(
    configPath?: string,
    cliOptions: Partial<ParsemeConfigFile> = {},
    options: { showWarnings?: boolean } = { showWarnings: true },
  ): Promise<ParsemeConfig> {
    const configFromFile = await ParsemeConfig.fromFile(configPath, options);
    const mergedConfig = {
      ...configFromFile.get(),
      ...cliOptions, // CLI options take priority
    };
    return new ParsemeConfig(mergedConfig);
  }

  static async fromFile(
    configPath?: string,
    options: { showWarnings?: boolean; throwOnNotFound?: boolean } = {
      showWarnings: true,
      throwOnNotFound: false,
    },
  ): Promise<ParsemeConfig> {
    const defaultPaths = [
      'parseme.config.json',
      '.parsemerc.json',
      '.parsemerc',
      'parseme.config.ts',
      '.parsemerc.ts',
      'parseme.config.js',
      '.parsemerc.js',
    ];

    const paths = configPath ? [configPath] : defaultPaths;
    let tsWarning: string | null = null;
    let configLoadError: { path: string; error: Error } | null = null;

    for (const path of paths) {
      try {
        const ext = extname(path);

        if (ext === '.js' || ext === '.ts') {
          // Dynamic import for JS/TS config files
          const fullPath = path.startsWith('/') ? path : join(process.cwd(), path);

          if (ext === '.ts') {
            // For TypeScript files, check if file exists first
            if (existsSync(fullPath)) {
              try {
                const module = await import(fullPath);
                const config = module.default || module;
                return new ParsemeConfig(config);
              } catch (error) {
                // File exists but can't be loaded - save warning
                tsWarning = path;
                configLoadError = { path, error: error as Error };
              }
            }
          } else {
            // JavaScript files
            const module = await import(fullPath);
            const config = module.default || module;
            return new ParsemeConfig(config);
          }
        } else {
          // JSON config files
          const fullPath = path.startsWith('/') ? path : join(process.cwd(), path);
          const content = await readFile(fullPath, 'utf-8');
          const config = JSON.parse(content);
          return new ParsemeConfig(config);
        }
      } catch (error) {
        // If file exists, save the error
        const fullPath = path.startsWith('/') ? path : join(process.cwd(), path);
        if (existsSync(fullPath)) {
          configLoadError = { path, error: error as Error };
        }
        // Continue to next path
      }
    }

    // Handle case when config file was found but couldn't be loaded
    if (configLoadError) {
      const { path, error } = configLoadError;
      if (options.throwOnNotFound) {
        throw new Error(`Configuration file "${path}" found but failed to load: ${error.message}`);
      }
      if (options.showWarnings) {
        console.warn(`Configuration file "${path}" found but failed to load: ${error.message}`);
      }
    } else {
      // Handle case when no config found at all
      if (options.throwOnNotFound) {
        throw new Error('No configuration file found. Run "parseme init" to create one.');
      }
      if (options.showWarnings) {
        console.warn('No configuration file found. Run "parseme init" to create one.');
      }
    }

    if (tsWarning && !configLoadError && options.showWarnings) {
      console.warn(`Could not load TypeScript config file: ${tsWarning}`);
      console.warn(`Consider using a .js config file or ensure tsx/ts-node is available`);
    }

    // Return default config if no file found
    return new ParsemeConfig();
  }

  private mergeWithDefaults(config: Partial<ParsemeConfigFile>): ParsemeConfigFile {
    const rootDir = config.rootDir || process.cwd();
    const supportedFileTypes = ['ts', 'tsx', 'js', 'jsx'];

    // Validate analyzeFileTypes
    const fileTypes = config.analyzeFileTypes || ['ts', 'tsx', 'js', 'jsx'];
    const invalidTypes = fileTypes.filter((type: string) => !supportedFileTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw new Error(
        `Invalid file types: ${invalidTypes.join(', ')}. Supported types are: ${supportedFileTypes.join(', ')}`,
      );
    }

    return {
      // Output
      outputPath: config.outputPath || 'PARSEME.md',
      contextDir: config.contextDir || 'parseme-context',

      // Analysis
      rootDir,
      maxDepth: config.maxDepth || 10,
      excludePatterns: this.mergeExcludePatterns(config.excludePatterns, rootDir),
      analyzeFileTypes: fileTypes,

      // Git
      includeGitInfo: config.includeGitInfo ?? true,
      useGitForFiles: config.useGitForFiles ?? true,

      // Sections
      sections: {
        overview: true,
        architecture: true,
        routes: true,
        dependencies: true,
        git: true,
        fileStructure: true,
        ...config.sections,
      },

      // Style
      style: {
        includeLineNumbers: false,
        includeFileStats: true,
        groupByType: true,
        sortOrder: 'type',
        ...config.style,
      },

      // Size limits
      limits: {
        maxFilesPerContext: config.limits?.maxFilesPerContext ?? 5000,
      },
    };
  }

  get(): ParsemeConfigFile {
    return { ...this.config };
  }

  async save(path: string = 'parseme.config.js'): Promise<void> {
    const ext = extname(path);

    if (ext === '.js') {
      // Generate JavaScript config file
      const configContent = this.generateJSConfig();
      await writeFile(path, configContent);
    } else if (ext === '.ts') {
      // Generate TypeScript config file
      const configContent = this.generateTSConfig();
      await writeFile(path, configContent);
    } else {
      // Generate JSON config file - only save user config, not defaults
      await writeFile(path, JSON.stringify(this.userConfig, null, 2));
    }
  }

  private generateJSConfig(): string {
    // Only export user-specified config, not defaults
    return `/** @type {import('parseme').ParsemeConfigFile} */
const config = ${JSON.stringify(this.userConfig, null, 2)};

export default config;
`;
  }

  private generateTSConfig(): string {
    // Only export user-specified config, not defaults
    return `import type { ParsemeConfigFile } from 'parseme';

const config: ParsemeConfigFile = ${JSON.stringify(this.userConfig, null, 2)};

export default config;
`;
  }

  private mergeExcludePatterns(configPatterns: string[] | undefined, _rootDir: string): string[] {
    // Only use config patterns - git ignore is now handled by FileFilterService
    return configPatterns || [];
  }
}
