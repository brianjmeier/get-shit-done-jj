#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const readline = require('readline');
const path = require('path');

const {
  parseArgs,
  validateArgs,
  createInstaller,
} = require('../lib/installer');

// Get version from package.json
const pkg = require('../package.json');

// Colors
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

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

console.log(banner);

// Parse and validate arguments
const args = parseArgs(process.argv.slice(2));
const validation = validateArgs(args);

if (!validation.valid) {
  console.error(`  ${yellow}${validation.error}${reset}`);
  process.exit(1);
}

// Show help if requested
if (args.help) {
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

// Create installer with real dependencies
const installer = createInstaller({
  fs,
  os,
  process,
  readline,
  pkg,
});

// Detect platform
const detectedPlatform = installer.detectPlatform(args);

// Run installation flow
function runInstall(platform, isGlobal) {
  const result = installer.install(platform, isGlobal, {
    srcDir: path.join(__dirname, '..'),
    configDir: args.configDir,
  });
  
  if (!result.success) {
    process.exit(1);
  }
}

if (detectedPlatform) {
  // Platform known
  if (args.global || args.local) {
    runInstall(detectedPlatform, args.global);
  } else {
    installer.promptLocation(detectedPlatform, args.configDir, (isGlobal) => {
      runInstall(detectedPlatform, isGlobal);
    });
  }
} else {
  // Need to prompt for platform
  installer.promptPlatform((selectedPlatform) => {
    if (args.global || args.local) {
      runInstall(selectedPlatform, args.global);
    } else {
      installer.promptLocation(selectedPlatform, args.configDir, (isGlobal) => {
        runInstall(selectedPlatform, isGlobal);
      });
    }
  });
}
