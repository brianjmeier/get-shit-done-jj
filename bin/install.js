#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../package.json');

// Platform detection
function detectPlatform() {
  // Check for explicit flag first
  const args = process.argv.slice(2);
  if (args.includes('--opencode') || args.includes('-o')) return 'opencode';
  if (args.includes('--claude-code') || args.includes('--cc')) return 'claude-code';
  
  // Check environment variables
  if (process.env.OPENCODE_CONFIG_DIR) return 'opencode';
  if (process.env.CLAUDE_CONFIG_DIR) return 'claude-code';
  
  // Check for existing installations
  const ocGlobal = path.join(os.homedir(), '.config', 'opencode');
  const ccGlobal = path.join(os.homedir(), '.claude');
  
  if (fs.existsSync(ocGlobal) && !fs.existsSync(ccGlobal)) return 'opencode';
  if (fs.existsSync(ccGlobal) && !fs.existsSync(ocGlobal)) return 'claude-code';
  
  // Default to claude-code (can be overridden with --opencode)
  return null; // Will prompt
}

const PLATFORM = detectPlatform();

// Platform-specific config
const PLATFORMS = {
  'claude-code': {
    name: 'Claude Code',
    globalDir: () => path.join(os.homedir(), '.claude'),
    localDir: '.claude',
    commandsDir: 'commands',
    commandPrefix: '/gsd:',
    configEnvVar: 'CLAUDE_CONFIG_DIR',
    pathPattern: /~\/\.claude\//g,
  },
  'opencode': {
    name: 'OpenCode',
    globalDir: () => path.join(os.homedir(), '.config', 'opencode'),
    localDir: '.opencode',
    commandsDir: 'command',  // singular in OpenCode
    commandPrefix: '/gsd-',
    configEnvVar: 'OPENCODE_CONFIG_DIR',
    pathPattern: /~\/\.config\/opencode\//g,
  }
};

const banner = `
${cyan}   ██████╗ ███████╗██████╗
  ██╔════╝ ██╔════╝██╔══██╗
  ██║  ███╗███████╗██║  ██║
  ██║   ██║╚════██║██║  ██║
  ╚██████╔╝███████║██████╔╝
   ╚═════╝ ╚══════╝╚═════╝${reset}

  Get Shit Done ${dim}v${pkg.version} (JJ)${reset}
  A meta-prompting, context engineering and spec-driven
  development system. JJ-first fork.
`;

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasOpenCode = args.includes('--opencode') || args.includes('-o');
const hasClaudeCode = args.includes('--claude-code') || args.includes('--cc');

// Parse --config-dir argument
function parseConfigDirArg() {
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = args[configDirIndex + 1];
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`  ${yellow}--config-dir requires a path argument${reset}`);
      process.exit(1);
    }
    return nextArg;
  }
  const configDirArg = args.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    return configDirArg.split('=')[1];
  }
  return null;
}
const explicitConfigDir = parseConfigDirArg();
const hasHelp = args.includes('--help') || args.includes('-h');

console.log(banner);

// Show help if requested
if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} npx get-shit-done-jj [options]

  ${yellow}Platform:${reset}
    ${cyan}-o, --opencode${reset}            Install for OpenCode (~/.config/opencode/)
    ${cyan}--cc, --claude-code${reset}       Install for Claude Code (~/.claude/)
    ${dim}If neither specified, auto-detects or prompts${reset}

  ${yellow}Location:${reset}
    ${cyan}-g, --global${reset}              Install globally (to config directory)
    ${cyan}-l, --local${reset}               Install locally (to current directory)
    ${cyan}-c, --config-dir <path>${reset}   Specify custom config directory

  ${yellow}Other:${reset}
    ${cyan}-h, --help${reset}                Show this help message

  ${yellow}Examples:${reset}
    ${dim}# Auto-detect platform, install globally${reset}
    npx get-shit-done-jj --global

    ${dim}# Install for OpenCode${reset}
    npx get-shit-done-jj --opencode --global

    ${dim}# Install for Claude Code${reset}
    npx get-shit-done-jj --claude-code --local

    ${dim}# Custom config directory${reset}
    npx get-shit-done-jj --opencode --config-dir ~/.config/opencode-dev
`);
  process.exit(0);
}

/**
 * Expand ~ to home directory
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Read and parse settings.json
 */
function readSettings(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json
 */
function writeSettings(settingsPath, settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

/**
 * Transform content for target platform
 */
function transformContent(content, platform, pathPrefix) {
  // Replace path references
  if (platform === 'opencode') {
    content = content.replace(/~\/\.claude\//g, pathPrefix);
    content = content.replace(/\.\/\.claude\//g, './.opencode/');
    content = content.replace(/\/gsd:/g, '/gsd-');
  } else {
    content = content.replace(/~\/\.claude\//g, pathPrefix);
  }
  return content;
}

/**
 * Recursively copy directory with transformations
 */
function copyWithTransform(srcDir, destDir, platform, pathPrefix) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithTransform(srcPath, destPath, platform, pathPrefix);
    } else if (entry.name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = transformContent(content, platform, pathPrefix);
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Verify directory exists and has files
 */
function verifyInstalled(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory not created`);
    return false;
  }
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      console.error(`  ${yellow}✗${reset} Failed to install ${description}: directory is empty`);
      return false;
    }
  } catch (e) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: ${e.message}`);
    return false;
  }
  return true;
}

/**
 * Verify file exists
 */
function verifyFileInstalled(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`  ${yellow}✗${reset} Failed to install ${description}: file not created`);
    return false;
  }
  return true;
}

/**
 * Install to the specified directory
 */
function install(platform, isGlobal) {
  const platformConfig = PLATFORMS[platform];
  const src = path.join(__dirname, '..');
  
  // Determine target directory
  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env[platformConfig.configEnvVar]);
  const defaultGlobalDir = configDir || platformConfig.globalDir();
  const targetDir = isGlobal
    ? defaultGlobalDir
    : path.join(process.cwd(), platformConfig.localDir);

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  // Path prefix for file references
  const pathPrefix = isGlobal
    ? (configDir ? `${targetDir}/` : (platform === 'opencode' ? '~/.config/opencode/' : '~/.claude/'))
    : (platform === 'opencode' ? './.opencode/' : './.claude/');

  console.log(`  Platform: ${cyan}${platformConfig.name}${reset}`);
  console.log(`  Installing to ${cyan}${locationLabel}${reset}\n`);

  const failures = [];

  // Create commands directory (singular for OpenCode, plural for Claude Code)
  const commandsDir = path.join(targetDir, platformConfig.commandsDir);
  fs.mkdirSync(commandsDir, { recursive: true });

  // Determine source commands directory
  // Use adapters/opencode/command if OpenCode and it exists, otherwise use commands/
  let gsdSrc;
  if (platform === 'opencode') {
    const adapterSrc = path.join(src, 'adapters', 'opencode', 'command', 'gsd');
    if (fs.existsSync(adapterSrc)) {
      gsdSrc = adapterSrc;
    } else {
      gsdSrc = path.join(src, 'commands', 'gsd');
    }
  } else {
    gsdSrc = path.join(src, 'commands', 'gsd');
  }
  
  const gsdDest = path.join(commandsDir, 'gsd');
  copyWithTransform(gsdSrc, gsdDest, platform, pathPrefix);
  if (verifyInstalled(gsdDest, `${platformConfig.commandsDir}/gsd`)) {
    console.log(`  ${green}✓${reset} Installed ${platformConfig.commandsDir}/gsd`);
  } else {
    failures.push(`${platformConfig.commandsDir}/gsd`);
  }

  // Copy get-shit-done skill
  const skillSrc = path.join(src, 'get-shit-done');
  const skillDest = path.join(targetDir, 'get-shit-done');
  copyWithTransform(skillSrc, skillDest, platform, pathPrefix);
  if (verifyInstalled(skillDest, 'get-shit-done')) {
    console.log(`  ${green}✓${reset} Installed get-shit-done`);
  } else {
    failures.push('get-shit-done');
  }

  // Copy agents
  const agentsSrc = path.join(src, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetDir, 'agents');
    fs.mkdirSync(agentsDest, { recursive: true });

    // Remove old GSD agents before copying
    if (fs.existsSync(agentsDest)) {
      for (const file of fs.readdirSync(agentsDest)) {
        if (file.startsWith('gsd-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(agentsDest, file));
        }
      }
    }

    const agentEntries = fs.readdirSync(agentsSrc, { withFileTypes: true });
    for (const entry of agentEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        let content = fs.readFileSync(path.join(agentsSrc, entry.name), 'utf8');
        content = transformContent(content, platform, pathPrefix);
        fs.writeFileSync(path.join(agentsDest, entry.name), content);
      }
    }
    if (verifyInstalled(agentsDest, 'agents')) {
      console.log(`  ${green}✓${reset} Installed agents`);
    } else {
      failures.push('agents');
    }
  }

  // Copy CHANGELOG.md
  const changelogSrc = path.join(src, 'CHANGELOG.md');
  const changelogDest = path.join(targetDir, 'get-shit-done', 'CHANGELOG.md');
  if (fs.existsSync(changelogSrc)) {
    fs.copyFileSync(changelogSrc, changelogDest);
    if (verifyFileInstalled(changelogDest, 'CHANGELOG.md')) {
      console.log(`  ${green}✓${reset} Installed CHANGELOG.md`);
    } else {
      failures.push('CHANGELOG.md');
    }
  }

  // Write VERSION file
  const versionDest = path.join(targetDir, 'get-shit-done', 'VERSION');
  fs.writeFileSync(versionDest, pkg.version);
  if (verifyFileInstalled(versionDest, 'VERSION')) {
    console.log(`  ${green}✓${reset} Wrote VERSION (${pkg.version})`);
  } else {
    failures.push('VERSION');
  }

  // Copy hooks (Claude Code only - OpenCode doesn't use hooks)
  if (platform === 'claude-code') {
    const hooksSrc = path.join(src, 'hooks');
    if (fs.existsSync(hooksSrc)) {
      const hooksDest = path.join(targetDir, 'hooks');
      fs.mkdirSync(hooksDest, { recursive: true });
      const hookEntries = fs.readdirSync(hooksSrc);
      for (const entry of hookEntries) {
        const srcFile = path.join(hooksSrc, entry);
        const destFile = path.join(hooksDest, entry);
        fs.copyFileSync(srcFile, destFile);
      }
      if (verifyInstalled(hooksDest, 'hooks')) {
        console.log(`  ${green}✓${reset} Installed hooks`);
      } else {
        failures.push('hooks');
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\n  ${yellow}Installation incomplete!${reset} Failed: ${failures.join(', ')}`);
    process.exit(1);
  }

  // Settings (Claude Code only)
  const settingsPath = path.join(targetDir, 'settings.json');
  const settings = readSettings(settingsPath);

  return { settingsPath, settings, platform, platformConfig };
}

/**
 * Finish installation
 */
function finishInstall(settingsPath, settings, platform, platformConfig) {
  // Write settings for Claude Code
  if (platform === 'claude-code') {
    writeSettings(settingsPath, settings);
  }

  const helpCmd = platform === 'opencode' ? '/gsd-help' : '/gsd:help';
  
  console.log(`
  ${green}Done!${reset} Launch ${platformConfig.name} and run ${cyan}${helpCmd}${reset}.
`);
}

/**
 * Prompt for platform
 */
function promptPlatform(callback) {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive, defaulting to Claude Code${reset}\n`);
    callback('claude-code');
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`  ${yellow}Which platform are you using?${reset}

  ${cyan}1${reset}) Claude Code ${dim}(~/.claude)${reset}
  ${cyan}2${reset}) OpenCode    ${dim}(~/.config/opencode)${reset}
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    callback(choice === '2' ? 'opencode' : 'claude-code');
  });
}

/**
 * Prompt for location
 */
function promptLocation(platform, callback) {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive, defaulting to global install${reset}\n`);
    callback(true);
    return;
  }

  const platformConfig = PLATFORMS[platform];
  const configDir = expandTilde(explicitConfigDir) || expandTilde(process.env[platformConfig.configEnvVar]);
  const globalPath = configDir || platformConfig.globalDir();
  const globalLabel = globalPath.replace(os.homedir(), '~');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`  ${yellow}Where would you like to install?${reset}

  ${cyan}1${reset}) Global ${dim}(${globalLabel})${reset} - available in all projects
  ${cyan}2${reset}) Local  ${dim}(${platformConfig.localDir})${reset} - this project only
`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    rl.close();
    const choice = answer.trim() || '1';
    callback(choice !== '2');
  });
}

// Main
if (hasOpenCode && hasClaudeCode) {
  console.error(`  ${yellow}Cannot specify both --opencode and --claude-code${reset}`);
  process.exit(1);
}

if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
}

// Determine platform
const platform = hasOpenCode ? 'opencode' : (hasClaudeCode ? 'claude-code' : PLATFORM);

function runInstall(finalPlatform, isGlobal) {
  const { settingsPath, settings, platform, platformConfig } = install(finalPlatform, isGlobal);
  finishInstall(settingsPath, settings, platform, platformConfig);
}

if (platform) {
  // Platform known
  if (hasGlobal || hasLocal) {
    runInstall(platform, hasGlobal);
  } else {
    promptLocation(platform, (isGlobal) => {
      runInstall(platform, isGlobal);
    });
  }
} else {
  // Need to prompt for platform
  promptPlatform((selectedPlatform) => {
    if (hasGlobal || hasLocal) {
      runInstall(selectedPlatform, hasGlobal);
    } else {
      promptLocation(selectedPlatform, (isGlobal) => {
        runInstall(selectedPlatform, isGlobal);
      });
    }
  });
}
