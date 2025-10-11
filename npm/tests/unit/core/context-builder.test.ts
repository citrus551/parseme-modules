import * as assert from 'node:assert';
import { test, describe, beforeEach } from 'node:test';

import { ParsemeConfig } from '../../../dist/core/config.js';
import { ContextBuilder } from '../../../dist/core/context-builder.js';

import type { ProjectInfo, FileAnalysis, GitInfo } from '../../../dist/core/types.js';

describe('ContextBuilder', () => {
  let builder: ContextBuilder;
  let config: ParsemeConfig;

  beforeEach(() => {
    config = new ParsemeConfig();
    builder = new ContextBuilder(config);
  });

  describe('build', () => {
    test('should build context from project analysis', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'frontend-web',
        packageManager: 'npm',
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' },
        scripts: { build: 'tsc' },
        entryPoints: ['src/index.ts'],
        outputTargets: ['dist'],
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/components/Button.tsx',
          type: 'component',
          exports: ['Button'],
          imports: ['react'],
          functions: ['Button'],
          classes: [],
          routes: [],
          components: [{ name: 'Button', file: 'src/components/Button.tsx', line: 1 }],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const mockGitInfo: GitInfo = {
        branch: 'main',
        lastCommit: 'abc123 Initial commit',
        changedFiles: ['src/components/Button.tsx'],
        status: 'dirty',
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/components/Button.tsx'],
        gitInfo: mockGitInfo,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok('parseme' in context);
      assert.ok(typeof context.parseme === 'string');
      assert.ok(context.parseme.length > 0);
      assert.ok(context.parseme.includes('test-project'));
      assert.ok(context.parseme.includes('typescript'));
    });

    test('should handle project without git info', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'javascript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [];

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok('parseme' in context);
      assert.ok(typeof context.parseme === 'string');
      // Git section should not be included when gitInfo is null
      assert.ok(!context.context.gitDiff);
    });

    test('should handle empty project', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'empty-project',
        type: 'typescript',
        category: 'unknown',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: null,
        options: {},
      });

      assert.ok(typeof context === 'object');
      assert.ok(context.parseme.includes('empty-project'));
    });

    test('should include routes in context when available', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'api-project',
        type: 'typescript',
        category: 'backend-api',
        packageManager: 'npm',
        dependencies: { express: '^4.18.0' },
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/routes/users.ts',
          type: 'route',
          exports: ['router'],
          imports: ['express'],
          functions: ['getUsers'],
          classes: [],
          routes: [
            {
              method: 'GET',
              path: '/users',
              handler: 'getUsers',
              file: 'src/routes/users.ts',
              line: 10,
              type: 'unknown',
            },
          ],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/routes/users.ts'],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.parseme.includes('API Routes'));
      assert.ok(context.context.routes);
    });

    test('should generate files list in context', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: ['src/index.ts', 'src/utils.ts', 'README.md'],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.context.files);
      assert.ok(context.context.files.includes('src/index.ts'));
      assert.ok(context.context.files.includes('src/utils.ts'));
      assert.ok(context.context.files.includes('README.md'));
    });

    test('should generate structure data in context', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/index.ts',
          type: 'utility',
          exports: ['hello'],
          imports: [],
          functions: ['hello'],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses,
        allFiles: ['src/index.ts'],
        gitInfo: null,
        options: {},
      });

      assert.ok(context.context.structure);
      const structure = JSON.parse(context.context.structure);
      assert.strictEqual(structure.length, 1);
      assert.strictEqual(structure[0].path, 'src/index.ts');
      assert.strictEqual(structure[0].type, 'utility');
    });

    test('should include git diff in context when git info available', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockGitInfo: GitInfo = {
        branch: 'feature-branch',
        lastCommit: 'def456 Add feature',
        changedFiles: ['src/feature.ts'],
        status: 'dirty',
        diffStat: ' src/feature.ts | 10 ++++++++++\n 1 file changed, 10 insertions(+)',
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: mockGitInfo,
        options: {},
      });

      assert.ok(context.context.gitDiff);
      assert.ok(context.context.gitDiff.includes('src/feature.ts'));
    });

    test('should not generate gitDiff file when git info has no diffStat', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockGitInfo: GitInfo = {
        branch: 'feature-branch',
        lastCommit: 'def456 Add feature',
        changedFiles: ['src/feature.ts'],
        status: 'dirty',
        // No diffStat property
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: mockGitInfo,
        options: {},
      });

      // Should not generate gitDiff file when no diffStat
      assert.ok(!context.context.gitDiff);
      // But should still include git information in main content
      assert.ok(context.parseme.includes('feature-branch'));
      assert.ok(context.parseme.includes('def456 Add feature'));
      assert.ok(context.parseme.includes('Git diff statistics showed no changes'));
    });

    test('should not generate gitDiff file when diffStat is empty', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockGitInfo: GitInfo = {
        branch: 'main',
        lastCommit: 'abc123 Initial commit',
        changedFiles: [],
        status: 'clean',
        diffStat: '', // Empty diff stat
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: mockGitInfo,
        options: {},
      });

      // Should not generate gitDiff file when diffStat is empty
      assert.ok(!context.context.gitDiff);
      // Should include git info but show no changes message
      assert.ok(context.parseme.includes('main'));
      assert.ok(context.parseme.includes('abc123 Initial commit'));
      assert.ok(context.parseme.includes('Git diff statistics showed no changes'));
    });

    test('should generate markdown links in parseme content', () => {
      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      const mockGitInfo: GitInfo = {
        branch: 'feature-branch',
        lastCommit: 'def456 Add feature',
        changedFiles: ['src/feature.ts'],
        status: 'dirty',
        diffStat: ' src/feature.ts | 10 ++++++++++\n 1 file changed, 10 insertions(+)',
      };

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: [],
        allFiles: [],
        gitInfo: mockGitInfo,
        options: {},
      });

      // Should contain Markdown links to context files
      assert.ok(context.parseme.includes('[parseme-context/files.md](parseme-context/files.md)'));
      assert.ok(
        context.parseme.includes(
          '[parseme-context/structure.json](parseme-context/structure.json)',
        ),
      );
      assert.ok(
        context.parseme.includes('[parseme-context/gitDiff.md](parseme-context/gitDiff.md)'),
      );

      // Should contain the git diff file reference with proper link
      assert.ok(
        context.parseme.includes(
          'available at [parseme-context/gitDiff.md](parseme-context/gitDiff.md) (relative to the commit mentioned above)',
        ),
      );
      assert.ok(
        context.parseme.includes(
          'Compare the output with the baseline in [parseme-context/gitDiff.md](parseme-context/gitDiff.md)',
        ),
      );
    });

    test('should respect maxFilesPerContext limit', () => {
      const config = new ParsemeConfig({
        limits: {
          maxFilesPerContext: 2,
        },
      });
      const builder = new ContextBuilder(config);

      const mockProjectInfo: ProjectInfo = {
        name: 'test-project',
        type: 'typescript',
        category: 'npm-package',
        packageManager: 'npm',
        dependencies: {},
        devDependencies: {},
      };

      // Simulate pre-limited files (as they would come from FileCollector)
      const mockFileAnalyses: FileAnalysis[] = [
        {
          path: 'src/file1.ts',
          type: 'utility',
          exports: ['func1'],
          imports: [],
          functions: ['func1'],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
        {
          path: 'src/file2.ts',
          type: 'utility',
          exports: ['func2'],
          imports: [],
          functions: ['func2'],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        },
      ];

      const context = builder.build({
        projectInfo: mockProjectInfo,
        fileAnalyses: mockFileAnalyses, // Pre-limited to 2 files
        allFiles: ['src/file1.ts', 'src/file2.ts'], // Pre-limited to 2 files
        gitInfo: null,
        options: {},
      });

      // Structure should contain exactly 2 files (as pre-limited by FileCollector)
      const structureData = JSON.parse(context.context.structure);
      assert.strictEqual(structureData.length, 2);
      assert.strictEqual(structureData[0].path, 'src/file1.ts');
      assert.strictEqual(structureData[1].path, 'src/file2.ts');
    });

    test('should warn when maxFilesPerContext limit is exceeded', () => {
      // This test should verify that ContextBuilder handles pre-limited data correctly
      const config = new ParsemeConfig();
      const builder = new ContextBuilder(config);

      // Mock console.warn to capture warnings
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        warnings.push(args.join(' '));
      };

      try {
        const mockProjectInfo: ProjectInfo = {
          name: 'test-project',
          type: 'typescript',
          category: 'npm-package',
          packageManager: 'npm',
          dependencies: {},
          devDependencies: {},
        };

        const context = builder.build({
          projectInfo: mockProjectInfo,
          fileAnalyses: [], // Pre-limited files
          allFiles: [], // Pre-limited files
          gitInfo: null,
          options: {},
        });

        // ContextBuilder should not produce warnings about file limits
        // Those warnings come from FileCollector
        const limitWarnings = warnings.filter((w) => w.includes('File limit reached'));
        assert.strictEqual(limitWarnings.length, 0);
        assert.ok(context.parseme);
      } finally {
        console.warn = originalWarn;
      }
    });

    test('should not warn when file count is within limit', () => {
      // Mock console.warn to capture warning messages
      const warnings: string[] = [];
      const originalWarn = console.warn;
      console.warn = (...args: string[]) => {
        warnings.push(args.join(' '));
      };

      try {
        const config = new ParsemeConfig({
          limits: {
            maxFilesPerContext: 5,
          },
        });
        const builder = new ContextBuilder(config);

        const mockProjectInfo: ProjectInfo = {
          name: 'test-project',
          type: 'typescript',
          category: 'npm-package',
          packageManager: 'npm',
          dependencies: {},
          devDependencies: {},
        };

        // Create 3 files, which is within the limit of 5
        const mockFileAnalyses: FileAnalysis[] = Array.from({ length: 3 }, (_, i) => ({
          path: `src/file${i + 1}.ts`,
          type: 'utility',
          exports: [`func${i + 1}`],
          imports: [],
          functions: [`func${i + 1}`],
          classes: [],
          routes: [],
          components: [],
          services: [],
          models: [],
          configs: [],
          middleware: [],
          utilities: [],
        }));

        builder.build({
          projectInfo: mockProjectInfo,
          fileAnalyses: mockFileAnalyses,
          allFiles: mockFileAnalyses.map((f) => f.path),
          gitInfo: null,
          options: {},
        });

        // Should not have any warnings since we're within the limit
        assert.strictEqual(warnings.length, 0);
      } finally {
        // Restore original console.warn
        console.warn = originalWarn;
      }
    });
  });
});
