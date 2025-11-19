import { exec } from 'child_process';
import { promisify } from 'util';

import type { GitInfo } from '../core/types.js';

const execAsync = promisify(exec);

export class GitAnalyzer {
  async analyze(rootDir: string, outputFilePath?: string): Promise<GitInfo | null> {
    try {
      // Check if this is a git repository
      await execAsync('git rev-parse --git-dir', { cwd: rootDir });

      // Get the commit when the output file was last committed
      const lastCommit = await this.getCommit(rootDir, outputFilePath);

      // If an output file path was provided but it was never committed, don't show any git info
      if (outputFilePath && !lastCommit) {
        return null;
      }

      const [branch, status, changedFiles, origin, diffStat] = await Promise.all([
        this.getCurrentBranch(rootDir),
        this.getStatus(rootDir, outputFilePath),
        this.getChangedFiles(rootDir, outputFilePath),
        this.getOrigin(rootDir),
        this.getDiffStat(rootDir, outputFilePath),
      ]);

      return {
        branch,
        lastCommit: lastCommit || 'No commits',
        status,
        changedFiles,
        origin,
        diffStat,
      };
    } catch {
      // Not a git repository or git not available
      return null;
    }
  }

  private async getCurrentBranch(rootDir: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: rootDir });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  private async getCommit(rootDir: string, filePath?: string): Promise<string | null> {
    try {
      const fileArg = filePath ? ` -- "${filePath}"` : '';
      const { stdout } = await execAsync(`git log -1 --format="%H %s"${fileArg}`, {
        cwd: rootDir,
      });
      return stdout.trim() || null;
    } catch {
      return null;
    }
  }

  private async getStatus(rootDir: string, filePath?: string): Promise<'clean' | 'dirty'> {
    try {
      if (filePath) {
        // Check if there are changes since the file's last commit
        const { stdout } = await execAsync(
          `git diff $(git log -1 --format=%H -- "${filePath}") --stat`,
          { cwd: rootDir },
        );
        return stdout.trim() ? 'dirty' : 'clean';
      }
      const { stdout } = await execAsync('git status --porcelain', { cwd: rootDir });
      return stdout.trim() ? 'dirty' : 'clean';
    } catch {
      return 'clean';
    }
  }

  private async getChangedFiles(rootDir: string, filePath?: string): Promise<string[]> {
    try {
      if (filePath) {
        // Get files changed since the file's last commit
        const { stdout } = await execAsync(
          `git diff $(git log -1 --format=%H -- "${filePath}") --name-only`,
          { cwd: rootDir },
        );
        return stdout.split('\n').filter((line) => line.trim());
      }
      const { stdout } = await execAsync('git status --porcelain', { cwd: rootDir });
      return stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.substring(3)); // Remove status prefix
    } catch {
      return [];
    }
  }

  private async getOrigin(rootDir: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: rootDir });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  private async getDiffStat(rootDir: string, filePath?: string): Promise<string | undefined> {
    try {
      if (filePath) {
        // Get diff stat since the file's last commit
        const { stdout } = await execAsync(
          `git diff $(git log -1 --format=%H -- "${filePath}") --stat`,
          { cwd: rootDir },
        );
        return stdout.trim();
      }
      const { stdout } = await execAsync('git diff --stat', { cwd: rootDir });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }
}
