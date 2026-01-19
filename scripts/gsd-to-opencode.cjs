#!/usr/bin/env node

/**
 * gsd-to-opencode.js
 * 
 * Transforms the original get-shit-done (Claude Code) repository into
 * an OpenCode-compatible version.
 * 
 * Usage:
 *   node scripts/gsd-to-opencode.js [options]
 * 
 * Options:
 *   --source <path>     Source get-shit-done repo (default: clones from GitHub)
 *   --output <path>     Output directory (default: ./gsd-opencode-output)
 *   --version <version> Version tag to use (default: latest)
 *   --dry-run           Show what would be transformed without writing
 *   --help              Show this help message
 * 
 * This script:
 *   1. Clones/copies the original get-shit-done repo
 *   2. Applies text transformations for OpenCode compatibility
 *   3. Restructures directories to match OpenCode conventions
 *   4. Updates package.json and metadata
 *   5. Outputs a ready-to-use OpenCode package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION - Transformation Rules
// ============================================================================

const TRANSFORMATIONS = {
  // Path replacements
  paths: [
    { from: /~\/\.claude\//g, to: '~/.config/opencode/' },
    { from: /\.\/\.claude\//g, to: './.opencode/' },
    { from: /\.claude\//g, to: '.opencode/' },
    { from: /\/\.claude\//g, to: '/.opencode/' },
  ],

  // Tool/Platform naming
  naming: [
    { from: /Claude Code/g, to: 'OpenCode' },
    { from: /Claude/g, to: 'OpenCode' },  // Must come after "Claude Code"
  ],

  // Command format: /gsd:name → /gsd-name (OpenCode uses kebab-case)
  commands: [
    { from: /\/gsd:/g, to: '/gsd-' },
  ],

  // Subagent type changes
  subagents: [
    { from: /subagent_type="gsd-executor"/g, to: 'subagent_type="general"' },
    { from: /subagent_type: "gsd-executor"/g, to: 'subagent_type: "general"' },
    { from: /subagent_type='gsd-executor'/g, to: "subagent_type='general'" },
  ],

  // OpenCode-specific tool names
  tools: [
    { from: /AskUserQuestion/g, to: 'question' },
    { from: /Explore\s+agents/g, to: 'explore agents' },
    { from: /Explore agents/g, to: 'explore agents' },
  ],

  // Session management differences
  session: [
    { from: /\/clear/g, to: '/new' },
    { from: /Survives `\/clear`/g, to: 'Survives `/new`' },
  ],

  // Package/install references
  packageRefs: [
    { from: /npx get-shit-done-cc/g, to: 'npx gsd-opencode' },
    { from: /get-shit-done-cc/g, to: 'gsd-opencode' },
  ],

  // YAML frontmatter command names (name: gsd:foo → name: gsd-foo)
  yamlFrontmatter: [
    { from: /^name: gsd:(.+)$/gm, to: 'name: gsd-$1' },
  ],
};

// Files/directories to skip during transformation
const SKIP_PATTERNS = [
  /node_modules/,
  /^\.git$/,
  /^\.git\//,
  /\.jj\//,
  /\.DS_Store/,
  /\.planning\//,
  /package-lock\.json/,
  /^hooks\//,      // OpenCode doesn't use hooks
  /^hooks$/,
];

// Directory structure mapping (Claude Code → OpenCode)
const DIRECTORY_MAPPING = {
  'commands/gsd': 'command/gsd',  // OpenCode uses singular "command"
  // 'hooks' is not used in OpenCode - skip it
};

// Files to skip entirely (not relevant for OpenCode)
const SKIP_FILES = [
  'hooks/gsd-check-update.js',
  'hooks/statusline.js',
  'AGENTS.md',  // Codex-specific
];

// ============================================================================
// COLORS for terminal output
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
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
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Apply all text transformations to content
 */
function transformContent(content, filePath) {
  let transformed = content;
  let changeCount = 0;

  // Apply all transformation categories
  for (const category of Object.values(TRANSFORMATIONS)) {
    for (const rule of category) {
      const before = transformed;
      transformed = transformed.replace(rule.from, rule.to);
      if (before !== transformed) {
        changeCount++;
      }
    }
  }

  return { content: transformed, changes: changeCount };
}

/**
 * Transform a file path according to directory mapping
 */
function transformPath(relativePath) {
  let transformed = relativePath;

  for (const [from, to] of Object.entries(DIRECTORY_MAPPING)) {
    if (relativePath.startsWith(from)) {
      transformed = relativePath.replace(from, to);
      break;
    }
  }

  return transformed;
}

/**
 * Check if a path should be skipped
 */
function shouldSkip(relativePath) {
  // Check skip patterns
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(relativePath)) {
      return true;
    }
  }

  // Check skip files
  for (const skipFile of SKIP_FILES) {
    if (relativePath === skipFile || relativePath.endsWith('/' + skipFile)) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively process a directory
 */
function processDirectory(srcDir, destDir, options = {}) {
  const stats = {
    files: 0,
    transformed: 0,
    skipped: 0,
    directories: 0,
  };

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const relativePath = path.relative(options.baseDir || srcDir, srcPath);

    if (shouldSkip(relativePath)) {
      stats.skipped++;
      if (options.verbose) {
        logWarning(`Skipped: ${relativePath}`);
      }
      continue;
    }

    // Transform the destination path
    const transformedRelPath = transformPath(relativePath);
    const destPath = path.join(destDir, transformedRelPath);

    if (entry.isDirectory()) {
      if (!options.dryRun) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      stats.directories++;

      // Recurse into directory
      const subStats = processDirectory(srcPath, destDir, {
        ...options,
        baseDir: options.baseDir || srcDir,
      });

      stats.files += subStats.files;
      stats.transformed += subStats.transformed;
      stats.skipped += subStats.skipped;
      stats.directories += subStats.directories;
    } else if (entry.isFile()) {
      stats.files++;

      // Only transform markdown files
      if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(srcPath, 'utf8');
        const { content: transformed, changes } = transformContent(content, srcPath);

        if (changes > 0) {
          stats.transformed++;
        }

        if (!options.dryRun) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, transformed);
        }

        if (options.verbose && changes > 0) {
          logSuccess(`Transformed: ${relativePath} (${changes} changes)`);
        }
      } else if (entry.name === 'package.json') {
        // Special handling for package.json
        const pkg = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
        const transformedPkg = transformPackageJson(pkg);

        if (!options.dryRun) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, JSON.stringify(transformedPkg, null, 2) + '\n');
        }

        stats.transformed++;
        if (options.verbose) {
          logSuccess(`Transformed: package.json`);
        }
      } else if (entry.name.endsWith('.js')) {
        // Transform JS files (install.js, etc.)
        const content = fs.readFileSync(srcPath, 'utf8');
        const transformed = transformJsFile(content);

        if (!options.dryRun) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, transformed);
          // Preserve executable permission
          fs.chmodSync(destPath, 0o755);
        }

        if (content !== transformed) {
          stats.transformed++;
        }
      } else {
        // Copy other files as-is
        if (!options.dryRun) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  return stats;
}

/**
 * Transform package.json for OpenCode
 */
function transformPackageJson(pkg) {
  return {
    name: 'gsd-opencode',
    version: pkg.version || '1.0.0',
    description: 'A meta-prompting, context engineering and spec-driven development system for OpenCode by TÂCHES.',
    keywords: [
      'opencode',
      'ai',
      'meta-prompting',
      'context-engineering',
      'spec-driven-development',
    ],
    homepage: 'https://github.com/YOUR_USERNAME/gsd-opencode#readme',
    bugs: {
      url: 'https://github.com/YOUR_USERNAME/gsd-opencode/issues',
    },
    repository: {
      type: 'git',
      url: 'git+https://github.com/YOUR_USERNAME/gsd-opencode.git',
    },
    license: 'MIT',
    author: 'TÂCHES & YOUR_NAME',
    type: 'commonjs',
    main: 'index.js',
    bin: {
      'gsd-opencode': 'bin/install.js',
    },
    files: [
      'bin',
      'command',
      'get-shit-done',
    ],
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    engines: {
      node: '>=16.7.0',
    },
  };
}

/**
 * Transform JavaScript files (mainly install.js)
 */
function transformJsFile(content) {
  let transformed = content;

  // Replace Claude paths with OpenCode paths
  transformed = transformed.replace(/~\/\.claude\//g, '~/.config/opencode/');
  transformed = transformed.replace(/\.claude\//g, '.opencode/');
  transformed = transformed.replace(/\/\.claude\//g, '/.opencode/');

  // Replace Claude naming
  transformed = transformed.replace(/Claude Code/g, 'OpenCode');
  transformed = transformed.replace(/Claude/g, 'OpenCode');

  // Replace package references
  transformed = transformed.replace(/get-shit-done-cc/g, 'gsd-opencode');

  // Replace directory names (commands → command for OpenCode)
  transformed = transformed.replace(/'commands'/g, "'command'");
  transformed = transformed.replace(/"commands"/g, '"command"');

  // Replace command format references
  transformed = transformed.replace(/\/gsd:/g, '/gsd-');

  return transformed;
}

/**
 * Clone the original get-shit-done repo
 */
function cloneSourceRepo(targetDir, version = 'latest') {
  const repoUrl = 'https://github.com/glittercowboy/get-shit-done.git';

  logStep('CLONE', `Cloning get-shit-done from ${repoUrl}`);

  if (fs.existsSync(targetDir)) {
    logWarning(`Removing existing directory: ${targetDir}`);
    fs.rmSync(targetDir, { recursive: true });
  }

  const cloneCmd = version === 'latest'
    ? `git clone --depth 1 ${repoUrl} ${targetDir}`
    : `git clone --depth 1 --branch ${version} ${repoUrl} ${targetDir}`;

  try {
    execSync(cloneCmd, { stdio: 'pipe' });
    logSuccess(`Cloned to ${targetDir}`);
    return true;
  } catch (error) {
    logError(`Failed to clone: ${error.message}`);
    return false;
  }
}

/**
 * Get version from source repo
 */
function getSourceVersion(srcDir) {
  try {
    const pkgPath = path.join(srcDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.version;
    }
  } catch (e) {
    // ignore
  }
  return 'unknown';
}

/**
 * Create the install.js for OpenCode
 */
function createInstallScript(destDir) {
  const installScript = `#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

// Colors
const cyan = "\\x1b[36m";
const green = "\\x1b[32m";
const yellow = "\\x1b[33m";
const dim = "\\x1b[2m";
const reset = "\\x1b[0m";

// Get version from package.json
const pkg = require("../package.json");

const banner = \`
\${cyan}   ██████╗ ███████╗██████╗
  ██╔════╝ ██╔════╝██╔══██╗
  ██║  ███╗█████╗  ██║  ██║
  ██║   ██║╚════██║██║  ██║
  ╚██████╔╝███████║██████╔╝
   ╚═════╝ ╚══════╝╚═════╝\${reset}

  Get Shit Done \${dim}v\${pkg.version}\${reset}
  A meta-prompting, context engineering and spec-driven
  development system for OpenCode by TÂCHES
\`;

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes("--global") || args.includes("-g");
const hasLocal = args.includes("--local") || args.includes("-l");
const hasHelp = args.includes("--help") || args.includes("-h");

console.log(banner);

if (hasHelp) {
  console.log(\`  \${yellow}Usage:\${reset} npx gsd-opencode [options]

  \${yellow}Options:\${reset}
    \${cyan}-g, --global\${reset}              Install globally (to ~/.config/opencode/)
    \${cyan}-l, --local\${reset}               Install locally (to .opencode in current directory)
    \${cyan}-h, --help\${reset}                Show this help message
  \`);
  process.exit(0);
}

/**
 * Expand ~ to home directory
 */
function expandTilde(filePath) {
  if (filePath && filePath.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * Recursively copy directory, replacing paths in .md files
 */
function copyWithPathReplacement(srcDir, destDir, pathPrefix) {
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyWithPathReplacement(srcPath, destPath, pathPrefix);
    } else if (entry.name.endsWith(".md")) {
      let content = fs.readFileSync(srcPath, "utf8");
      content = content.replace(/~\\/\\.config\\/opencode\\//g, pathPrefix);
      content = content.replace(/\\.\\/\\.opencode\\//g, "./.opencode/");
      fs.writeFileSync(destPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install to the specified directory
 */
function install(isGlobal) {
  const src = path.join(__dirname, "..");
  const configDir = expandTilde(process.env.OPENCODE_CONFIG_DIR);
  const defaultGlobalDir = configDir || path.join(os.homedir(), ".config", "opencode");
  const opencodeDir = isGlobal
    ? defaultGlobalDir
    : path.join(process.cwd(), ".opencode");

  const locationLabel = isGlobal
    ? opencodeDir.replace(os.homedir(), "~")
    : opencodeDir.replace(process.cwd(), ".");

  const pathPrefix = isGlobal
    ? configDir ? \`\${opencodeDir}/\` : "~/.config/opencode/"
    : "./.opencode/";

  console.log(\`  Installing to \${cyan}\${locationLabel}\${reset}\\n\`);

  // Create commands directory
  const commandsDir = path.join(opencodeDir, "command");
  fs.mkdirSync(commandsDir, { recursive: true });

  // Copy commands/gsd with path replacement
  const gsdSrc = path.join(src, "command", "gsd");
  const gsdDest = path.join(commandsDir, "gsd");
  copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix);
  console.log(\`  \${green}✓\${reset} Installed command/gsd\`);

  // Copy get-shit-done skill with path replacement
  const skillSrc = path.join(src, "get-shit-done");
  const skillDest = path.join(opencodeDir, "get-shit-done");
  copyWithPathReplacement(skillSrc, skillDest, pathPrefix);
  console.log(\`  \${green}✓\${reset} Installed get-shit-done\`);

  console.log(\`
  \${green}Done!\${reset} Run \${cyan}/gsd-help\${reset} to get started.
  \`);
}

/**
 * Prompt for install location
 */
function promptLocation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const configDir = expandTilde(process.env.OPENCODE_CONFIG_DIR);
  const globalPath = configDir || path.join(os.homedir(), ".config", "opencode");
  const globalLabel = globalPath.replace(os.homedir(), "~");

  console.log(\`  \${yellow}Where would you like to install?\${reset}

  \${cyan}1\${reset}) Global \${dim}(\${globalLabel})\${reset} - available in all projects
  \${cyan}2\${reset}) Local  \${dim}(./.opencode)\${reset} - this project only
  \`);

  rl.question(\`  Choice \${dim}[1]\${reset}: \`, (answer) => {
    rl.close();
    const choice = answer.trim() || "1";
    const isGlobal = choice !== "2";
    install(isGlobal);
  });
}

// Main
if (hasGlobal && hasLocal) {
  console.error(\`  \${yellow}Cannot specify both --global and --local\${reset}\`);
  process.exit(1);
} else if (hasGlobal) {
  install(true);
} else if (hasLocal) {
  install(false);
} else {
  promptLocation();
}
`;

  const binDir = path.join(destDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(path.join(binDir, 'install.js'), installScript);
  fs.chmodSync(path.join(binDir, 'install.js'), 0o755);

  logSuccess('Created bin/install.js');
}

/**
 * Clean up empty directories recursively
 */
function cleanupEmptyDirs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = path.join(dir, entry.name);
      cleanupEmptyDirs(subPath);
      
      // Check if directory is now empty
      const remaining = fs.readdirSync(subPath);
      if (remaining.length === 0) {
        fs.rmdirSync(subPath);
      }
    }
  }
}

// ============================================================================
// MAIN
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
${colors.yellow}Usage:${colors.reset} node scripts/gsd-to-opencode.js [options]

${colors.yellow}Options:${colors.reset}
  ${colors.cyan}--source <path>${colors.reset}     Source get-shit-done repo (default: clones from GitHub)
  ${colors.cyan}--output <path>${colors.reset}     Output directory (default: ./gsd-opencode-output)
  ${colors.cyan}--version <tag>${colors.reset}     Git tag/version to use (default: latest)
  ${colors.cyan}--dry-run${colors.reset}           Show what would be transformed without writing
  ${colors.cyan}--verbose${colors.reset}           Show detailed transformation info
  ${colors.cyan}--help${colors.reset}              Show this help message

${colors.yellow}Examples:${colors.reset}
  ${colors.dim}# Transform latest get-shit-done to OpenCode${colors.reset}
  node scripts/gsd-to-opencode.js

  ${colors.dim}# Use specific version${colors.reset}
  node scripts/gsd-to-opencode.js --version v1.4.15

  ${colors.dim}# Transform existing local copy${colors.reset}
  node scripts/gsd-to-opencode.js --source ../get-shit-done

  ${colors.dim}# Preview changes without writing${colors.reset}
  node scripts/gsd-to-opencode.js --dry-run --verbose
`);
}

function parseArgs(args) {
  const options = {
    source: null,
    output: './gsd-opencode-output',
    version: 'latest',
    dryRun: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--source' || arg === '-s') {
      options.source = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--version' || arg === '-v') {
      options.version = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  printBanner();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Determine source directory
  let srcDir = options.source;
  let cleanupSource = false;

  if (!srcDir) {
    // Clone from GitHub
    srcDir = '/tmp/gsd-source-' + Date.now();
    cleanupSource = true;

    if (!cloneSourceRepo(srcDir, options.version)) {
      process.exit(1);
    }
  }

  // Validate source directory
  if (!fs.existsSync(srcDir)) {
    logError(`Source directory not found: ${srcDir}`);
    process.exit(1);
  }

  const sourceVersion = getSourceVersion(srcDir);
  logStep('INFO', `Source version: ${sourceVersion}`);
  logStep('INFO', `Output directory: ${options.output}`);

  if (options.dryRun) {
    logWarning('DRY RUN - no files will be written');
  }

  // Create output directory
  if (!options.dryRun) {
    if (fs.existsSync(options.output)) {
      logWarning(`Removing existing output directory: ${options.output}`);
      fs.rmSync(options.output, { recursive: true });
    }
    fs.mkdirSync(options.output, { recursive: true });
  }

  // Process the transformation
  logStep('TRANSFORM', 'Processing files...');
  const stats = processDirectory(srcDir, options.output, {
    baseDir: srcDir,
    dryRun: options.dryRun,
    verbose: options.verbose,
  });

  // Create custom install.js
  if (!options.dryRun) {
    createInstallScript(options.output);
    
    // Clean up empty directories
    cleanupEmptyDirs(options.output);
  }

  // Summary
  console.log('');
  log('═'.repeat(50), 'cyan');
  log('  TRANSFORMATION COMPLETE', 'green');
  log('═'.repeat(50), 'cyan');
  console.log(`
  ${colors.dim}Files processed:${colors.reset}     ${stats.files}
  ${colors.dim}Files transformed:${colors.reset}   ${stats.transformed}
  ${colors.dim}Files skipped:${colors.reset}       ${stats.skipped}
  ${colors.dim}Directories:${colors.reset}         ${stats.directories}
  ${colors.dim}Source version:${colors.reset}      ${sourceVersion}
  `);

  if (!options.dryRun) {
    log(`Output written to: ${options.output}`, 'green');
    console.log(`
${colors.yellow}Next steps:${colors.reset}
  1. Review the transformed files
  2. Update package.json with your details
  3. Test with: cd ${options.output} && npm pack
  4. Install with: npx ./gsd-opencode-*.tgz --local
`);
  }

  // Cleanup temp source if we cloned it
  if (cleanupSource && fs.existsSync(srcDir)) {
    fs.rmSync(srcDir, { recursive: true });
  }
}

main().catch(error => {
  logError(`Error: ${error.message}`);
  process.exit(1);
});
