import { exec } from 'child_process';
import { promisify } from 'util';

import type { ParsemeConfig } from '../config.js';
import type { GitInfo } from '../types.js';

const execAsync = promisify(exec);

export class GitAnalyzer {
  constructor(private readonly config: ParsemeConfig) {}

  async analyze(rootDir: string): Promise<GitInfo | null> {
    try {
      // Check if this is a git repository
      await execAsync('git rev-parse --git-dir', { cwd: rootDir });

      const [branch, lastCommit, status, changedFiles, origin, diffStat] = await Promise.all([
        this.getCurrentBranch(rootDir),
        this.getLastCommit(rootDir),
        this.getStatus(rootDir),
        this.getChangedFiles(rootDir),
        this.getOrigin(rootDir),
        this.getDiffStat(rootDir),
      ]);

      return {
        branch,
        lastCommit,
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

  private async getOrigin(rootDir: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: rootDir });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  private async getDiffStat(rootDir: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git diff --stat', { cwd: rootDir });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }
}
