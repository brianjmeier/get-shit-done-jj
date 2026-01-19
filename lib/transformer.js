/**
 * Transformer library - converts Claude Code content to OpenCode format
 * 
 * Architecture:
 * - Transformer prototypes (polymorphism for different transformation categories)
 * - Pipeline pattern for composing transformers
 * - Pure functions for transformations
 * - Dependency injection for I/O operations
 */

// ============================================================================
// TRANSFORMATION RULES
// ============================================================================

const TRANSFORMATION_RULES = {
  paths: [
    { from: /~\/\.claude\//g, to: '~/.config/opencode/' },
    { from: /\.\/\.claude\//g, to: './.opencode/' },
    { from: /\.claude\//g, to: '.opencode/' },
    { from: /\/\.claude\//g, to: '/.opencode/' },
  ],
  naming: [
    { from: /Claude Code/g, to: 'OpenCode' },
    { from: /Claude/g, to: 'OpenCode' },
  ],
  commands: [
    { from: /\/gsd:/g, to: '/gsd-' },
  ],
  subagents: [
    { from: /subagent_type="gsd-executor"/g, to: 'subagent_type="general"' },
    { from: /subagent_type: "gsd-executor"/g, to: 'subagent_type: "general"' },
    { from: /subagent_type='gsd-executor'/g, to: "subagent_type='general'" },
  ],
  tools: [
    { from: /AskUserQuestion/g, to: 'question' },
    { from: /Explore\s+agents/g, to: 'explore agents' },
    { from: /Explore agents/g, to: 'explore agents' },
  ],
  session: [
    { from: /\/clear/g, to: '/new' },
    { from: /Survives `\/clear`/g, to: 'Survives `/new`' },
  ],
  packageRefs: [
    { from: /npx get-shit-done-cc/g, to: 'npx gsd-opencode' },
    { from: /get-shit-done-cc/g, to: 'gsd-opencode' },
  ],
  yamlFrontmatter: [
    { from: /^name: gsd:(.+)$/gm, to: 'name: gsd-$1' },
  ],
};

// ============================================================================
// BASE TRANSFORMER PROTOTYPE
// ============================================================================

/**
 * Base transformer with shared behavior
 */
const BaseTransformer = {
  transform(content) {
    let result = content;
    for (const rule of this.rules) {
      result = result.replace(rule.from, rule.to);
    }
    return result;
  },
  
  countChanges(original, transformed) {
    return original !== transformed ? 1 : 0;
  },
};

/**
 * Create a transformer from rules
 */
function createTransformer(name, rules) {
  const transformer = Object.create(BaseTransformer);
  transformer.name = name;
  transformer.rules = rules;
  return transformer;
}

// ============================================================================
// SPECIALIZED TRANSFORMERS
// ============================================================================

const PathTransformer = createTransformer('paths', TRANSFORMATION_RULES.paths);
const NamingTransformer = createTransformer('naming', TRANSFORMATION_RULES.naming);
const CommandTransformer = createTransformer('commands', TRANSFORMATION_RULES.commands);
const SubagentTransformer = createTransformer('subagents', TRANSFORMATION_RULES.subagents);
const ToolTransformer = createTransformer('tools', TRANSFORMATION_RULES.tools);
const SessionTransformer = createTransformer('session', TRANSFORMATION_RULES.session);
const PackageRefTransformer = createTransformer('packageRefs', TRANSFORMATION_RULES.packageRefs);
const YamlTransformer = createTransformer('yamlFrontmatter', TRANSFORMATION_RULES.yamlFrontmatter);

// All transformers in order
const ALL_TRANSFORMERS = [
  PathTransformer,
  NamingTransformer,
  CommandTransformer,
  SubagentTransformer,
  ToolTransformer,
  SessionTransformer,
  PackageRefTransformer,
  YamlTransformer,
];

// ============================================================================
// PIPELINE
// ============================================================================

/**
 * Transform pipeline - composes multiple transformers
 */
const TransformPipeline = {
  create(transformers) {
    const pipeline = Object.create(TransformPipeline);
    pipeline.transformers = transformers || ALL_TRANSFORMERS;
    return pipeline;
  },
  
  transform(content) {
    let result = content;
    let changeCount = 0;
    
    for (const transformer of this.transformers) {
      const before = result;
      result = transformer.transform(result);
      if (before !== result) {
        changeCount++;
      }
    }
    
    return { content: result, changes: changeCount };
  },
};

// ============================================================================
// SKIP PATTERNS
// ============================================================================

const SKIP_PATTERNS = [
  /node_modules/,
  /^\.git$/,
  /^\.git\//,
  /\.jj\//,
  /\.DS_Store/,
  /\.planning\//,
  /package-lock\.json/,
  /^hooks\//,
  /^hooks$/,
];

const SKIP_FILES = [
  'hooks/gsd-check-update.js',
  'hooks/statusline.js',
  'AGENTS.md',
];

const DIRECTORY_MAPPING = {
  'commands/gsd': 'command/gsd',
};

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Check if a path should be skipped
 */
function shouldSkip(relativePath) {
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(relativePath)) {
      return true;
    }
  }
  
  for (const skipFile of SKIP_FILES) {
    if (relativePath === skipFile || relativePath.endsWith('/' + skipFile)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Transform a file path according to directory mapping
 */
function transformPath(relativePath) {
  for (const [from, to] of Object.entries(DIRECTORY_MAPPING)) {
    if (relativePath.startsWith(from)) {
      return relativePath.replace(from, to);
    }
  }
  return relativePath;
}

/**
 * Transform package.json for OpenCode
 */
function transformPackageJson(pkg) {
  return {
    name: 'gsd-opencode',
    version: pkg.version || '1.0.0',
    description: 'A meta-prompting, context engineering and spec-driven development system for OpenCode by TACHES.',
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
    author: 'TACHES & YOUR_NAME',
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
 * Transform JavaScript file content
 */
function transformJsContent(content) {
  const pipeline = TransformPipeline.create([
    PathTransformer,
    NamingTransformer,
    PackageRefTransformer,
    CommandTransformer,
  ]);
  
  let result = pipeline.transform(content).content;
  
  // JS-specific transformations
  result = result.replace(/'commands'/g, "'command'");
  result = result.replace(/"commands"/g, '"command"');
  
  return result;
}

/**
 * Parse command line arguments
 */
function parseArgs(argv) {
  const options = {
    source: null,
    output: './gsd-opencode-output',
    version: 'latest',
    dryRun: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--source' || arg === '-s') {
      options.source = argv[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = argv[++i];
    } else if (arg === '--version' || arg === '-v') {
      options.version = argv[++i];
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

/**
 * Get version from package.json in a directory
 */
function getSourceVersion(srcDir, fs) {
  try {
    const pkgPath = `${srcDir}/package.json`;
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg.version;
    }
  } catch {
    // ignore
  }
  return 'unknown';
}

// ============================================================================
// FILE PROCESSOR FACTORY
// ============================================================================

/**
 * File processor - handles different file types polymorphically
 */
const FileProcessor = {
  create(deps) {
    const processor = Object.create(FileProcessor);
    processor.fs = deps.fs;
    processor.pipeline = TransformPipeline.create();
    processor.verbose = deps.verbose || false;
    processor.dryRun = deps.dryRun || false;
    processor.log = deps.log || console.log;
    return processor;
  },
  
  processFile(srcPath, destPath, entry) {
    const handlers = {
      '.md': () => this.processMarkdown(srcPath, destPath),
      '.js': () => this.processJavaScript(srcPath, destPath),
      'package.json': () => this.processPackageJson(srcPath, destPath),
    };
    
    // Check for exact filename match first
    if (entry.name === 'package.json') {
      return handlers['package.json']();
    }
    
    // Check extension
    const ext = entry.name.substring(entry.name.lastIndexOf('.'));
    const handler = handlers[ext];
    
    if (handler) {
      return handler();
    }
    
    // Default: copy as-is
    return this.copyFile(srcPath, destPath);
  },
  
  processMarkdown(srcPath, destPath) {
    const content = this.fs.readFileSync(srcPath, 'utf8');
    const { content: transformed, changes } = this.pipeline.transform(content);
    
    if (!this.dryRun) {
      this.fs.mkdirSync(destPath.substring(0, destPath.lastIndexOf('/')), { recursive: true });
      this.fs.writeFileSync(destPath, transformed);
    }
    
    if (this.verbose && changes > 0) {
      this.log(`  Transformed: ${srcPath} (${changes} categories changed)`);
    }
    
    return { transformed: changes > 0 };
  },
  
  processJavaScript(srcPath, destPath) {
    const content = this.fs.readFileSync(srcPath, 'utf8');
    const transformed = transformJsContent(content);
    
    if (!this.dryRun) {
      this.fs.mkdirSync(destPath.substring(0, destPath.lastIndexOf('/')), { recursive: true });
      this.fs.writeFileSync(destPath, transformed);
      this.fs.chmodSync(destPath, 0o755);
    }
    
    return { transformed: content !== transformed };
  },
  
  processPackageJson(srcPath, destPath) {
    const pkg = JSON.parse(this.fs.readFileSync(srcPath, 'utf8'));
    const transformed = transformPackageJson(pkg);
    
    if (!this.dryRun) {
      this.fs.mkdirSync(destPath.substring(0, destPath.lastIndexOf('/')), { recursive: true });
      this.fs.writeFileSync(destPath, JSON.stringify(transformed, null, 2) + '\n');
    }
    
    return { transformed: true };
  },
  
  copyFile(srcPath, destPath) {
    if (!this.dryRun) {
      this.fs.mkdirSync(destPath.substring(0, destPath.lastIndexOf('/')), { recursive: true });
      this.fs.copyFileSync(srcPath, destPath);
    }
    return { transformed: false };
  },
};

// ============================================================================
// DIRECTORY PROCESSOR
// ============================================================================

/**
 * Process a directory recursively
 */
function processDirectory(srcDir, destDir, deps) {
  const { fs, baseDir, dryRun, verbose, log } = deps;
  const processor = FileProcessor.create({ fs, dryRun, verbose, log });
  
  const stats = {
    files: 0,
    transformed: 0,
    skipped: 0,
    directories: 0,
  };

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = `${srcDir}/${entry.name}`;
    const relativePath = srcPath.replace(baseDir + '/', '');

    if (shouldSkip(relativePath)) {
      stats.skipped++;
      if (verbose) {
        log(`  Skipped: ${relativePath}`);
      }
      continue;
    }

    const transformedRelPath = transformPath(relativePath);
    const destPath = `${destDir}/${transformedRelPath}`;

    if (entry.isDirectory()) {
      if (!dryRun) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      stats.directories++;

      const subStats = processDirectory(srcPath, destDir, {
        ...deps,
        baseDir,
      });

      stats.files += subStats.files;
      stats.transformed += subStats.transformed;
      stats.skipped += subStats.skipped;
      stats.directories += subStats.directories;
    } else if (entry.isFile()) {
      stats.files++;
      
      const result = processor.processFile(srcPath, destPath, entry);
      if (result.transformed) {
        stats.transformed++;
      }
    }
  }

  return stats;
}

/**
 * Clean up empty directories recursively
 */
function cleanupEmptyDirs(dir, fs) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = `${dir}/${entry.name}`;
      cleanupEmptyDirs(subPath, fs);
      
      const remaining = fs.readdirSync(subPath);
      if (remaining.length === 0) {
        fs.rmdirSync(subPath);
      }
    }
  }
}

// ============================================================================
// TRANSFORMER FACTORY
// ============================================================================

/**
 * Create a transformer instance with injected dependencies
 */
function createGsdTransformer(deps) {
  const { fs, execSync, log, logSuccess, logWarning, logError } = deps;
  
  /**
   * Clone source repo from GitHub
   */
  function cloneSourceRepo(targetDir, version = 'latest') {
    const repoUrl = 'https://github.com/glittercowboy/get-shit-done.git';
    log(`Cloning get-shit-done from ${repoUrl}`);

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
   * Run the transformation
   */
  function transform(options) {
    let srcDir = options.source;
    let cleanupSource = false;

    if (!srcDir) {
      srcDir = `/tmp/gsd-source-${Date.now()}`;
      cleanupSource = true;

      if (!cloneSourceRepo(srcDir, options.version)) {
        return { success: false, error: 'Failed to clone source' };
      }
    }

    if (!fs.existsSync(srcDir)) {
      return { success: false, error: `Source directory not found: ${srcDir}` };
    }

    const sourceVersion = getSourceVersion(srcDir, fs);
    log(`Source version: ${sourceVersion}`);
    log(`Output directory: ${options.output}`);

    if (options.dryRun) {
      logWarning('DRY RUN - no files will be written');
    }

    if (!options.dryRun) {
      if (fs.existsSync(options.output)) {
        logWarning(`Removing existing output directory: ${options.output}`);
        fs.rmSync(options.output, { recursive: true });
      }
      fs.mkdirSync(options.output, { recursive: true });
    }

    log('Processing files...');
    const stats = processDirectory(srcDir, options.output, {
      fs,
      baseDir: srcDir,
      dryRun: options.dryRun,
      verbose: options.verbose,
      log,
    });

    if (!options.dryRun) {
      cleanupEmptyDirs(options.output, fs);
    }

    if (cleanupSource && fs.existsSync(srcDir)) {
      fs.rmSync(srcDir, { recursive: true });
    }

    return {
      success: true,
      stats,
      sourceVersion,
    };
  }
  
  return { transform, cloneSourceRepo };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Transformation rules
  TRANSFORMATION_RULES,
  
  // Transformers
  BaseTransformer,
  createTransformer,
  PathTransformer,
  NamingTransformer,
  CommandTransformer,
  SubagentTransformer,
  ToolTransformer,
  SessionTransformer,
  PackageRefTransformer,
  YamlTransformer,
  ALL_TRANSFORMERS,
  
  // Pipeline
  TransformPipeline,
  
  // Skip patterns
  SKIP_PATTERNS,
  SKIP_FILES,
  DIRECTORY_MAPPING,
  
  // Pure functions
  shouldSkip,
  transformPath,
  transformPackageJson,
  transformJsContent,
  parseArgs,
  getSourceVersion,
  
  // Processors
  FileProcessor,
  processDirectory,
  cleanupEmptyDirs,
  
  // Factory
  createGsdTransformer,
};
