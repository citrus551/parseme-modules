import { spawn } from 'child_process';
import { readFile, access, rm } from 'fs/promises';
import assert from 'node:assert';
import { describe, test, before } from 'node:test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');
const REPOS_DIR = join(E2E_DIR, 'repos');
const CLI_PATH = join(E2E_DIR, '..', 'npm', 'dist', 'cli', 'cli.js');
const REPOS_CONFIG_PATH = join(E2E_DIR, 'test-repositories-list.json');

// Load repository configurations
const reposConfig = JSON.parse(await readFile(REPOS_CONFIG_PATH, 'utf-8'));

// Helper to run parseme CLI
function runParseme(cwd, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd,
      env: { ...process.env, CI: 'true' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Helper to check if file exists
async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Helper to get repository directory path
function getRepoDir(repoKey, config) {
  // Use the JSON key as the directory name
  const basePath = join(REPOS_DIR, repoKey);

  // For cloned repos, add subpath if specified
  if (config.type === 'clone' && config.path && config.path !== '.') {
    return join(basePath, config.path);
  }

  return basePath;
}

describe('E2E Test Repositories', () => {
  before(async () => {
    const missingRepos = [];
    const cleanups = [];

    // Check repos exist and prepare cleanups in a single loop
    for (const [key, config] of Object.entries(reposConfig)) {
      const repoDir = getRepoDir(key, config);
      const contextDir = config.contextDir || 'parseme-context';

      // Check if repo exists
      const exists = await fileExists(repoDir);
      if (!exists) {
        missingRepos.push(`${config.name} at ${repoDir}`);
      }

      // Prepare cleanup tasks
      cleanups.push(
        rm(join(repoDir, 'PARSEME.md'), { force: true }),
        rm(join(repoDir, contextDir), { recursive: true, force: true }),
        rm(join(repoDir, 'parseme.config.json'), { force: true }),
      );
    }

    // Throw error if any repos are missing
    if (missingRepos.length > 0) {
      throw new Error(
        `Repositories not set up. Run: npm run setup\nMissing: ${missingRepos.join(', ')}`,
      );
    }

    // Clean up any existing generated files
    await Promise.allSettled(cleanups);
  });

  // Generate test suites dynamically for each repository
  for (const [key, config] of Object.entries(reposConfig)) {
    describe(config.name, () => {
      const repoDir = getRepoDir(key, config);
      const contextDir = config.contextDir || 'parseme-context';

      test('should initialize config', async () => {
        const { code, stdout } = await runParseme(repoDir, ['init']);

        assert.strictEqual(code, 0);
        assert.ok(stdout.includes('Configuration file created'));

        const configExists = await fileExists(join(repoDir, 'parseme.config.json'));
        assert.ok(configExists, 'Config file should be created');
      });

      test('should generate context', async () => {
        // Build generate command args - use --no-git-info and --no-git-files for generated projects
        const generateArgs = ['generate'];
        if (config.type === 'generate') {
          generateArgs.push('--no-git-info', '--no-git-files');
        }
        // Add custom context dir if specified
        if (config.contextDir) {
          generateArgs.push('--context-dir', config.contextDir);
        }

        const { code, stdout } = await runParseme(repoDir, generateArgs);

        assert.strictEqual(code, 0);
        assert.ok(stdout.includes('Context generated successfully'));
      });

      test('should create PARSEME.md', async () => {
        const parsemeExists = await fileExists(join(repoDir, 'PARSEME.md'));
        assert.ok(parsemeExists, 'PARSEME.md should exist');

        const content = await readFile(join(repoDir, 'PARSEME.md'), 'utf-8');
        assert.ok(content.length > 0, 'PARSEME.md should have content');
      });

      if (config.assertions?.shouldDetectFramework) {
        test(`should detect ${config.assertions.shouldDetectFramework} framework`, async () => {
          const content = await readFile(join(repoDir, 'PARSEME.md'), 'utf-8');
          const frameworkName = config.assertions.shouldDetectFramework;

          // Check that framework name appears on the same line as **Framework:**
          const frameworkLineRegex = new RegExp(`\\*\\*Framework:\\*\\*\\s+${frameworkName}`, 'i');
          assert.ok(
            frameworkLineRegex.test(content),
            `Should detect ${frameworkName} framework on the same line as **Framework:**`,
          );
        });
      }

      test('should create structure.json', async () => {
        const structureExists = await fileExists(join(repoDir, contextDir, 'structure.json'));
        assert.ok(structureExists, 'structure.json should exist');

        const structure = JSON.parse(
          await readFile(join(repoDir, contextDir, 'structure.json'), 'utf-8'),
        );
        assert.ok(Array.isArray(structure), 'Structure should be an array');
        assert.ok(structure.length > 0, 'Should analyze files');
      });

      if (config.assertions?.shouldHaveEndpoints) {
        test('should detect API endpoints', async () => {
          const endpointsPath = join(repoDir, contextDir, 'routes.json');
          const endpointsExist = await fileExists(endpointsPath);

          assert.ok(
            endpointsExist,
            'routes.json file should exist when shouldHaveEndpoints is true',
          );

          const content = await readFile(endpointsPath, 'utf-8');
          assert.ok(
            content.trim().length > 0,
            'routes.json should not be empty when shouldHaveEndpoints is true',
          );

          const endpoints = JSON.parse(content);
          assert.ok(Array.isArray(endpoints), 'Endpoints should be an array');
          assert.ok(endpoints.length > 0, 'Should detect at least one endpoint');

          if (config.assertions.minEndpoints) {
            assert.ok(
              endpoints.length >= config.assertions.minEndpoints,
              `Should detect at least ${config.assertions.minEndpoints} endpoints, but found ${endpoints.length}`,
            );
          }
        });
      }

      // Test for gitDiff file when repository has been modified (express repo)
      if (key === 'express') {
        test('should create gitDiff.md when there are uncommitted changes', async () => {
          const gitDiffPath = join(repoDir, contextDir, 'gitDiff.md');
          const gitDiffExists = await fileExists(gitDiffPath);

          assert.ok(
            gitDiffExists,
            'gitDiff.md file should exist when there are uncommitted changes',
          );

          const content = await readFile(gitDiffPath, 'utf-8');
          assert.ok(content.trim().length > 0, 'gitDiff.md should not be empty');

          // Verify the content contains expected git diff information
          assert.ok(content.includes('# Git Diff Statistics'), 'gitDiff.md should contain header');
          assert.ok(
            content.includes('package.json'),
            'gitDiff.md should reference the modified package.json file',
          );
        });
      }
    });
  }
});
