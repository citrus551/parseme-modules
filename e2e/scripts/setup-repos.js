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
async function cloneSparse(key, repoUrl, name, subpath, branch) {
  const targetDir = join(REPOS_DIR, key);

  console.log(`Cloning ${name}...`);

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

    console.log(`Success: ${name} cloned\n`);
  } catch (error) {
    console.error(`Failed to clone ${name}: ${error.message}`);
    throw error;
  }
}

// Function to apply modifications to cloned repositories
async function applyRepoModifications(targetDir, modifications) {
  // Skip if no modifications defined
  if (!modifications || !modifications['package.json']) {
    return;
  }

  try {
    const { readFile, writeFile } = await import('fs/promises');
    const packageJsonPath = join(targetDir, 'package.json');

    // Read the package.json file
    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // Merge the modifications into package.json
    Object.assign(packageJson, modifications['package.json']);

    // Write back the modified package.json
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  } catch (error) {
    console.error(`Failed to apply modifications: ${error.message}`);
    throw error;
  }
}

// Function to generate a project using a command
async function generateProject(key, name, generateConfig) {
  const targetDir = join(REPOS_DIR, key);

  console.log(`Generating ${name}...`);

  // Remove if exists
  await rm(targetDir, { recursive: true, force: true });

  try {
    const { command, args } = generateConfig;

    // Run the generation command in the repos directory
    await runCommand(command, args, REPOS_DIR);

    console.log(`Success: ${name} generated\n`);
  } catch (error) {
    console.error(`Failed to generate ${name}: ${error.message}`);
    throw error;
  }
}

// Main function
async function main() {
  console.log('Setting up test repositories...\n');

  // Create repos directory
  await mkdir(REPOS_DIR, { recursive: true });

  // Read repositories configuration
  const config = JSON.parse(await readFile(REPOS_CONFIG, 'utf-8'));

  // Process each repository (clone or generate)
  for (const [key, repoConfig] of Object.entries(config)) {
    if (repoConfig.type === 'generate') {
      // Generate project using a command
      const name = repoConfig.name;
      const generateConfig = repoConfig.generate;

      await generateProject(key, name, generateConfig);
    } else if (repoConfig.type === 'clone') {
      // Clone from git repository
      const name = repoConfig.name;
      const repoUrl = repoConfig.repo;
      const subpath = repoConfig.path;
      const branch = repoConfig.branch;

      await cloneSparse(key, repoUrl, name, subpath, branch);

      // Apply any modifications after cloning
      if (repoConfig.modifications) {
        const baseDir = join(REPOS_DIR, key);
        const targetDir = subpath && subpath !== '.'
          ? join(baseDir, subpath)
          : baseDir;
        await applyRepoModifications(targetDir, repoConfig.modifications);
      }
    } else {
      console.warn(`Warning: Unknown repository type "${repoConfig.type}" for ${repoConfig.name}. Skipping.`);
    }
  }

  console.log('All repositories set up successfully');
  console.log(`Location: ${REPOS_DIR}`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
