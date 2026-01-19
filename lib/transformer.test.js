import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from './transformer.js';

// ============================================================================
// Individual Transformers
// ============================================================================

describe('PathTransformer', () => {
  it('transforms ~/.claude/ to ~/.config/opencode/', () => {
    const input = 'Config is at ~/.claude/settings.json';
    const output = PathTransformer.transform(input);
    expect(output).toBe('Config is at ~/.config/opencode/settings.json');
  });

  it('transforms ./.claude/ to ./.opencode/', () => {
    const input = 'Local config at ./.claude/commands';
    const output = PathTransformer.transform(input);
    expect(output).toBe('Local config at ./.opencode/commands');
  });

  it('transforms .claude/ to .opencode/', () => {
    const input = 'The .claude/ directory';
    const output = PathTransformer.transform(input);
    expect(output).toBe('The .opencode/ directory');
  });

  it('transforms /.claude/ to /.opencode/', () => {
    const input = 'Path /.claude/ is used';
    const output = PathTransformer.transform(input);
    expect(output).toBe('Path /.opencode/ is used');
  });

  it('handles multiple occurrences', () => {
    const input = 'Copy ~/.claude/a to ~/.claude/b';
    const output = PathTransformer.transform(input);
    expect(output).toBe('Copy ~/.config/opencode/a to ~/.config/opencode/b');
  });
});

describe('NamingTransformer', () => {
  it('transforms "Claude Code" to "OpenCode"', () => {
    const input = 'Launch Claude Code to start';
    const output = NamingTransformer.transform(input);
    expect(output).toBe('Launch OpenCode to start');
  });

  it('transforms standalone "Claude" to "OpenCode"', () => {
    const input = 'Claude is an AI assistant';
    const output = NamingTransformer.transform(input);
    expect(output).toBe('OpenCode is an AI assistant');
  });

  it('transforms "Claude Code" before "Claude"', () => {
    const input = 'Use Claude Code, powered by Claude';
    const output = NamingTransformer.transform(input);
    expect(output).toBe('Use OpenCode, powered by OpenCode');
  });
});

describe('CommandTransformer', () => {
  it('transforms /gsd: to /gsd-', () => {
    const input = 'Run /gsd:help for help';
    const output = CommandTransformer.transform(input);
    expect(output).toBe('Run /gsd-help for help');
  });

  it('handles multiple commands', () => {
    const input = '/gsd:start then /gsd:status';
    const output = CommandTransformer.transform(input);
    expect(output).toBe('/gsd-start then /gsd-status');
  });
});

describe('SubagentTransformer', () => {
  it('transforms double-quoted subagent_type', () => {
    const input = 'subagent_type="gsd-executor"';
    const output = SubagentTransformer.transform(input);
    expect(output).toBe('subagent_type="general"');
  });

  it('transforms single-quoted subagent_type', () => {
    const input = "subagent_type='gsd-executor'";
    const output = SubagentTransformer.transform(input);
    expect(output).toBe("subagent_type='general'");
  });

  it('transforms YAML-style subagent_type', () => {
    const input = 'subagent_type: "gsd-executor"';
    const output = SubagentTransformer.transform(input);
    expect(output).toBe('subagent_type: "general"');
  });
});

describe('ToolTransformer', () => {
  it('transforms AskUserQuestion to question', () => {
    const input = 'Use the AskUserQuestion tool';
    const output = ToolTransformer.transform(input);
    expect(output).toBe('Use the question tool');
  });

  it('transforms "Explore agents" to lowercase', () => {
    const input = 'Explore agents to find';
    const output = ToolTransformer.transform(input);
    expect(output).toBe('explore agents to find');
  });
});

describe('SessionTransformer', () => {
  it('transforms /clear to /new', () => {
    const input = 'Run /clear to reset';
    const output = SessionTransformer.transform(input);
    expect(output).toBe('Run /new to reset');
  });

  it('transforms "Survives `/clear`" text', () => {
    const input = 'Survives `/clear` sessions';
    const output = SessionTransformer.transform(input);
    expect(output).toBe('Survives `/new` sessions');
  });
});

describe('PackageRefTransformer', () => {
  it('transforms npx get-shit-done-cc to npx gsd-opencode', () => {
    const input = 'Run npx get-shit-done-cc --global';
    const output = PackageRefTransformer.transform(input);
    expect(output).toBe('Run npx gsd-opencode --global');
  });

  it('transforms package name reference', () => {
    const input = 'Install get-shit-done-cc package';
    const output = PackageRefTransformer.transform(input);
    expect(output).toBe('Install gsd-opencode package');
  });
});

describe('YamlTransformer', () => {
  it('transforms YAML name field with gsd: prefix', () => {
    const input = 'name: gsd:help';
    const output = YamlTransformer.transform(input);
    expect(output).toBe('name: gsd-help');
  });

  it('handles multiline YAML', () => {
    const input = `---
name: gsd:start
description: Start GSD
---`;
    const output = YamlTransformer.transform(input);
    expect(output).toContain('name: gsd-start');
  });
});

// ============================================================================
// createTransformer
// ============================================================================

describe('createTransformer', () => {
  it('creates transformer with custom rules', () => {
    const transformer = createTransformer('custom', [
      { from: /foo/g, to: 'bar' },
    ]);
    
    expect(transformer.name).toBe('custom');
    expect(transformer.transform('foo baz foo')).toBe('bar baz bar');
  });

  it('created transformer inherits from BaseTransformer', () => {
    const transformer = createTransformer('test', []);
    expect(Object.getPrototypeOf(transformer)).toBe(BaseTransformer);
  });
});

// ============================================================================
// TransformPipeline
// ============================================================================

describe('TransformPipeline', () => {
  it('applies all transformers in sequence', () => {
    const pipeline = TransformPipeline.create();
    const input = 'Run /gsd:help in ~/.claude/ for Claude Code';
    const { content } = pipeline.transform(input);
    
    expect(content).toContain('/gsd-help');
    expect(content).toContain('~/.config/opencode/');
    expect(content).toContain('OpenCode');
  });

  it('returns change count', () => {
    const pipeline = TransformPipeline.create();
    const input = 'Run /gsd:help in ~/.claude/';
    const { changes } = pipeline.transform(input);
    
    expect(changes).toBeGreaterThan(0);
  });

  it('returns 0 changes for unchanged content', () => {
    const pipeline = TransformPipeline.create();
    const input = 'Nothing to transform here';
    const { changes } = pipeline.transform(input);
    
    expect(changes).toBe(0);
  });

  it('can be created with custom transformers', () => {
    const customTransformer = createTransformer('custom', [
      { from: /alpha/g, to: 'beta' },
    ]);
    const pipeline = TransformPipeline.create([customTransformer]);
    const { content } = pipeline.transform('alpha test');
    
    expect(content).toBe('beta test');
  });
});

// ============================================================================
// shouldSkip
// ============================================================================

describe('shouldSkip', () => {
  it('skips node_modules', () => {
    expect(shouldSkip('node_modules/package')).toBe(true);
    expect(shouldSkip('path/node_modules/pkg')).toBe(true);
  });

  it('skips .git directory', () => {
    expect(shouldSkip('.git')).toBe(true);
    expect(shouldSkip('.git/config')).toBe(true);
  });

  it('skips .jj directory', () => {
    expect(shouldSkip('.jj/store')).toBe(true);
  });

  it('skips .DS_Store', () => {
    expect(shouldSkip('.DS_Store')).toBe(true);
    expect(shouldSkip('path/.DS_Store')).toBe(true);
  });

  it('skips .planning directory', () => {
    expect(shouldSkip('.planning/notes')).toBe(true);
  });

  it('skips package-lock.json', () => {
    expect(shouldSkip('package-lock.json')).toBe(true);
  });

  it('skips hooks directory', () => {
    expect(shouldSkip('hooks')).toBe(true);
    expect(shouldSkip('hooks/script.js')).toBe(true);
  });

  it('skips specific files', () => {
    expect(shouldSkip('hooks/gsd-check-update.js')).toBe(true);
    expect(shouldSkip('hooks/statusline.js')).toBe(true);
    expect(shouldSkip('AGENTS.md')).toBe(true);
  });

  it('does not skip regular files', () => {
    expect(shouldSkip('src/index.js')).toBe(false);
    expect(shouldSkip('README.md')).toBe(false);
    expect(shouldSkip('commands/gsd/help.md')).toBe(false);
  });
});

// ============================================================================
// transformPath
// ============================================================================

describe('transformPath', () => {
  it('transforms commands/gsd to command/gsd', () => {
    expect(transformPath('commands/gsd')).toBe('command/gsd');
    expect(transformPath('commands/gsd/help.md')).toBe('command/gsd/help.md');
  });

  it('leaves other paths unchanged', () => {
    expect(transformPath('src/index.js')).toBe('src/index.js');
    expect(transformPath('get-shit-done/workflows')).toBe('get-shit-done/workflows');
  });
});

// ============================================================================
// transformPackageJson
// ============================================================================

describe('transformPackageJson', () => {
  it('returns package with gsd-opencode name', () => {
    const result = transformPackageJson({ version: '1.0.0' });
    expect(result.name).toBe('gsd-opencode');
  });

  it('preserves version from input', () => {
    const result = transformPackageJson({ version: '2.3.4' });
    expect(result.version).toBe('2.3.4');
  });

  it('defaults version to 1.0.0', () => {
    const result = transformPackageJson({});
    expect(result.version).toBe('1.0.0');
  });

  it('includes opencode keyword', () => {
    const result = transformPackageJson({});
    expect(result.keywords).toContain('opencode');
  });

  it('sets bin to gsd-opencode', () => {
    const result = transformPackageJson({});
    expect(result.bin['gsd-opencode']).toBe('bin/install.js');
  });

  it('includes command directory in files', () => {
    const result = transformPackageJson({});
    expect(result.files).toContain('command');
  });
});

// ============================================================================
// transformJsContent
// ============================================================================

describe('transformJsContent', () => {
  it('transforms path references', () => {
    const input = 'const path = "~/.claude/config"';
    const output = transformJsContent(input);
    expect(output).toContain('~/.config/opencode/');
  });

  it('transforms Claude naming', () => {
    const input = 'console.log("Claude Code starting")';
    const output = transformJsContent(input);
    expect(output).toContain('OpenCode');
  });

  it('transforms commands directory references', () => {
    const input = "const dir = 'commands'";
    const output = transformJsContent(input);
    expect(output).toBe("const dir = 'command'");
  });

  it('transforms double-quoted commands directory', () => {
    const input = 'const dir = "commands"';
    const output = transformJsContent(input);
    expect(output).toBe('const dir = "command"');
  });

  it('transforms gsd: command format', () => {
    const input = 'const cmd = "/gsd:help"';
    const output = transformJsContent(input);
    expect(output).toContain('/gsd-help');
  });
});

// ============================================================================
// parseArgs
// ============================================================================

describe('parseArgs', () => {
  it('returns defaults for empty args', () => {
    const result = parseArgs([]);
    expect(result).toEqual({
      source: null,
      output: './gsd-opencode-output',
      version: 'latest',
      dryRun: false,
      verbose: false,
      help: false,
    });
  });

  it('parses --source', () => {
    expect(parseArgs(['--source', '/path']).source).toBe('/path');
    expect(parseArgs(['-s', '/path']).source).toBe('/path');
  });

  it('parses --output', () => {
    expect(parseArgs(['--output', '/out']).output).toBe('/out');
    expect(parseArgs(['-o', '/out']).output).toBe('/out');
  });

  it('parses --version', () => {
    expect(parseArgs(['--version', 'v1.0']).version).toBe('v1.0');
    expect(parseArgs(['-v', 'v1.0']).version).toBe('v1.0');
  });

  it('parses --dry-run', () => {
    expect(parseArgs(['--dry-run']).dryRun).toBe(true);
  });

  it('parses --verbose', () => {
    expect(parseArgs(['--verbose']).verbose).toBe(true);
  });

  it('parses --help', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  it('parses multiple flags', () => {
    const result = parseArgs(['--source', '/src', '--output', '/out', '--dry-run']);
    expect(result.source).toBe('/src');
    expect(result.output).toBe('/out');
    expect(result.dryRun).toBe(true);
  });
});

// ============================================================================
// getSourceVersion
// ============================================================================

describe('getSourceVersion', () => {
  it('returns version from package.json', () => {
    const fs = {
      existsSync: () => true,
      readFileSync: () => '{"version": "1.2.3"}',
    };
    expect(getSourceVersion('/src', fs)).toBe('1.2.3');
  });

  it('returns unknown when file does not exist', () => {
    const fs = {
      existsSync: () => false,
    };
    expect(getSourceVersion('/src', fs)).toBe('unknown');
  });

  it('returns unknown on parse error', () => {
    const fs = {
      existsSync: () => true,
      readFileSync: () => 'not json',
    };
    expect(getSourceVersion('/src', fs)).toBe('unknown');
  });
});

// ============================================================================
// FileProcessor
// ============================================================================

describe('FileProcessor', () => {
  let mockFs;

  beforeEach(() => {
    mockFs = {
      readFileSync: vi.fn(() => 'content'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
      chmodSync: vi.fn(),
    };
  });

  it('processes markdown files with transformation', () => {
    mockFs.readFileSync.mockReturnValue('Run /gsd:help');
    
    const processor = FileProcessor.create({ fs: mockFs });
    const result = processor.processMarkdown('/src/file.md', '/dest/file.md');
    
    expect(mockFs.writeFileSync).toHaveBeenCalled();
    const writtenContent = mockFs.writeFileSync.mock.calls[0][1];
    expect(writtenContent).toContain('/gsd-help');
  });

  it('processes JavaScript files with transformation', () => {
    mockFs.readFileSync.mockReturnValue('const x = "~/.claude/"');
    
    const processor = FileProcessor.create({ fs: mockFs });
    processor.processJavaScript('/src/file.js', '/dest/file.js');
    
    expect(mockFs.writeFileSync).toHaveBeenCalled();
    expect(mockFs.chmodSync).toHaveBeenCalledWith('/dest/file.js', 0o755);
  });

  it('processes package.json with transformation', () => {
    mockFs.readFileSync.mockReturnValue('{"version": "1.0.0"}');
    
    const processor = FileProcessor.create({ fs: mockFs });
    processor.processPackageJson('/src/package.json', '/dest/package.json');
    
    const writtenContent = mockFs.writeFileSync.mock.calls[0][1];
    expect(writtenContent).toContain('gsd-opencode');
  });

  it('copies non-transformed files as-is', () => {
    const processor = FileProcessor.create({ fs: mockFs });
    processor.copyFile('/src/image.png', '/dest/image.png');
    
    expect(mockFs.copyFileSync).toHaveBeenCalledWith('/src/image.png', '/dest/image.png');
  });

  it('respects dryRun option', () => {
    const processor = FileProcessor.create({ fs: mockFs, dryRun: true });
    processor.processMarkdown('/src/file.md', '/dest/file.md');
    
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });
});

// ============================================================================
// processDirectory
// ============================================================================

describe('processDirectory', () => {
  let mockFs;

  beforeEach(() => {
    mockFs = {
      readdirSync: vi.fn(() => []),
      readFileSync: vi.fn(() => ''),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
      chmodSync: vi.fn(),
    };
  });

  it('returns stats object', () => {
    const stats = processDirectory('/src', '/dest', {
      fs: mockFs,
      baseDir: '/src',
      dryRun: false,
      verbose: false,
      log: () => {},
    });
    
    expect(stats).toHaveProperty('files');
    expect(stats).toHaveProperty('transformed');
    expect(stats).toHaveProperty('skipped');
    expect(stats).toHaveProperty('directories');
  });

  it('skips files matching skip patterns', () => {
    mockFs.readdirSync.mockReturnValue([
      { name: 'node_modules', isDirectory: () => true, isFile: () => false },
      { name: 'README.md', isDirectory: () => false, isFile: () => true },
    ]);

    const stats = processDirectory('/src', '/dest', {
      fs: mockFs,
      baseDir: '/src',
      dryRun: false,
      verbose: false,
      log: () => {},
    });
    
    expect(stats.skipped).toBe(1);
  });

  it('processes files and directories', () => {
    mockFs.readdirSync.mockImplementation((path, opts) => {
      if (path === '/src') {
        return [
          { name: 'file.md', isDirectory: () => false, isFile: () => true },
        ];
      }
      return [];
    });

    const stats = processDirectory('/src', '/dest', {
      fs: mockFs,
      baseDir: '/src',
      dryRun: false,
      verbose: false,
      log: () => {},
    });
    
    expect(stats.files).toBe(1);
  });
});

// ============================================================================
// cleanupEmptyDirs
// ============================================================================

describe('cleanupEmptyDirs', () => {
  it('removes empty directories', () => {
    const mockFs = {
      readdirSync: vi.fn()
        .mockReturnValueOnce([{ name: 'empty', isDirectory: () => true }])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]),
      rmdirSync: vi.fn(),
    };

    cleanupEmptyDirs('/root', mockFs);
    
    expect(mockFs.rmdirSync).toHaveBeenCalledWith('/root/empty');
  });

  it('does not remove non-empty directories', () => {
    const mockFs = {
      readdirSync: vi.fn()
        .mockReturnValueOnce([{ name: 'nonempty', isDirectory: () => true }])
        .mockReturnValueOnce([{ name: 'file.txt', isDirectory: () => false }])
        .mockReturnValueOnce(['file.txt']),
      rmdirSync: vi.fn(),
    };

    cleanupEmptyDirs('/root', mockFs);
    
    expect(mockFs.rmdirSync).not.toHaveBeenCalled();
  });
});

// ============================================================================
// createGsdTransformer (integration-style tests)
// ============================================================================

describe('createGsdTransformer', () => {
  let mockFs;
  let mockExecSync;
  let logs;

  beforeEach(() => {
    logs = [];
    
    mockFs = {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      readdirSync: vi.fn(() => []),
      readFileSync: vi.fn(() => ''),
      writeFileSync: vi.fn(),
      copyFileSync: vi.fn(),
      rmSync: vi.fn(),
      rmdirSync: vi.fn(),
      chmodSync: vi.fn(),
    };
    
    mockExecSync = vi.fn();
  });

  function createTestTransformer() {
    return createGsdTransformer({
      fs: mockFs,
      execSync: mockExecSync,
      log: (msg) => logs.push(msg),
      logSuccess: (msg) => logs.push(`SUCCESS: ${msg}`),
      logWarning: (msg) => logs.push(`WARNING: ${msg}`),
      logError: (msg) => logs.push(`ERROR: ${msg}`),
    });
  }

  describe('transform', () => {
    it('returns error when source does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const transformer = createTestTransformer();
      const result = transformer.transform({
        source: '/nonexistent',
        output: '/out',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('processes existing source directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([]);
      mockFs.readFileSync.mockReturnValue('{"version": "1.0.0"}');
      
      const transformer = createTestTransformer();
      const result = transformer.transform({
        source: '/src',
        output: '/out',
        dryRun: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
    });

    it('clones from GitHub when no source provided', () => {
      mockFs.existsSync.mockImplementation((p) => {
        // Exists after clone
        return p.includes('/tmp/gsd-source-');
      });
      mockFs.readdirSync.mockReturnValue([]);
      
      const transformer = createTestTransformer();
      transformer.transform({
        output: '/out',
        dryRun: true,
      });
      
      expect(mockExecSync).toHaveBeenCalled();
      const cloneCmd = mockExecSync.mock.calls[0][0];
      expect(cloneCmd).toContain('git clone');
      expect(cloneCmd).toContain('get-shit-done');
    });
  });

  describe('cloneSourceRepo', () => {
    it('clones with specific version when provided', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const transformer = createTestTransformer();
      transformer.cloneSourceRepo('/target', 'v1.0.0');
      
      expect(mockExecSync).toHaveBeenCalled();
      const cloneCmd = mockExecSync.mock.calls[0][0];
      expect(cloneCmd).toContain('--branch v1.0.0');
    });

    it('clones without branch for latest', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const transformer = createTestTransformer();
      transformer.cloneSourceRepo('/target', 'latest');
      
      expect(mockExecSync).toHaveBeenCalled();
      const cloneCmd = mockExecSync.mock.calls[0][0];
      expect(cloneCmd).not.toContain('--branch');
    });

    it('removes existing directory before cloning', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const transformer = createTestTransformer();
      transformer.cloneSourceRepo('/target');
      
      expect(mockFs.rmSync).toHaveBeenCalledWith('/target', { recursive: true });
    });

    it('returns false on clone failure', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockExecSync.mockImplementation(() => {
        throw new Error('Clone failed');
      });
      
      const transformer = createTestTransformer();
      const result = transformer.cloneSourceRepo('/target');
      
      expect(result).toBe(false);
      expect(logs.some(l => l.includes('ERROR'))).toBe(true);
    });
  });
});
