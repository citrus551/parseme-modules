import { FileFilterService } from './file-filter.js';

import type { ParsemeConfig } from '../core/config.js';

export interface FileCollectionOptions {
  fileTypes?: string[];
}

export interface FileCollectionResult {
  files: string[];
  totalFound: number;
  excluded: number;
}

export class FileCollector {
  private readonly fileFilter: FileFilterService;
  private readonly config: ParsemeConfig;

  constructor(config: ParsemeConfig) {
    this.config = config;
    const configData = this.config.get();
    this.fileFilter = new FileFilterService(
      configData.excludePatterns,
      configData.useGitForFiles ?? true,
    );
  }

  async getFiles(
    rootDir: string,
    options: FileCollectionOptions = {},
  ): Promise<FileCollectionResult> {
    const configData = this.config.get();
    const { fileTypes } = options;

    // Get all filtered files (respects git ignore + custom excludePatterns)
    const allFiles = await this.fileFilter.getFilteredFiles(rootDir);

    // Filter by file types if specified
    let filteredFiles = allFiles;
    if (fileTypes && fileTypes.length > 0) {
      const extensionSet = new Set(fileTypes.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`)));

      filteredFiles = allFiles.filter((file) => {
        const ext = file.substring(file.lastIndexOf('.'));
        return extensionSet.has(ext);
      });
    }

    // Apply limits
    let finalFiles = filteredFiles;
    let excluded = 0;

    if (configData.limits?.maxFilesPerContext) {
      const limit = configData.limits.maxFilesPerContext;
      if (filteredFiles.length > limit) {
        finalFiles = filteredFiles.slice(0, limit);
        excluded = filteredFiles.length - limit;

        // Show warning when files are excluded
        const fileTypeDesc = fileTypes ? `${fileTypes.join(', ')} files` : 'files';
        console.warn(`⚠️  File limit reached: ${excluded} ${fileTypeDesc} excluded.`);
        console.warn(`   Processed: ${limit}/${filteredFiles.length} files`);
        console.warn(
          `   To process more files, increase 'limits.maxFilesPerContext' in your config file.`,
        );
      }
    }

    return {
      files: finalFiles,
      totalFound: filteredFiles.length,
      excluded,
    };
  }

  /**
   * Get all project files (no file type filtering, for files.md)
   */
  async getAllProjectFiles(rootDir: string): Promise<FileCollectionResult> {
    return this.getFiles(rootDir);
  }

  /**
   * Get code files for AST analysis (filtered by file types, for structure.json)
   */
  async getCodeFiles(rootDir: string, fileTypes?: string[]): Promise<FileCollectionResult> {
    const configData = this.config.get();
    const defaultFileTypes = configData.analyzeFileTypes || ['ts', 'tsx', 'js', 'jsx'];

    return this.getFiles(rootDir, {
      fileTypes: fileTypes || defaultFileTypes,
    });
  }
}
