import { exec } from 'child_process';
import { promisify } from 'util';

import type { ParsemeConfig } from '../config.js';
import type { GitInfo } from '../types.js';

const execAsync = promisify(exec);

export class GitAnalyzer {
  constructor(private readonly config: ParsemeConfig) {}

  async analyze(rootDir: string): Promise<GitInfo | undefined> {
    try {
      // Check if this is a git repository
      await execAsync('git rev-parse --git-dir', { cwd: rootDir });

      const [branch, lastCommit, status, changedFiles] = await Promise.all([
        this.getCurrentBranch(rootDir),
        this.getLastCommit(rootDir),
        this.getStatus(rootDir),
        this.getChangedFiles(rootDir),
      ]);

      return {
        branch,
        lastCommit,
        status,
        changedFiles,
      };
    } catch {
      // Not a git repository or git not available
      return undefined;
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

  private async getLastCommit(rootDir: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git log -1 --format="%H %s"', { cwd: rootDir });
      return stdout.trim();
    } catch {
      return 'No commits';
    }
  }

  private async getStatus(rootDir: string): Promise<'clean' | 'dirty'> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: rootDir });
      return stdout.trim() ? 'dirty' : 'clean';
    } catch {
      return 'clean';
    }
  }

  private async getChangedFiles(rootDir: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: rootDir });
      return stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.substring(3)); // Remove status prefix
    } catch {
      return [];
    }
  }

  async getFileLastModified(filePath: string, rootDir: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync(`git log -1 --format="%H %ai" -- "${filePath}"`, {
        cwd: rootDir,
      });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  async getFileHistory(filePath: string, rootDir: string, limit: number = 5): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`git log --oneline -${limit} -- "${filePath}"`, {
        cwd: rootDir,
      });
      return stdout.split('\n').filter((line) => line.trim());
    } catch {
      return [];
    }
  }
}
