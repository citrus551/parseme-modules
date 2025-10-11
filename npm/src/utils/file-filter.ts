import { exec } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { promisify } from 'util';

import ignore from 'ignore';

const execAsync = promisify(exec);

export class FileFilterService {
  private readonly ig: ReturnType<typeof ignore>;

  constructor(
    private readonly excludePatterns: string[] = [],
    private readonly useGitForFiles: boolean = true,
  ) {
    this.ig = ignore();
    this.ig.add(excludePatterns);
  }

  /**
   * Get all files that should be analyzed, respecting:
   * 1. Git-tracked files (respects all .gitignore files automatically)
   * 2. All files (if non-git repo) - respects only custom excludePatterns
   * 3. Custom excludePatterns from config (always applied)
   */
  async getFilteredFiles(rootDir: string, fileExtensions?: string[]): Promise<string[]> {
    try {
      let files: string[];

      // Try to get git-tracked files first (only if useGitForFiles is enabled)
      const isGitRepo = this.useGitForFiles && (await this.isGitRepository(rootDir));
      if (isGitRepo) {
        files = await this.getGitTrackedFiles(rootDir);
      } else {
        // Fallback: get all files recursively
        files = await this.getAllFilesRecursive(rootDir, rootDir);
      }

      // Apply custom exclude patterns
      const filteredFiles = files.filter((file) => !this.ig.ignores(file));

      // Optionally filter by file extensions
      if (fileExtensions && fileExtensions.length > 0) {
        const extensionSet = new Set(
          fileExtensions.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`)),
        );
        return filteredFiles.filter((file) => {
          const ext = file.substring(file.lastIndexOf('.'));
          return extensionSet.has(ext);
        });
      }

      return filteredFiles;
    } catch (error) {
      throw new Error(`Failed to get filtered files: ${(error as Error).message}`);
    }
  }

  /**
   * Check if the directory is a git repository
   */
  private async isGitRepository(rootDir: string): Promise<boolean> {
    try {
      await execAsync('git rev-parse --git-dir', { cwd: rootDir });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all tracked files from git
   * This respects all .gitignore files in the repository (parent, current, and child dirs)
   */
  private async getGitTrackedFiles(rootDir: string): Promise<string[]> {
    const { stdout } = await execAsync('git ls-files', { cwd: rootDir });
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);
  }

  /**
   * Get all files recursively (fallback for non-git repos)
   */
  private async getAllFilesRecursive(dir: string, rootDir: string): Promise<string[]> {
    const entries = await readdir(dir);
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relativePath = relative(rootDir, fullPath);

      const stats = await stat(fullPath);

      if (stats.isFile()) {
        files.push(relativePath);
      } else if (stats.isDirectory() && !entry.startsWith('.')) {
        files.push(...(await this.getAllFilesRecursive(fullPath, rootDir)));
      }
    }

    return files;
  }

  /**
   * Check if a specific file should be filtered out
   */
  shouldIgnore(filePath: string): boolean {
    return this.ig.ignores(filePath);
  }
}
