// Types related to configuration and generator options

export interface GeneratorOptions {
  rootDir?: string;
  includeGitInfo?: boolean;
  maxDepth?: number;
  excludePatterns?: string[];
  analyzeFileTypes?: string[];
}

export interface ParsemeConfigFile extends GeneratorOptions {
  // Output configuration
  outputPath?: string;
  contextDir?: string;

  // Analysis configuration
  rootDir?: string;
  analyzeFileTypes?: string[];
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
