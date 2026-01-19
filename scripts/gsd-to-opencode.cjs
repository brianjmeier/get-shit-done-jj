#!/usr/bin/env node

/**
 * gsd-to-opencode.cjs
 * 
 * Transforms the original get-shit-done (Claude Code) repository into
 * an OpenCode-compatible version.
 * 
 * Usage:
 *   node scripts/gsd-to-opencode.cjs [options]
 * 
 * Options:
 *   --source <path>     Source get-shit-done repo (default: clones from GitHub)
 *   --output <path>     Output directory (default: ./gsd-opencode-output)
 *   --version <version> Version tag to use (default: latest)
 *   --dry-run           Show what would be transformed without writing
 *   --help              Show this help message
 */

const fs = require('fs');
const { execSync } = require('child_process');
const { parseArgs, createGsdTransformer } = require('../lib/transformer');

// ============================================================================
// COLORS
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function log(msg) {
  console.log(`  ${msg}`);
}

function logStep(step, msg) {
  console.log(`${colors.cyan}[${step}]${colors.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function logWarning(msg) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

// ============================================================================
// BANNER & HELP
// ============================================================================

function printBanner() {
  console.log(`
${colors.cyan}   ██████╗ ███████╗██████╗    ████████╗ ██████╗ 
  ██╔════╝ ██╔════╝██╔══██╗   ╚══██╔══╝██╔═══██╗
  ██║  ███╗███████╗██║  ██║      ██║   ██║   ██║
  ██║   ██║╚════██║██║  ██║      ██║   ██║   ██║
  ╚██████╔╝███████║██████╔╝      ██║   ╚██████╔╝
   ╚═════╝ ╚══════╝╚═════╝       ╚═╝    ╚═════╝ 
   
   ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║   ██║██║  ██║█████╗  
  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║   ██║██║  ██║██╔══╝  
  ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗╚██████╔╝██████╔╝███████╗
   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝${colors.reset}
   
  ${colors.dim}GSD → OpenCode Transformer${colors.reset}
`);
}

function printHelp() {
  console.log(`
${colors.yellow}Usage:${colors.reset} node scripts/gsd-to-opencode.cjs [options]

${colors.yellow}Options:${colors.reset}
  ${colors.cyan}--source <path>${colors.reset}     Source get-shit-done repo (default: clones from GitHub)
  ${colors.cyan}--output <path>${colors.reset}     Output directory (default: ./gsd-opencode-output)
  ${colors.cyan}--version <tag>${colors.reset}     Git tag/version to use (default: latest)
  ${colors.cyan}--dry-run${colors.reset}           Show what would be transformed without writing
  ${colors.cyan}--verbose${colors.reset}           Show detailed transformation info
  ${colors.cyan}--help${colors.reset}              Show this help message

${colors.yellow}Examples:${colors.reset}
  ${colors.dim}# Transform latest get-shit-done to OpenCode${colors.reset}
  node scripts/gsd-to-opencode.cjs

  ${colors.dim}# Use specific version${colors.reset}
  node scripts/gsd-to-opencode.cjs --version v1.4.15

  ${colors.dim}# Transform existing local copy${colors.reset}
  node scripts/gsd-to-opencode.cjs --source ../get-shit-done

  ${colors.dim}# Preview changes without writing${colors.reset}
  node scripts/gsd-to-opencode.cjs --dry-run --verbose
`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  printBanner();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Create transformer with real dependencies
  const transformer = createGsdTransformer({
    fs,
    execSync,
    log: (msg) => logStep('INFO', msg),
    logSuccess,
    logWarning,
    logError,
  });

  // Run transformation
  const result = transformer.transform(options);

  if (!result.success) {
    logError(result.error);
    process.exit(1);
  }

  // Summary
  console.log('');
  console.log(`${colors.cyan}${'═'.repeat(50)}${colors.reset}`);
  console.log(`${colors.green}  TRANSFORMATION COMPLETE${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(50)}${colors.reset}`);
  console.log(`
  ${colors.dim}Files processed:${colors.reset}     ${result.stats.files}
  ${colors.dim}Files transformed:${colors.reset}   ${result.stats.transformed}
  ${colors.dim}Files skipped:${colors.reset}       ${result.stats.skipped}
  ${colors.dim}Directories:${colors.reset}         ${result.stats.directories}
  ${colors.dim}Source version:${colors.reset}      ${result.sourceVersion}
  `);

  if (!options.dryRun) {
    console.log(`${colors.green}Output written to: ${options.output}${colors.reset}`);
    console.log(`
${colors.yellow}Next steps:${colors.reset}
  1. Review the transformed files
  2. Update package.json with your details
  3. Test with: cd ${options.output} && npm pack
  4. Install with: npx ./gsd-opencode-*.tgz --local
`);
  }
}

main().catch(error => {
  logError(`Error: ${error.message}`);
  process.exit(1);
});
