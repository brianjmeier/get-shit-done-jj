#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function runInstaller(args) {
  return new Promise((resolve, reject) => {
    const installerPath = path.join(projectRoot, 'bin', 'install.js');
    const child = spawn('node', [installerPath, ...args], {
      stdio: 'pipe',
      env: { ...process.env, HOME: os.tmpdir() }, // Override HOME for testing
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
        reject(new Error(`Installer exited with code ${code}\n${stderr}`));
      }
    });
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function cleanup(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function testClaudeCodeInstallation() {
  log('\n→ Testing Claude Code installation...', colors.blue);

  const tempDir = path.join(os.tmpdir(), `gsd-test-claude-${Date.now()}`);
  const installPath = path.join(tempDir, '.claude');

  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Run installer with --claude-code --local from temp directory
    process.chdir(tempDir);
    await runInstaller(['--claude-code', '--local']);

    // Verify expected files exist
    const expectedFiles = [
      path.join(installPath, 'get-shit-done'),
      path.join(installPath, 'commands', 'gsd'),
    ];

    for (const file of expectedFiles) {
      const exists = await fileExists(file);
      if (!exists) {
        throw new Error(`Expected file/directory not found: ${file}`);
      }
    }

    // Verify at least one command file exists
    const commandsDir = path.join(installPath, 'commands', 'gsd');
    const commandFiles = await fs.readdir(commandsDir);
    if (commandFiles.length === 0) {
      throw new Error('No command files found in commands/gsd');
    }

    // Verify at least one shared core file exists
    const coreDir = path.join(installPath, 'get-shit-done');
    const coreFiles = await fs.readdir(coreDir);
    if (coreFiles.length === 0) {
      throw new Error('No files found in get-shit-done');
    }

    log('  ✓ Claude Code installation successful', colors.green);
    return true;
  } catch (error) {
    log(`  ✗ Claude Code installation failed: ${error.message}`, colors.red);
    return false;
  } finally {
    process.chdir(projectRoot);
    await cleanup(tempDir);
  }
}

async function testOpenCodeInstallation() {
  log('\n→ Testing OpenCode installation...', colors.blue);

  const tempDir = path.join(os.tmpdir(), `gsd-test-opencode-${Date.now()}`);
  const installPath = path.join(tempDir, '.opencode');

  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Run installer with --opencode --local from temp directory
    process.chdir(tempDir);
    await runInstaller(['--opencode', '--local']);

    // Verify expected files exist
    const expectedFiles = [
      path.join(installPath, 'get-shit-done'),
      path.join(installPath, 'commands', 'gsd'),
    ];

    for (const file of expectedFiles) {
      const exists = await fileExists(file);
      if (!exists) {
        throw new Error(`Expected file/directory not found: ${file}`);
      }
    }

    // Verify at least one command file exists
    const commandsDir = path.join(installPath, 'commands', 'gsd');
    const commandFiles = await fs.readdir(commandsDir);
    if (commandFiles.length === 0) {
      throw new Error('No command files found in commands/gsd');
    }

    // Verify at least one shared core file exists
    const coreDir = path.join(installPath, 'get-shit-done');
    const coreFiles = await fs.readdir(coreDir);
    if (coreFiles.length === 0) {
      throw new Error('No files found in get-shit-done');
    }

    log('  ✓ OpenCode installation successful', colors.green);
    return true;
  } catch (error) {
    log(`  ✗ OpenCode installation failed: ${error.message}`, colors.red);
    return false;
  } finally {
    process.chdir(projectRoot);
    await cleanup(tempDir);
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.blue);
  log('GSD-JJ Installation Test Suite', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  const results = [];

  // Test Claude Code installation
  results.push(await testClaudeCodeInstallation());

  // Test OpenCode installation
  results.push(await testOpenCodeInstallation());

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  const passed = results.filter(Boolean).length;
  const total = results.length;

  if (passed === total) {
    log(`All tests passed (${passed}/${total})`, colors.green);
    log('='.repeat(60) + '\n', colors.green);
    process.exit(0);
  } else {
    log(`Tests failed: ${total - passed}/${total} failed`, colors.red);
    log('='.repeat(60) + '\n', colors.red);
    process.exit(1);
  }
}

main().catch((error) => {
  log('\nTest suite error:', colors.red);
  log(error.message, colors.red);
  log(error.stack, colors.dim);
  process.exit(1);
});
