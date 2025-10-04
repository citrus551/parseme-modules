import { readFileSync, existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

import type { GeneratorOptions } from './types.js';

export interface ParsemeConfigFile extends GeneratorOptions {
  // Output configuration
  outputPath?: string;
  contextDir?: string;

  // Analysis configuration
  rootDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxDepth?: number;

  // Git integration
  includeGitInfo?: boolean;

  // CLI behavior
  readmeSuggestion?: boolean;

  // Content customization
  sections?: {
    overview?: boolean;
    architecture?: boolean;
    routes?: boolean;
    dependencies?: boolean;
    git?: boolean;
    fileStructure?: boolean;
  };

  // Documentation style
  style?: {
    includeLineNumbers?: boolean;
    includeFileStats?: boolean;
    groupByType?: boolean;
    sortOrder?: 'alphabetical' | 'type' | 'size';
  };

  // Size limits for AI compatibility
  limits?: {
    maxLinesPerFile?: number;
    maxCharsPerFile?: number;
    maxFilesPerContext?: number;
    truncateStrategy?: 'truncate' | 'split' | 'summarize';
  };
}

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
    let foundConfig = false;

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
                foundConfig = true;
                return new ParsemeConfig(config);
              } catch {
                // File exists but can't be loaded - save warning
                tsWarning = path;
              }
            }
          } else {
            // JavaScript files
            const module = await import(fullPath);
            const config = module.default || module;
            foundConfig = true;
            return new ParsemeConfig(config);
          }
        } else {
          // JSON config files
          const content = await readFile(path, 'utf-8');
          const config = JSON.parse(content);
          foundConfig = true;
          return new ParsemeConfig(config);
        }
      } catch {
        // Continue to next path
      }
    }

    // Handle case when no config found
    if (!foundConfig) {
      if (options.throwOnNotFound) {
        throw new Error('No configuration file found. Run "parseme init" to create one.');
      }
      if (options.showWarnings) {
        console.warn('No configuration file found. Run "parseme init" to create one.');
      }
    } else if (tsWarning && options.showWarnings) {
      console.warn(`Could not load TypeScript config file: ${tsWarning}`);
      console.warn(`Consider using a .js config file or ensure tsx/ts-node is available`);
    }

    // Return default config if no file found
    return new ParsemeConfig();
  }

  private mergeWithDefaults(config: Partial<ParsemeConfigFile>): ParsemeConfigFile {
    const rootDir = config.rootDir || process.cwd();

    return {
      // Output
      outputPath: config.outputPath || 'PARSEME.md',
      contextDir: config.contextDir || 'parseme-context',

      // Analysis
      rootDir,
      maxDepth: config.maxDepth || 10,
      excludePatterns: this.mergeExcludePatterns(config.excludePatterns, rootDir),
      includePatterns: config.includePatterns || [
        'src/**/*.ts',
        'src/**/*.js',
        'src/**/*.tsx',
        'src/**/*.jsx',
        'lib/**/*.ts',
        'lib/**/*.js',
        'package.json',
        'tsconfig.json',
        'README.md',
      ],

      // Git
      includeGitInfo: config.includeGitInfo ?? true,

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
        maxLinesPerFile: config.limits?.maxLinesPerFile ?? 1000,
        maxCharsPerFile: config.limits?.maxCharsPerFile ?? 50000, // ~15k tokens
        maxFilesPerContext: config.limits?.maxFilesPerContext ?? 20,
        truncateStrategy: config.limits?.truncateStrategy ?? 'truncate',
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

  private mergeExcludePatterns(configPatterns: string[] | undefined, rootDir: string): string[] {
    const defaultPatterns = [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**',
      '**/*.log',
      '**/*.tmp',
      '**/.DS_Store',
      '**/.*',
    ];

    // Priority: Config patterns > .gitignore patterns > Default patterns
    if (configPatterns) {
      return configPatterns;
    }

    // Try to read .gitignore patterns
    const gitignorePatterns = this.readGitignorePatterns(rootDir);
    if (gitignorePatterns.length > 0) {
      // Merge gitignore patterns with critical defaults
      const criticalDefaults = ['node_modules/**', '.git/**'];
      return [...new Set([...criticalDefaults, ...gitignorePatterns])];
    }

    return defaultPatterns;
  }

  private readGitignorePatterns(rootDir: string): string[] {
    try {
      const gitignorePath = join(rootDir, '.gitignore');
      if (!existsSync(gitignorePath)) {
        return [];
      }

      const gitignoreContent = readFileSync(gitignorePath, 'utf-8');

      return gitignoreContent
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith('#'))
        .map((pattern: string) => {
          // Convert gitignore patterns to glob patterns
          if (pattern.endsWith('/')) {
            return pattern + '**';
          }
          if (!pattern.includes('/') && !pattern.includes('*')) {
            // Convert simple names to match directory patterns
            return pattern + '/**';
          }
          return pattern;
        });
    } catch {
      return [];
    }
  }
}
