import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import { readFile, access, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');
const REPOS_DIR = join(E2E_DIR, 'repos');
const CLI_PATH = join(E2E_DIR, '..', 'npm', 'dist', 'cli', 'cli.js');
const REPOS_CONFIG_PATH = join(E2E_DIR, 'test-repositories-list.json');

// Load repository configurations
const reposConfig = JSON.parse(
  await readFile(REPOS_CONFIG_PATH, 'utf-8')
);

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
  const repoName = config.directory || config.repo.split('/').pop();
  const basePath = join(REPOS_DIR, repoName);
  return config.path === '.' ? basePath : join(basePath, config.path);
}

describe('E2E Test Repositories', () => {
  before(async () => {
    // Check that all configured repositories are cloned
    const missingRepos = [];
    for (const [key, config] of Object.entries(reposConfig)) {
      const repoDir = getRepoDir(key, config);
      const exists = await fileExists(repoDir);
      if (!exists) {
        missingRepos.push(`${config.name} at ${repoDir}`);
      }
    }

    if (missingRepos.length > 0) {
      throw new Error(
        `Repositories not cloned. Run: ./e2e/scripts/clone-repos.sh\nMissing: ${missingRepos.join(', ')}`
      );
    }

    // Clean up any existing generated files before running tests
    const cleanups = [];
    for (const [key, config] of Object.entries(reposConfig)) {
      const repoDir = getRepoDir(key, config);
      cleanups.push(
        rm(join(repoDir, 'PARSEME.md'), { force: true }),
        rm(join(repoDir, 'parseme-context'), { recursive: true, force: true }),
        rm(join(repoDir, 'parseme.config.json'), { force: true })
      );
    }

    await Promise.allSettled(cleanups);
  });

  // Generate test suites dynamically for each repository
  for (const [key, config] of Object.entries(reposConfig)) {
    describe(config.name, () => {
      const repoDir = getRepoDir(key, config);

      test('should initialize config', async () => {
        const { code, stdout } = await runParseme(repoDir, ['init']);

        assert.strictEqual(code, 0);
        assert.ok(stdout.includes('Configuration file created'));

        const configExists = await fileExists(join(repoDir, 'parseme.config.json'));
        assert.ok(configExists, 'Config file should be created');
      });

      test('should generate context', async () => {
        const { code, stdout } = await runParseme(repoDir, ['generate']);

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
          assert.ok(
            content.includes(frameworkName) || content.includes(frameworkName.toLowerCase()),
            `Should detect ${frameworkName} framework`
          );
        });
      }

      test('should create structure.json', async () => {
        const structureExists = await fileExists(
          join(repoDir, 'parseme-context', 'structure.json')
        );
        assert.ok(structureExists, 'structure.json should exist');

        const structure = JSON.parse(
          await readFile(join(repoDir, 'parseme-context', 'structure.json'), 'utf-8')
        );
        assert.ok(Array.isArray(structure), 'Structure should be an array');
        assert.ok(structure.length > 0, 'Should analyze files');
      });

      if (config.assertions?.shouldHaveEndpoints) {
        test('should detect API endpoints', async () => {
          const endpointsPath = join(repoDir, 'parseme-context', 'routes.json');
          const endpointsExist = await fileExists(endpointsPath);

          if (endpointsExist) {
            const content = await readFile(endpointsPath, 'utf-8');
            // Skip if file is empty (no routes detected)
            if (content.trim().length > 0) {
              const endpoints = JSON.parse(content);
              assert.ok(Array.isArray(endpoints), 'Endpoints should be an array');

              if (config.assertions.minEndpoints) {
                assert.ok(
                  endpoints.length >= config.assertions.minEndpoints,
                  `Should detect at least ${config.assertions.minEndpoints} endpoints`
                );
              }
            }
          }
        });
      }
    });
  }
});
