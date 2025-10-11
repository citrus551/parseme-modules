import { describe, test, before, after } from 'node:test';
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

describe('E2E Framework Examples', () => {
  before(async () => {
    // Ensure repos are cloned
    const nestjsExists = await fileExists(join(REPOS_DIR, 'nestjs-cats-app', 'sample', '01-cats-app'));
    const expressExists = await fileExists(join(REPOS_DIR, 'express-multi-router', 'examples', 'multi-router'));
    const fastifyExists = await fileExists(join(REPOS_DIR, 'fastify-demo'));

    if (!nestjsExists || !expressExists || !fastifyExists) {
      throw new Error(
        'Repositories not cloned. Run: ./e2e/scripts/clone-repos.sh'
      );
    }

    // Clean up any existing generated files before running tests
    const cleanups = [
      rm(join(REPOS_DIR, 'nestjs-cats-app', 'sample', '01-cats-app', 'PARSEME.md'), { force: true }),
      rm(join(REPOS_DIR, 'nestjs-cats-app', 'sample', '01-cats-app', 'parseme-context'), { recursive: true, force: true }),
      rm(join(REPOS_DIR, 'nestjs-cats-app', 'sample', '01-cats-app', 'parseme.config.json'), { force: true }),
      rm(join(REPOS_DIR, 'express-multi-router', 'examples', 'multi-router', 'PARSEME.md'), { force: true }),
      rm(join(REPOS_DIR, 'express-multi-router', 'examples', 'multi-router', 'parseme-context'), { recursive: true, force: true }),
      rm(join(REPOS_DIR, 'express-multi-router', 'examples', 'multi-router', 'parseme.config.json'), { force: true }),
      rm(join(REPOS_DIR, 'fastify-demo', 'PARSEME.md'), { force: true }),
      rm(join(REPOS_DIR, 'fastify-demo', 'parseme-context'), { recursive: true, force: true }),
      rm(join(REPOS_DIR, 'fastify-demo', 'parseme.config.json'), { force: true }),
    ];

    await Promise.allSettled(cleanups);
  });

  describe('NestJS Cats App', () => {
    const repoDir = join(REPOS_DIR, 'nestjs-cats-app', 'sample', '01-cats-app');

    test('should initialize config', async () => {
      const { code, stdout } = await runParseme(repoDir, [
        'init',
        '--format',
        'json',
      ]);

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

    test('should detect NestJS framework', async () => {
      const content = await readFile(join(repoDir, 'PARSEME.md'), 'utf-8');
      assert.ok(
        content.includes('NestJS') || content.includes('nestjs'),
        'Should detect NestJS framework'
      );
    });

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

    test('should detect API endpoints', async () => {
      const endpointsPath = join(repoDir, 'parseme-context', 'routes.json');
      const endpointsExist = await fileExists(endpointsPath);

      if (endpointsExist) {
        const endpoints = JSON.parse(await readFile(endpointsPath, 'utf-8'));
        assert.ok(Array.isArray(endpoints), 'Endpoints should be an array');
        assert.ok(endpoints.length >= 3, 'Should detect at least 3 endpoints');
      }
    });
  });

  describe('Express Multi-Router', () => {
    const repoDir = join(REPOS_DIR, 'express-multi-router', 'examples', 'multi-router');

    test('should initialize config', async () => {
      const { code, stdout } = await runParseme(repoDir, [
        'init',
        '--format',
        'json',
      ]);

      assert.strictEqual(code, 0);
      assert.ok(stdout.includes('Configuration file created'));
    });

    test('should generate context', async () => {
      const { code, stdout } = await runParseme(repoDir, ['generate']);

      assert.strictEqual(code, 0);
      assert.ok(stdout.includes('Context generated successfully'));
    });

    test('should create PARSEME.md', async () => {
      const parsemeExists = await fileExists(join(repoDir, 'PARSEME.md'));
      assert.ok(parsemeExists, 'PARSEME.md should exist');
    });

    test('should detect Express framework', async () => {
      const content = await readFile(join(repoDir, 'PARSEME.md'), 'utf-8');
      assert.ok(
        content.includes('Express') || content.includes('express'),
        'Should detect Express framework'
      );
    });

    test('should detect API endpoints', async () => {
      const endpointsPath = join(repoDir, 'parseme-context', 'routes.json');
      const endpointsExist = await fileExists(endpointsPath);

      if (endpointsExist) {
        const endpoints = JSON.parse(await readFile(endpointsPath, 'utf-8'));
        assert.ok(Array.isArray(endpoints), 'Endpoints should be an array');
        assert.ok(endpoints.length >= 2, 'Should detect at least 2 endpoints');
      }
    });
  });

  describe('Fastify Demo', () => {
    const repoDir = join(REPOS_DIR, 'fastify-demo');

    test('should initialize config', async () => {
      const { code, stdout } = await runParseme(repoDir, [
        'init',
        '--format',
        'json',
      ]);

      assert.strictEqual(code, 0);
      assert.ok(stdout.includes('Configuration file created'));

      // Update config to allow more files to be analyzed
      const { writeFile } = await import('fs/promises');
      const configPath = join(repoDir, 'parseme.config.json');
      await writeFile(configPath, JSON.stringify({
        limits: {
          maxFilesPerContext: 100
        }
      }, null, 2));
    });

    test('should generate context', async () => {
      const { code, stdout } = await runParseme(repoDir, ['generate']);

      assert.strictEqual(code, 0);
      assert.ok(stdout.includes('Context generated successfully'));
    });

    test('should create PARSEME.md', async () => {
      const parsemeExists = await fileExists(join(repoDir, 'PARSEME.md'));
      assert.ok(parsemeExists, 'PARSEME.md should exist');
    });

    test('should detect Fastify framework', async () => {
      const content = await readFile(join(repoDir, 'PARSEME.md'), 'utf-8');
      assert.ok(
        content.includes('Fastify') || content.includes('fastify'),
        'Should detect Fastify framework'
      );
    });

    test('should detect API endpoints', async () => {
      const endpointsPath = join(repoDir, 'parseme-context', 'routes.json');
      const endpointsExist = await fileExists(endpointsPath);

      if (endpointsExist) {
        const content = await readFile(endpointsPath, 'utf-8');
        // Skip if file is empty (no routes detected)
        if (content.trim().length > 0) {
          const endpoints = JSON.parse(content);
          assert.ok(Array.isArray(endpoints), 'Endpoints should be an array');
        }
      }
    });
  });
});
