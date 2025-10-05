import { readFile, access, readdir, stat } from 'fs/promises';
import { join, basename } from 'path';

import type { ParsemeConfig } from '../config.js';
import type { ProjectInfo, ProjectCategory } from '../types.js';

export class ProjectAnalyzer {
  constructor(private readonly config: ParsemeConfig) {}

  async analyze(rootDir: string): Promise<ProjectInfo> {
    const packageJsonPath = join(rootDir, 'package.json');

    try {
      await access(packageJsonPath);
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

      return {
        name: packageJson.name || basename(rootDir),
        version: packageJson.version,
        description: packageJson.description,
        type: await this.detectProjectType(rootDir),
        category: this.detectProjectCategory(packageJson, rootDir),
        packageManager: await this.detectPackageManager(rootDir),
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {},
        entryPoints: this.detectEntryPoints(packageJson),
        outputTargets: this.detectOutputTargets(packageJson),
      };
    } catch {
      // No package.json found, analyze directory structure
      return {
        name: basename(rootDir),
        type: await this.detectProjectType(rootDir),
        category: 'unknown',
        packageManager: 'unknown',
        dependencies: {},
        devDependencies: {},
        scripts: {},
        entryPoints: [],
        outputTargets: [],
      };
    }
  }

  private async detectProjectType(rootDir: string): Promise<'typescript' | 'javascript' | 'mixed'> {
    try {
      const files = await this.getFilesRecursive(rootDir, 2); // Only check 2 levels deep

      const tsFiles = files.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
      const jsFiles = files.filter((f) => f.endsWith('.js'));

      if (tsFiles.length > 0 && jsFiles.length > 0) {
        return 'mixed';
      }
      if (tsFiles.length > 0) {
        return 'typescript';
      }
      return 'javascript';
    } catch {
      return 'javascript';
    }
  }

  private async detectPackageManager(rootDir: string): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'> {
    const lockFiles = {
      'pnpm-lock.yaml': 'pnpm',
      'yarn.lock': 'yarn',
      'bun.lockb': 'bun',
      'package-lock.json': 'npm',
    } as const;

    for (const [lockFile, manager] of Object.entries(lockFiles)) {
      try {
        await access(join(rootDir, lockFile));
        return manager;
      } catch {
        // Continue checking
      }
    }

    return 'npm';
  }

  private async getFilesRecursive(dir: string, maxDepth: number): Promise<string[]> {
    if (maxDepth <= 0) {
      return [];
    }

    try {
      const entries = await readdir(dir);
      const files: string[] = [];

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isFile()) {
          files.push(fullPath);
        } else if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          files.push(...(await this.getFilesRecursive(fullPath, maxDepth - 1)));
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  private detectProjectCategory(
    packageJson: Record<string, unknown>,
    _rootDir: string,
  ): ProjectCategory {
    const deps = {
      ...(packageJson.dependencies as Record<string, string> | undefined),
      ...(packageJson.devDependencies as Record<string, string> | undefined),
    };

    // Check for monorepo indicators
    if (packageJson.workspaces || packageJson.private) {
      return 'monorepo';
    }

    // Check for CLI tools
    if (packageJson.bin) {
      return 'cli-tool';
    }

    // Check for desktop app frameworks
    if (deps['electron'] || deps['tauri']) {
      return 'desktop-app';
    }

    // Check for mobile frameworks
    if (deps['react-native'] || deps['@ionic/react'] || deps['@ionic/angular']) {
      return 'frontend-mobile';
    }

    // Check for fullstack frameworks
    if (deps['next'] || deps['nuxt'] || deps['sveltekit'] || deps['remix']) {
      return 'fullstack';
    }

    // Check for frontend frameworks
    if (
      deps['react'] ||
      deps['vue'] ||
      deps['angular'] ||
      deps['svelte'] ||
      deps['@angular/core'] ||
      deps['vue-router']
    ) {
      return 'frontend-web';
    }

    // Check for backend frameworks
    if (
      deps['express'] ||
      deps['fastify'] ||
      deps['@nestjs/core'] ||
      deps['koa'] ||
      deps['@hapi/hapi']
    ) {
      return 'backend-api';
    }

    // Check if it's a library (has main/module/exports but no app dependencies)
    if (
      (packageJson.main || packageJson.module || packageJson.exports) &&
      !this.hasAppDependencies(deps)
    ) {
      return 'npm-package';
    }

    return 'unknown';
  }

  private detectEntryPoints(packageJson: Record<string, unknown>): string[] {
    const entryPoints: string[] = [];

    if (packageJson.main && typeof packageJson.main === 'string') {
      entryPoints.push(packageJson.main);
    }
    if (packageJson.module && typeof packageJson.module === 'string') {
      entryPoints.push(packageJson.module);
    }
    if (packageJson.browser && typeof packageJson.browser === 'string') {
      entryPoints.push(packageJson.browser);
    }
    if (packageJson.exports) {
      if (typeof packageJson.exports === 'string') {
        entryPoints.push(packageJson.exports);
      } else if (typeof packageJson.exports === 'object') {
        Object.values(packageJson.exports).forEach((exp) => {
          if (typeof exp === 'string') {
            entryPoints.push(exp);
          }
        });
      }
    }

    return [...new Set(entryPoints)]; // Remove duplicates
  }

  private detectOutputTargets(packageJson: Record<string, unknown>): string[] {
    const targets: string[] = [];
    const main = packageJson.main as string | undefined;

    // Common output directories
    if (main?.includes('dist/')) {
      targets.push('dist');
    }
    if (main?.includes('build/')) {
      targets.push('build');
    }
    if (main?.includes('lib/')) {
      targets.push('lib');
    }

    return [...new Set(targets)];
  }

  private hasAppDependencies(deps: Record<string, string>): boolean {
    const appIndicators = [
      'react',
      'vue',
      'angular',
      'svelte',
      'express',
      'fastify',
      '@nestjs/core',
      'next',
      'nuxt',
      'electron',
      'react-native',
    ];

    return appIndicators.some((indicator) => deps[indicator]);
  }
}
