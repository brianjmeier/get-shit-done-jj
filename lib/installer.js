/**
 * Installer library - testable business logic for GSD installation
 * 
 * Architecture:
 * - Pure functions for transformations
 * - Platform strategies (polymorphism instead of if statements)
 * - Dependency injection for I/O operations
 */

// ============================================================================
// PLATFORM STRATEGIES (Polymorphism replacing if statements)
// ============================================================================

/**
 * Base platform prototype with shared behavior
 */
const BasePlatform = {
  transformContent(content, pathPrefix) {
    return content.replace(this.pathPattern, pathPrefix);
  },
  
  getGlobalDir(homedir) {
    return this.globalDirPath(homedir);
  },
  
  getLocalDir() {
    return this.localDir;
  },
};

/**
 * Claude Code platform strategy
 */
const ClaudeCodePlatform = Object.create(BasePlatform);
Object.assign(ClaudeCodePlatform, {
  id: 'claude-code',
  name: 'Claude Code',
  localDir: '.claude',
  commandsDir: 'commands',
  commandPrefix: '/gsd:',
  configEnvVar: 'CLAUDE_CONFIG_DIR',
  pathPattern: /~\/\.claude\//g,
  supportsHooks: true,
  
  globalDirPath(homedir) {
    return `${homedir}/.claude`;
  },
  
  transformContent(content, pathPrefix) {
    return content.replace(/~\/\.claude\//g, pathPrefix);
  },
});

/**
 * Color name to hex mapping for OpenCode
 */
const COLOR_NAME_TO_HEX = {
  cyan: '#06B6D4',
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  blue: '#3B82F6',
  red: '#EF4444',
  purple: '#A855F7',
  pink: '#EC4899',
  gray: '#6B7280',
  white: '#FFFFFF',
  black: '#000000',
};

/**
 * Transform agent frontmatter for OpenCode format
 * Converts: tools: X, Y, Z → tools:\n  - X\n  - Y\n  - Z
 * Converts: color: cyan → color: "#06B6D4"
 */
function transformAgentFrontmatter(content) {
  // Check if this is an agent file with frontmatter
  if (!content.startsWith('---')) {
    return content;
  }

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return content;
  }

  let frontmatter = content.substring(0, endIndex + 3);
  const body = content.substring(endIndex + 3);

  // Transform tools: comma-separated string to YAML record/object
  frontmatter = frontmatter.replace(
    /^tools:\s*(.+)$/m,
    (match, toolsStr) => {
      // Skip if already in list/object format
      if (toolsStr.trim() === '' || toolsStr.includes('\n')) {
        return match;
      }
      const tools = toolsStr.split(',').map(t => t.trim()).filter(Boolean);
      return 'tools:\n' + tools.map(t => `  ${t}: true`).join('\n');
    }
  );

  // Transform color: name to color: "#hex"
  frontmatter = frontmatter.replace(
    /^color:\s*(\w+)$/m,
    (match, colorName) => {
      const hex = COLOR_NAME_TO_HEX[colorName.toLowerCase()];
      if (hex) {
        return `color: "${hex}"`;
      }
      return match;
    }
  );

  return frontmatter + body;
}

/**
 * OpenCode platform strategy
 */
const OpenCodePlatform = Object.create(BasePlatform);
Object.assign(OpenCodePlatform, {
  id: 'opencode',
  name: 'OpenCode',
  localDir: '.opencode',
  commandsDir: 'command',  // singular in OpenCode
  commandPrefix: '/gsd-',
  configEnvVar: 'OPENCODE_CONFIG_DIR',
  pathPattern: /~\/\.config\/opencode\//g,
  supportsHooks: false,

  globalDirPath(homedir) {
    return `${homedir}/.config/opencode`;
  },

  transformContent(content, pathPrefix) {
    let result = content.replace(/~\/\.claude\//g, pathPrefix);
    result = result.replace(/\.\/\.claude\//g, './.opencode/');
    result = result.replace(/\/gsd:/g, '/gsd-');
    // Transform agent frontmatter for OpenCode format
    result = transformAgentFrontmatter(result);
    return result;
  },
});

const PLATFORMS = {
  'claude-code': ClaudeCodePlatform,
  'opencode': OpenCodePlatform,
};

// ============================================================================
// ORPHAN CLEANUP (from upstream)
// ============================================================================

/**
 * List of orphaned files from previous GSD versions
 */
const ORPHANED_FILES = [
  'hooks/gsd-notify.sh',    // Removed in v1.6.x
  'hooks/statusline.js',    // Renamed to gsd-statusline.js in v1.9.0
];

/**
 * List of orphaned hook patterns from previous GSD versions
 */
const ORPHANED_HOOK_PATTERNS = [
  'gsd-notify.sh',          // Removed in v1.6.x
  'hooks/statusline.js',    // Renamed to gsd-statusline.js in v1.9.0
  'gsd-intel-index.js',     // Removed in v1.9.2
  'gsd-intel-session.js',   // Removed in v1.9.2
  'gsd-intel-prune.js',     // Removed in v1.9.2
];

/**
 * Clean up orphaned files from previous GSD versions
 * @param {string} targetDir - installation directory
 * @param {object} fs - filesystem interface
 * @param {function} log - logging function
 * @param {object} colors - color codes
 * @returns {string[]} list of removed files
 */
function cleanupOrphanedFiles(targetDir, fs, log, colors) {
  const removed = [];
  
  for (const relPath of ORPHANED_FILES) {
    const fullPath = `${targetDir}/${relPath}`;
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      log(`  ${colors.green}✓${colors.reset} Removed orphaned ${relPath}`);
      removed.push(relPath);
    }
  }
  
  return removed;
}

/**
 * Clean up orphaned hook registrations from settings.json
 * @param {object} settings - settings object
 * @param {function} log - logging function
 * @param {object} colors - color codes
 * @returns {object} cleaned settings
 */
function cleanupOrphanedHooks(settings, log, colors) {
  let cleaned = false;

  // Check all hook event types (Stop, SessionStart, etc.)
  if (settings.hooks) {
    for (const eventType of Object.keys(settings.hooks)) {
      const hookEntries = settings.hooks[eventType];
      if (Array.isArray(hookEntries)) {
        // Filter out entries that contain orphaned hooks
        const filtered = hookEntries.filter(entry => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            // Check if any hook in this entry matches orphaned patterns
            const hasOrphaned = entry.hooks.some(h =>
              h.command && ORPHANED_HOOK_PATTERNS.some(pattern => h.command.includes(pattern))
            );
            if (hasOrphaned) {
              cleaned = true;
              return false;  // Remove this entry
            }
          }
          return true;  // Keep this entry
        });
        settings.hooks[eventType] = filtered;
      }
    }
  }

  if (cleaned) {
    log(`  ${colors.green}✓${colors.reset} Removed orphaned hook registrations`);
  }

  return settings;
}

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Parse command line arguments
 * @param {string[]} argv - process.argv.slice(2)
 * @returns {object} parsed arguments
 */
function parseArgs(argv) {
  const hasFlag = (flags) => flags.some(f => argv.includes(f));
  
  const parsed = {
    help: hasFlag(['--help', '-h']),
    global: hasFlag(['--global', '-g']),
    local: hasFlag(['--local', '-l']),
    opencode: hasFlag(['--opencode', '-o']),
    claudeCode: hasFlag(['--claude-code', '--cc']),
    forceStatusline: hasFlag(['--force-statusline']),
    configDir: null,
  };
  
  // Parse --config-dir argument
  const configDirIndex = argv.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1) {
    const nextArg = argv[configDirIndex + 1];
    if (nextArg && !nextArg.startsWith('-')) {
      parsed.configDir = nextArg;
    }
  }
  
  const configDirArg = argv.find(arg => arg.startsWith('--config-dir=') || arg.startsWith('-c='));
  if (configDirArg) {
    parsed.configDir = configDirArg.split('=')[1];
  }
  
  return parsed;
}

/**
 * Validate parsed arguments
 * @param {object} args - parsed arguments
 * @returns {object} { valid: boolean, error?: string }
 */
function validateArgs(args) {
  if (args.opencode && args.claudeCode) {
    return { valid: false, error: 'Cannot specify both --opencode and --claude-code' };
  }
  if (args.global && args.local) {
    return { valid: false, error: 'Cannot specify both --global and --local' };
  }
  if (args.configDir && args.local) {
    return { valid: false, error: 'Cannot use --config-dir with --local' };
  }
  return { valid: true };
}

/**
 * Detect platform from environment and filesystem
 * @param {object} deps - dependencies for detection
 * @returns {string|null} 'opencode', 'claude-code', or null if unknown
 */
function detectPlatform(deps) {
  const { args, env, existsSync, homedir } = deps;
  
  // Explicit flags take precedence
  if (args.opencode) return 'opencode';
  if (args.claudeCode) return 'claude-code';
  
  // Environment variables
  if (env.OPENCODE_CONFIG_DIR) return 'opencode';
  if (env.CLAUDE_CONFIG_DIR) return 'claude-code';
  
  // Check filesystem for existing installations
  const ocGlobal = `${homedir}/.config/opencode`;
  const ccGlobal = `${homedir}/.claude`;
  
  const ocExists = existsSync(ocGlobal);
  const ccExists = existsSync(ccGlobal);
  
  if (ocExists && !ccExists) return 'opencode';
  if (ccExists && !ocExists) return 'claude-code';
  
  return null;
}

/**
 * Expand ~ to home directory
 * @param {string} filePath
 * @param {string} homedir
 * @returns {string}
 */
function expandTilde(filePath, homedir) {
  if (filePath && filePath.startsWith('~/')) {
    return `${homedir}${filePath.slice(1)}`;
  }
  return filePath;
}

/**
 * Build a hook command path using forward slashes for cross-platform compatibility.
 * On Windows, $HOME is not expanded by cmd.exe/PowerShell, so we use the actual path.
 * @param {string} targetDir - installation directory
 * @param {string} hookName - name of the hook file
 * @returns {string} command to run the hook
 */
function buildHookCommand(targetDir, hookName) {
  // Use forward slashes for Node.js compatibility on all platforms
  const hooksPath = targetDir.replace(/\\/g, '/') + '/hooks/' + hookName;
  return `node "${hooksPath}"`;
}

/**
 * Compute installation paths
 * @param {object} platform - platform strategy
 * @param {object} options - installation options
 * @returns {object} computed paths
 */
function computePaths(platform, options) {
  const { isGlobal, homedir, cwd, explicitConfigDir, env } = options;
  
  const envConfigDir = expandTilde(env[platform.configEnvVar], homedir);
  const customConfigDir = expandTilde(explicitConfigDir, homedir);
  const configDir = customConfigDir || envConfigDir;
  
  const globalDir = configDir || platform.getGlobalDir(homedir);
  const targetDir = isGlobal ? globalDir : `${cwd}/${platform.localDir}`;
  
  const pathPrefix = isGlobal
    ? (configDir ? `${targetDir}/` : (platform.id === 'opencode' ? '~/.config/opencode/' : '~/.claude/'))
    : (platform.id === 'opencode' ? './.opencode/' : './.claude/');
  
  return {
    targetDir,
    pathPrefix,
    commandsDir: `${targetDir}/${platform.commandsDir}`,
    configDir,
  };
}

/**
 * Create an installation plan (what files to copy/transform)
 * @param {object} platform - platform strategy
 * @param {object} paths - computed paths
 * @param {object} deps - dependencies (fs operations)
 * @returns {object[]} list of installation tasks
 */
function createInstallPlan(platform, paths, deps) {
  const { srcDir, existsSync } = deps;
  const tasks = [];
  
  // Determine source for gsd commands
  const adapterSrc = `${srcDir}/adapters/opencode/command/gsd`;
  const defaultSrc = `${srcDir}/commands/gsd`;
  const gsdSrc = (platform.id === 'opencode' && existsSync(adapterSrc)) 
    ? adapterSrc 
    : defaultSrc;
  
  tasks.push({
    type: 'copyDir',
    src: gsdSrc,
    dest: `${paths.commandsDir}/gsd`,
    transform: true,
    description: `${platform.commandsDir}/gsd`,
  });
  
  tasks.push({
    type: 'copyDir',
    src: `${srcDir}/get-shit-done`,
    dest: `${paths.targetDir}/get-shit-done`,
    transform: true,
    description: 'get-shit-done',
  });
  
  if (existsSync(`${srcDir}/agents`)) {
    tasks.push({
      type: 'copyAgents',
      src: `${srcDir}/agents`,
      dest: `${paths.targetDir}/agents`,
      transform: true,
      description: 'agents',
    });
  }
  
  if (existsSync(`${srcDir}/CHANGELOG.md`)) {
    tasks.push({
      type: 'copyFile',
      src: `${srcDir}/CHANGELOG.md`,
      dest: `${paths.targetDir}/get-shit-done/CHANGELOG.md`,
      transform: false,
      description: 'CHANGELOG.md',
    });
  }
  
  tasks.push({
    type: 'writeFile',
    dest: `${paths.targetDir}/get-shit-done/VERSION`,
    content: deps.version,
    description: `VERSION (${deps.version})`,
  });
  
  // Copy hooks from dist/ (bundled with dependencies)
  const hooksSrc = `${srcDir}/hooks/dist`;
  if (platform.supportsHooks && existsSync(hooksSrc)) {
    tasks.push({
      type: 'copyHooks',
      src: hooksSrc,
      dest: `${paths.targetDir}/hooks`,
      description: 'hooks (bundled)',
    });
  }
  
  return tasks;
}

/**
 * Read and parse settings.json
 * @param {string} settingsPath
 * @param {object} fs - filesystem interface
 * @returns {object}
 */
function readSettings(settingsPath, fs) {
  if (fs.existsSync(settingsPath)) {
    try {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Write settings.json with proper formatting
 * @param {string} settingsPath
 * @param {object} settings
 * @param {object} fs - filesystem interface
 */
function writeSettings(settingsPath, settings, fs) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

/**
 * Configure hooks in settings.json (SessionStart for update checking)
 * @param {object} settings - settings object
 * @param {string} targetDir - installation directory
 * @param {boolean} isGlobal - whether this is a global install
 * @param {function} log - logging function
 * @param {object} colors - color codes
 * @returns {object} updated settings
 */
function configureHooks(settings, targetDir, isGlobal, log, colors) {
  const updateCheckCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-check-update.js')
    : 'node .claude/hooks/gsd-check-update.js';

  // Configure SessionStart hook for update checking
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.SessionStart) {
    settings.hooks.SessionStart = [];
  }

  // Check if GSD update hook already exists
  const hasGsdUpdateHook = settings.hooks.SessionStart.some(entry =>
    entry.hooks && entry.hooks.some(h => h.command && h.command.includes('gsd-check-update'))
  );

  if (!hasGsdUpdateHook) {
    settings.hooks.SessionStart.push({
      hooks: [
        {
          type: 'command',
          command: updateCheckCommand
        }
      ]
    });
    log(`  ${colors.green}✓${colors.reset} Configured update check hook`);
  }

  return settings;
}

/**
 * Configure statusline in settings.json
 * @param {object} settings - settings object
 * @param {string} targetDir - installation directory
 * @param {boolean} isGlobal - whether this is a global install
 * @param {function} log - logging function
 * @param {object} colors - color codes
 * @returns {object} updated settings
 */
function configureStatusline(settings, targetDir, isGlobal, log, colors) {
  const statuslineCommand = isGlobal
    ? buildHookCommand(targetDir, 'gsd-statusline.js')
    : 'node .claude/hooks/gsd-statusline.js';

  settings.statusLine = {
    type: 'command',
    command: statuslineCommand
  };
  
  log(`  ${colors.green}✓${colors.reset} Configured statusline`);
  return settings;
}

// ============================================================================
// INSTALLER FACTORY
// ============================================================================

/**
 * Create an installer instance with injected dependencies
 * @param {object} deps - dependencies (fs, os, process, readline, etc.)
 * @returns {object} installer interface
 */
function createInstaller(deps) {
  const { fs, os, process: proc, readline, pkg } = deps;
  
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
  };
  
  const log = deps.log || ((msg) => console.log(msg));
  const logError = deps.logError || ((msg) => console.error(msg));
  
  /**
   * Transform and copy a directory recursively
   */
  function copyWithTransform(srcDir, destDir, platform, pathPrefix) {
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true });
    }
    fs.mkdirSync(destDir, { recursive: true });
    
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = `${srcDir}/${entry.name}`;
      const destPath = `${destDir}/${entry.name}`;
      
      if (entry.isDirectory()) {
        copyWithTransform(srcPath, destPath, platform, pathPrefix);
      } else if (entry.name.endsWith('.md')) {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = platform.transformContent(content, pathPrefix);
        fs.writeFileSync(destPath, content);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  /**
   * Verify a directory exists and contains files
   */
  function verifyInstalled(dirPath, description) {
    if (!fs.existsSync(dirPath)) {
      logError(`  ${colors.yellow}✗${colors.reset} Failed to install ${description}: directory not created`);
      return false;
    }
    try {
      const entries = fs.readdirSync(dirPath);
      if (entries.length === 0) {
        logError(`  ${colors.yellow}✗${colors.reset} Failed to install ${description}: directory is empty`);
        return false;
      }
    } catch (e) {
      logError(`  ${colors.yellow}✗${colors.reset} Failed to install ${description}: ${e.message}`);
      return false;
    }
    return true;
  }

  /**
   * Verify a file exists
   */
  function verifyFileInstalled(filePath, description) {
    if (!fs.existsSync(filePath)) {
      logError(`  ${colors.yellow}✗${colors.reset} Failed to install ${description}: file not created`);
      return false;
    }
    return true;
  }
  
  /**
   * Execute the installation plan
   */
  function executePlan(plan, platform, pathPrefix) {
    const failures = [];
    
    for (const task of plan) {
      try {
        switch (task.type) {
          case 'copyDir':
            fs.mkdirSync(task.dest.substring(0, task.dest.lastIndexOf('/')), { recursive: true });
            if (task.transform) {
              copyWithTransform(task.src, task.dest, platform, pathPrefix);
            } else {
              copyWithTransform(task.src, task.dest, { transformContent: c => c }, pathPrefix);
            }
            if (verifyInstalled(task.dest, task.description)) {
              log(`  ${colors.green}✓${colors.reset} Installed ${task.description}`);
            } else {
              failures.push(task.description);
            }
            break;
            
          case 'copyAgents':
            fs.mkdirSync(task.dest, { recursive: true });
            // Remove old GSD agents
            if (fs.existsSync(task.dest)) {
              for (const file of fs.readdirSync(task.dest)) {
                if (file.startsWith('gsd-') && file.endsWith('.md')) {
                  fs.unlinkSync(`${task.dest}/${file}`);
                }
              }
            }
            const entries = fs.readdirSync(task.src, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isFile() && entry.name.endsWith('.md')) {
                let content = fs.readFileSync(`${task.src}/${entry.name}`, 'utf8');
                content = platform.transformContent(content, pathPrefix);
                fs.writeFileSync(`${task.dest}/${entry.name}`, content);
              }
            }
            if (verifyInstalled(task.dest, task.description)) {
              log(`  ${colors.green}✓${colors.reset} Installed ${task.description}`);
            } else {
              failures.push(task.description);
            }
            break;
            
          case 'copyFile':
            fs.mkdirSync(task.dest.substring(0, task.dest.lastIndexOf('/')), { recursive: true });
            fs.copyFileSync(task.src, task.dest);
            if (verifyFileInstalled(task.dest, task.description)) {
              log(`  ${colors.green}✓${colors.reset} Installed ${task.description}`);
            } else {
              failures.push(task.description);
            }
            break;
            
          case 'writeFile':
            fs.mkdirSync(task.dest.substring(0, task.dest.lastIndexOf('/')), { recursive: true });
            fs.writeFileSync(task.dest, task.content);
            if (verifyFileInstalled(task.dest, task.description)) {
              log(`  ${colors.green}✓${colors.reset} Wrote ${task.description}`);
            } else {
              failures.push(task.description);
            }
            break;
            
          case 'copyHooks':
            fs.mkdirSync(task.dest, { recursive: true });
            const hookEntries = fs.readdirSync(task.src);
            for (const entry of hookEntries) {
              const srcFile = `${task.src}/${entry}`;
              // Only copy files, not directories
              if (fs.statSync(srcFile).isFile()) {
                const destFile = `${task.dest}/${entry}`;
                fs.copyFileSync(srcFile, destFile);
              }
            }
            if (verifyInstalled(task.dest, task.description)) {
              log(`  ${colors.green}✓${colors.reset} Installed ${task.description}`);
            } else {
              failures.push(task.description);
            }
            break;
        }
      } catch (err) {
        failures.push(task.description);
        logError(`  ${colors.yellow}✗${colors.reset} Failed to install ${task.description}: ${err.message}`);
      }
    }
    
    return failures;
  }
  
  /**
   * Run the installation
   */
  function install(platformId, isGlobal, options = {}) {
    const platform = PLATFORMS[platformId];
    const srcDir = options.srcDir || `${__dirname}/..`;
    const homedir = os.homedir();
    const cwd = proc.cwd();
    
    const paths = computePaths(platform, {
      isGlobal,
      homedir,
      cwd,
      explicitConfigDir: options.configDir,
      env: proc.env,
    });
    
    const locationLabel = isGlobal
      ? paths.targetDir.replace(homedir, '~')
      : paths.targetDir.replace(cwd, '.');
    
    log(`  Platform: ${colors.cyan}${platform.name}${colors.reset}`);
    log(`  Installing to ${colors.cyan}${locationLabel}${colors.reset}\n`);
    
    // Clean up orphaned files from previous versions
    cleanupOrphanedFiles(paths.targetDir, fs, log, colors);
    
    // Create commands directory
    fs.mkdirSync(paths.commandsDir, { recursive: true });
    
    const plan = createInstallPlan(platform, paths, {
      srcDir,
      existsSync: fs.existsSync,
      version: pkg.version,
    });
    
    const failures = executePlan(plan, platform, paths.pathPrefix);
    
    if (failures.length > 0) {
      logError(`\n  ${colors.yellow}Installation incomplete!${colors.reset} Failed: ${failures.join(', ')}`);
      logError(`  Try running directly: node bin/install.js --global\n`);
      return { success: false, failures };
    }
    
    // Handle settings for Claude Code
    const settingsPath = `${paths.targetDir}/settings.json`;
    let settings = readSettings(settingsPath, fs);
    
    if (platform.id === 'claude-code') {
      // Clean up orphaned hooks
      settings = cleanupOrphanedHooks(settings, log, colors);
      
      // Configure hooks (update check)
      settings = configureHooks(settings, paths.targetDir, isGlobal, log, colors);
      
      // Configure statusline (if no existing or force flag)
      const hasExisting = settings.statusLine != null;
      if (!hasExisting || options.forceStatusline) {
        settings = configureStatusline(settings, paths.targetDir, isGlobal, log, colors);
      } else {
        log(`  ${colors.yellow}⚠${colors.reset} Skipping statusline (already configured)`);
        log(`    Use ${colors.cyan}--force-statusline${colors.reset} to replace\n`);
      }
      
      writeSettings(settingsPath, settings, fs);
    }
    
    const helpCmd = platform.commandPrefix + 'help';
    log(`\n  ${colors.green}Done!${colors.reset} Launch ${platform.name} and run ${colors.cyan}${helpCmd}${colors.reset}.\n`);
    
    return { success: true, platform, paths, settings };
  }
  
  /**
   * Prompt user for platform selection
   */
  function promptPlatform(callback) {
    if (!proc.stdin.isTTY) {
      log(`  ${colors.yellow}Non-interactive, defaulting to Claude Code${colors.reset}\n`);
      callback('claude-code');
      return;
    }
    
    const rl = readline.createInterface({
      input: proc.stdin,
      output: proc.stdout,
    });
    
    log(`  ${colors.yellow}Which platform are you using?${colors.reset}

  ${colors.cyan}1${colors.reset}) Claude Code ${colors.dim}(~/.claude)${colors.reset}
  ${colors.cyan}2${colors.reset}) OpenCode    ${colors.dim}(~/.config/opencode)${colors.reset}
`);
    
    rl.question(`  Choice ${colors.dim}[1]${colors.reset}: `, (answer) => {
      rl.close();
      const choice = answer.trim() || '1';
      callback(choice === '2' ? 'opencode' : 'claude-code');
    });
  }
  
  /**
   * Prompt user for install location
   */
  function promptLocation(platformId, configDir, callback) {
    if (!proc.stdin.isTTY) {
      log(`  ${colors.yellow}Non-interactive, defaulting to global install${colors.reset}\n`);
      callback(true);
      return;
    }
    
    const platform = PLATFORMS[platformId];
    const homedir = os.homedir();
    const envConfigDir = expandTilde(proc.env[platform.configEnvVar], homedir);
    const customConfigDir = expandTilde(configDir, homedir);
    const globalPath = customConfigDir || envConfigDir || platform.getGlobalDir(homedir);
    const globalLabel = globalPath.replace(homedir, '~');
    
    const rl = readline.createInterface({
      input: proc.stdin,
      output: proc.stdout,
    });
    
    log(`  ${colors.yellow}Where would you like to install?${colors.reset}

  ${colors.cyan}1${colors.reset}) Global ${colors.dim}(${globalLabel})${colors.reset} - available in all projects
  ${colors.cyan}2${colors.reset}) Local  ${colors.dim}(${platform.localDir})${colors.reset} - this project only
`);
    
    rl.question(`  Choice ${colors.dim}[1]${colors.reset}: `, (answer) => {
      rl.close();
      const choice = answer.trim() || '1';
      callback(choice !== '2');
    });
  }
  
  return {
    install,
    promptPlatform,
    promptLocation,
    detectPlatform: (args) => detectPlatform({
      args,
      env: proc.env,
      existsSync: fs.existsSync,
      homedir: os.homedir(),
    }),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Pure functions (easy to test)
  parseArgs,
  validateArgs,
  detectPlatform,
  expandTilde,
  buildHookCommand,
  computePaths,
  createInstallPlan,
  readSettings,
  writeSettings,
  cleanupOrphanedFiles,
  cleanupOrphanedHooks,
  configureHooks,
  configureStatusline,
  transformAgentFrontmatter,

  // Constants
  ORPHANED_FILES,
  ORPHANED_HOOK_PATTERNS,
  COLOR_NAME_TO_HEX,

  // Platform strategies
  PLATFORMS,
  ClaudeCodePlatform,
  OpenCodePlatform,

  // Factory
  createInstaller,
};
