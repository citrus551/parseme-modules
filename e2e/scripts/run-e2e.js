#!/usr/bin/env node

import { spawn } from 'child_process';
import { access, constants } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_DIR = __dirname;
const E2E_DIR = join(SCRIPT_DIR, '..');
const REPOS_DIR = join(E2E_DIR, 'repos');
const NPM_DIR = join(E2E_DIR, '..', 'npm');

// Helper to run shell commands with output
function runCommand(command, args, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(description || `Running: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// Helper to check if directory exists
async function dirExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Main function
async function main() {
  console.log('=========================================');
  console.log('Parseme E2E Tests');
  console.log('=========================================\n');

  // Check if repos exist
  const reposExist = await dirExists(REPOS_DIR);
  if (!reposExist) {
    console.log('Repositories not found. Setting up...');
    await runCommand('node', [join(SCRIPT_DIR, 'setup-repos.js')], SCRIPT_DIR);
    console.log('');
  }

  // Always build npm package to ensure latest code
  console.log('Building npm package...');
  await runCommand('npm', ['run', 'build'], NPM_DIR);
  console.log('');

  console.log('Running E2E tests...\n');

  // Run tests with Node test runner
  await runCommand(
    'node',
    ['--test', join(E2E_DIR, 'tests', 'test-repositories.test.js')],
    E2E_DIR,
  );

  console.log('\n=========================================');
  console.log('E2E Tests Complete');
  console.log('=========================================');
}

main().catch((error) => {
  console.error('\nError:', error.message);
  process.exit(1);
});
