#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    client: null, // 'claude-code' | 'opencode' | null (interactive)
    scope: 'global', // 'global' | 'local'
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--claude-code':
      case '-c':
        options.client = 'claude-code';
        break;
      case '--opencode':
      case '-o':
        options.client = 'opencode';
        break;
      case '--global':
      case '-g':
        options.scope = 'global';
        break;
      case '--local':
      case '-l':
        options.scope = 'local';
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        log(`Unknown option: ${arg}`, colors.red);
        options.help = true;
    }
  }

  return options;
}

function showHelp() {
  log('\nGSD-JJ Installer', colors.bright + colors.blue);
  log('================\n', colors.blue);
  log('Install GSD (Get Shit Done) context engineering framework with JJ (Jujutsu) VCS\n');
  log('Usage:', colors.bright);
  log('  npx gsd-jj [options]\n');
  log('Options:', colors.bright);
  log('  -c, --claude-code    Force Claude Code installation');
  log('  -o, --opencode       Force OpenCode installation');
  log('  -g, --global         Install globally (default)');
  log('  -l, --local          Install to current project (.claude/ or .opencode/)');
  log('  -h, --help           Show this help message\n');
  log('Examples:', colors.bright);
  log('  npx gsd-jj                  # Interactive prompt to select client');
  log('  npx gsd-jj --claude-code    # Install for Claude Code to ~/.claude/');
  log('  npx gsd-jj --opencode       # Install for OpenCode to ~/.config/opencode/');
  log('  npx gsd-jj -o --local       # Install for OpenCode to ./.opencode/\n');
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function selectClient() {
  log('\nSelect client:', colors.bright);
  log('1. Claude Code');
  log('2. OpenCode\n');

  const answer = await prompt('Enter choice (1 or 2): ');

  if (answer === '1') return 'claude-code';
  if (answer === '2') return 'opencode';

  log('Invalid choice. Defaulting to Claude Code.', colors.yellow);
  return 'claude-code';
}

function getTargetPath(client, scope) {
  const home = os.homedir();

  if (scope === 'global') {
    if (client === 'claude-code') {
      return path.join(home, '.claude');
    } else {
      return path.join(home, '.config', 'opencode');
    }
  } else {
    // local
    return client === 'claude-code' ? '.claude' : '.opencode';
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function install(client, scope) {
  const targetPath = getTargetPath(client, scope);
  const absoluteTargetPath = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(process.cwd(), targetPath);

  log(`\nInstalling GSD-JJ for ${client} (${scope})...`, colors.bright);
  log(`Target: ${absoluteTargetPath}\n`, colors.blue);

  try {
    // 1. Copy shared core (get-shit-done/)
    const coreSource = path.join(projectRoot, 'get-shit-done');
    const coreTarget = path.join(absoluteTargetPath, 'get-shit-done');

    log('→ Copying shared core...', colors.blue);
    await copyDirectory(coreSource, coreTarget);
    log('  ✓ Shared core installed', colors.green);

    // 2. Copy client-specific commands
    let commandsSource;
    if (client === 'claude-code') {
      commandsSource = path.join(projectRoot, 'commands', 'gsd');
    } else {
      commandsSource = path.join(projectRoot, 'adapters', 'opencode', 'command', 'gsd');
    }

    const commandsTarget = path.join(absoluteTargetPath, 'commands', 'gsd');

    log('→ Copying client-specific commands...', colors.blue);
    await copyDirectory(commandsSource, commandsTarget);
    log('  ✓ Commands installed', colors.green);

    // Success message
    log('\n' + '='.repeat(60), colors.green);
    log('Installation complete!', colors.bright + colors.green);
    log('='.repeat(60) + '\n', colors.green);

    log('Usage instructions:', colors.bright);
    if (client === 'claude-code') {
      log('  In Claude Code, type: /gsd:help');
      log('  To start a new project: /gsd:new-project');
      log('  To check progress: /gsd:progress\n');
    } else {
      log('  In OpenCode, type: /gsd:help');
      log('  To start a new project: /gsd:new-project');
      log('  To check progress: /gsd:progress\n');
    }

    log(`Installation path: ${absoluteTargetPath}`, colors.blue);
    log(`Installed for: ${client}`, colors.blue);
    log(`Scope: ${scope}\n`, colors.blue);
  } catch (error) {
    log('\nInstallation failed:', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  log('\n' + '='.repeat(60), colors.blue);
  log('GSD-JJ Installer', colors.bright + colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  // Select client if not specified
  let client = options.client;
  if (!client) {
    client = await selectClient();
  }

  // Install
  await install(client, options.scope);
}

main().catch((error) => {
  log('\nUnexpected error:', colors.red);
  log(error.message, colors.red);
  process.exit(1);
});
