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
    return result;
  },
});

const PLATFORMS = {
  'claude-code': ClaudeCodePlatform,
  'opencode': OpenCodePlatform,
};

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
  
  if (platform.supportsHooks && existsSync(`${srcDir}/hooks`)) {
    tasks.push({
      type: 'copyDir',
      src: `${srcDir}/hooks`,
      dest: `${paths.targetDir}/hooks`,
      transform: false,
      description: 'hooks',
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
            break;
            
          case 'copyFile':
            fs.mkdirSync(task.dest.substring(0, task.dest.lastIndexOf('/')), { recursive: true });
            fs.copyFileSync(task.src, task.dest);
            break;
            
          case 'writeFile':
            fs.mkdirSync(task.dest.substring(0, task.dest.lastIndexOf('/')), { recursive: true });
            fs.writeFileSync(task.dest, task.content);
            break;
        }
        
        // Verify
        const exists = task.type === 'writeFile' || task.type === 'copyFile'
          ? fs.existsSync(task.dest)
          : fs.existsSync(task.dest) && fs.readdirSync(task.dest).length > 0;
        
        if (exists) {
          log(`  ${colors.green}✓${colors.reset} Installed ${task.description}`);
        } else {
          failures.push(task.description);
          logError(`  ${colors.yellow}✗${colors.reset} Failed to install ${task.description}`);
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
      return { success: false, failures };
    }
    
    // Handle settings for Claude Code
    const settingsPath = `${paths.targetDir}/settings.json`;
    const settings = readSettings(settingsPath, fs);
    
    if (platform.id === 'claude-code') {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
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
  computePaths,
  createInstallPlan,
  readSettings,
  
  // Platform strategies
  PLATFORMS,
  ClaudeCodePlatform,
  OpenCodePlatform,
  
  // Factory
  createInstaller,
};
