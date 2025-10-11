#!/usr/bin/env node

import { readFile, rm, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');
const REPOS_DIR = join(E2E_DIR, 'repos');
const REPOS_CONFIG = join(E2E_DIR, 'test-repositories-list.json');

// Helper to run shell commands
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
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
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', reject);
  });
}

// Function to clone with sparse checkout
async function cloneSparse(repoUrl, repoName, subpath, branch) {
  const targetDir = join(REPOS_DIR, repoName);

  console.log(`Cloning ${repoName}...`);

  // Remove if exists
  await rm(targetDir, { recursive: true, force: true });

  try {
    if (subpath === '.') {
      // Clone entire repo
      await runCommand('git', [
        'clone',
        '--depth', '1',
        '--branch', branch,
        repoUrl,
        targetDir
      ]);
    } else {
      // Sparse checkout for subdirectory only
      await mkdir(targetDir, { recursive: true });

      // Initialize git repo
      await runCommand('git', ['init'], targetDir);

      // Add remote
      await runCommand('git', ['remote', 'add', 'origin', repoUrl], targetDir);

      // Configure sparse checkout
      await runCommand('git', ['config', 'core.sparseCheckout', 'true'], targetDir);

      // Write sparse-checkout file
      const sparseCheckoutPath = join(targetDir, '.git', 'info', 'sparse-checkout');
      await mkdir(dirname(sparseCheckoutPath), { recursive: true });
      const { writeFile } = await import('fs/promises');
      await writeFile(sparseCheckoutPath, `${subpath}/*\n`);

      // Fetch and checkout
      await runCommand('git', ['fetch', '--depth', '1', 'origin', branch], targetDir);
      await runCommand('git', ['checkout', branch], targetDir);
    }

    console.log(`Success: ${repoName} cloned\n`);
  } catch (error) {
    console.error(`Failed to clone ${repoName}: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  console.log('Cloning test repositories...\n');

  // Create repos directory
  await mkdir(REPOS_DIR, { recursive: true });

  // Read repositories configuration
  const config = JSON.parse(await readFile(REPOS_CONFIG, 'utf-8'));

  // Clone each repository
  for (const [key, repoConfig] of Object.entries(config)) {
    const repoUrl = repoConfig.repo;
    const repoName = repoConfig.directory || repoUrl.split('/').pop(); // Use directory name if specified
    const subpath = repoConfig.path;
    const branch = repoConfig.branch;

    await cloneSparse(repoUrl, repoName, subpath, branch);
  }

  console.log('All repositories cloned successfully');
  console.log(`Location: ${REPOS_DIR}`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
