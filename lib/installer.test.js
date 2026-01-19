import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseArgs,
  validateArgs,
  detectPlatform,
  expandTilde,
  computePaths,
  createInstallPlan,
  readSettings,
  PLATFORMS,
  createInstaller,
} from './installer.js';

// ============================================================================
// parseArgs
// ============================================================================

describe('parseArgs', () => {
  it('returns default values for empty argv', () => {
    const result = parseArgs([]);
    expect(result).toEqual({
      help: false,
      global: false,
      local: false,
      opencode: false,
      claudeCode: false,
      configDir: null,
    });
  });

  it('parses --help and -h flags', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  it('parses --global and -g flags', () => {
    expect(parseArgs(['--global']).global).toBe(true);
    expect(parseArgs(['-g']).global).toBe(true);
  });

  it('parses --local and -l flags', () => {
    expect(parseArgs(['--local']).local).toBe(true);
    expect(parseArgs(['-l']).local).toBe(true);
  });

  it('parses --opencode and -o flags', () => {
    expect(parseArgs(['--opencode']).opencode).toBe(true);
    expect(parseArgs(['-o']).opencode).toBe(true);
  });

  it('parses --claude-code and --cc flags', () => {
    expect(parseArgs(['--claude-code']).claudeCode).toBe(true);
    expect(parseArgs(['--cc']).claudeCode).toBe(true);
  });

  it('parses --config-dir with space separator', () => {
    const result = parseArgs(['--config-dir', '/custom/path']);
    expect(result.configDir).toBe('/custom/path');
  });

  it('parses -c with space separator', () => {
    const result = parseArgs(['-c', '/custom/path']);
    expect(result.configDir).toBe('/custom/path');
  });

  it('parses --config-dir= format', () => {
    const result = parseArgs(['--config-dir=/custom/path']);
    expect(result.configDir).toBe('/custom/path');
  });

  it('ignores --config-dir without value', () => {
    const result = parseArgs(['--config-dir', '-g']);
    expect(result.configDir).toBe(null);
    expect(result.global).toBe(true);
  });

  it('parses multiple flags together', () => {
    const result = parseArgs(['--opencode', '-g', '--config-dir', '/path']);
    expect(result.opencode).toBe(true);
    expect(result.global).toBe(true);
    expect(result.configDir).toBe('/path');
  });
});

// ============================================================================
// validateArgs
// ============================================================================

describe('validateArgs', () => {
  it('returns valid for empty args', () => {
    const result = validateArgs({});
    expect(result.valid).toBe(true);
  });

  it('returns error when both opencode and claudeCode are set', () => {
    const result = validateArgs({ opencode: true, claudeCode: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('both');
  });

  it('returns error when both global and local are set', () => {
    const result = validateArgs({ global: true, local: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('both');
  });

  it('allows opencode with global', () => {
    const result = validateArgs({ opencode: true, global: true });
    expect(result.valid).toBe(true);
  });

  it('allows claudeCode with local', () => {
    const result = validateArgs({ claudeCode: true, local: true });
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// detectPlatform
// ============================================================================

describe('detectPlatform', () => {
  it('returns opencode when args.opencode is true', () => {
    const result = detectPlatform({
      args: { opencode: true },
      env: {},
      existsSync: () => false,
      homedir: '/home/user',
    });
    expect(result).toBe('opencode');
  });

  it('returns claude-code when args.claudeCode is true', () => {
    const result = detectPlatform({
      args: { claudeCode: true },
      env: {},
      existsSync: () => false,
      homedir: '/home/user',
    });
    expect(result).toBe('claude-code');
  });

  it('returns opencode when OPENCODE_CONFIG_DIR is set', () => {
    const result = detectPlatform({
      args: {},
      env: { OPENCODE_CONFIG_DIR: '/some/path' },
      existsSync: () => false,
      homedir: '/home/user',
    });
    expect(result).toBe('opencode');
  });

  it('returns claude-code when CLAUDE_CONFIG_DIR is set', () => {
    const result = detectPlatform({
      args: {},
      env: { CLAUDE_CONFIG_DIR: '/some/path' },
      existsSync: () => false,
      homedir: '/home/user',
    });
    expect(result).toBe('claude-code');
  });

  it('returns opencode when only opencode dir exists', () => {
    const existsSync = (p) => p === '/home/user/.config/opencode';
    const result = detectPlatform({
      args: {},
      env: {},
      existsSync,
      homedir: '/home/user',
    });
    expect(result).toBe('opencode');
  });

  it('returns claude-code when only claude dir exists', () => {
    const existsSync = (p) => p === '/home/user/.claude';
    const result = detectPlatform({
      args: {},
      env: {},
      existsSync,
      homedir: '/home/user',
    });
    expect(result).toBe('claude-code');
  });

  it('returns null when both dirs exist', () => {
    const result = detectPlatform({
      args: {},
      env: {},
      existsSync: () => true,
      homedir: '/home/user',
    });
    expect(result).toBe(null);
  });

  it('returns null when neither dir exists', () => {
    const result = detectPlatform({
      args: {},
      env: {},
      existsSync: () => false,
      homedir: '/home/user',
    });
    expect(result).toBe(null);
  });

  it('prefers explicit args over env vars', () => {
    const result = detectPlatform({
      args: { opencode: true },
      env: { CLAUDE_CONFIG_DIR: '/path' },
      existsSync: () => false,
      homedir: '/home/user',
    });
    expect(result).toBe('opencode');
  });
});

// ============================================================================
// expandTilde
// ============================================================================

describe('expandTilde', () => {
  it('expands ~ at start of path', () => {
    expect(expandTilde('~/Documents', '/home/user')).toBe('/home/user/Documents');
  });

  it('does not expand ~ in middle of path', () => {
    expect(expandTilde('/path/~/Documents', '/home/user')).toBe('/path/~/Documents');
  });

  it('returns null for null input', () => {
    expect(expandTilde(null, '/home/user')).toBe(null);
  });

  it('returns undefined for undefined input', () => {
    expect(expandTilde(undefined, '/home/user')).toBe(undefined);
  });

  it('returns absolute paths unchanged', () => {
    expect(expandTilde('/absolute/path', '/home/user')).toBe('/absolute/path');
  });
});

// ============================================================================
// Platform strategies
// ============================================================================

describe('PLATFORMS', () => {
  describe('claude-code', () => {
    const platform = PLATFORMS['claude-code'];

    it('has correct id', () => {
      expect(platform.id).toBe('claude-code');
    });

    it('has correct name', () => {
      expect(platform.name).toBe('Claude Code');
    });

    it('uses plural commands directory', () => {
      expect(platform.commandsDir).toBe('commands');
    });

    it('uses colon command prefix', () => {
      expect(platform.commandPrefix).toBe('/gsd:');
    });

    it('supports hooks', () => {
      expect(platform.supportsHooks).toBe(true);
    });

    it('computes correct global dir', () => {
      expect(platform.getGlobalDir('/home/user')).toBe('/home/user/.claude');
    });

    it('transforms content correctly', () => {
      const input = 'Look in ~/.claude/ for config';
      const output = platform.transformContent(input, '~/.claude/');
      expect(output).toBe('Look in ~/.claude/ for config');
    });
  });

  describe('opencode', () => {
    const platform = PLATFORMS['opencode'];

    it('has correct id', () => {
      expect(platform.id).toBe('opencode');
    });

    it('has correct name', () => {
      expect(platform.name).toBe('OpenCode');
    });

    it('uses singular command directory', () => {
      expect(platform.commandsDir).toBe('command');
    });

    it('uses hyphen command prefix', () => {
      expect(platform.commandPrefix).toBe('/gsd-');
    });

    it('does not support hooks', () => {
      expect(platform.supportsHooks).toBe(false);
    });

    it('computes correct global dir', () => {
      expect(platform.getGlobalDir('/home/user')).toBe('/home/user/.config/opencode');
    });

    it('transforms claude paths to opencode paths', () => {
      const input = 'Look in ~/.claude/ for config';
      const output = platform.transformContent(input, '~/.config/opencode/');
      expect(output).toBe('Look in ~/.config/opencode/ for config');
    });

    it('transforms local claude paths to local opencode paths', () => {
      const input = 'Look in ./.claude/ for config';
      const output = platform.transformContent(input, './.opencode/');
      expect(output).toBe('Look in ./.opencode/ for config');
    });

    it('transforms gsd: commands to gsd- commands', () => {
      const input = 'Run /gsd:help for help';
      const output = platform.transformContent(input, '~/.config/opencode/');
      expect(output).toBe('Run /gsd-help for help');
    });

    it('applies all transformations together', () => {
      const input = 'Run /gsd:help in ~/.claude/ or ./.claude/';
      const output = platform.transformContent(input, '~/.config/opencode/');
      expect(output).toBe('Run /gsd-help in ~/.config/opencode/ or ./.opencode/');
    });
  });
});

// ============================================================================
// computePaths
// ============================================================================

describe('computePaths', () => {
  const claudePlatform = PLATFORMS['claude-code'];
  const opencodePlatform = PLATFORMS['opencode'];

  it('computes global paths for claude-code', () => {
    const result = computePaths(claudePlatform, {
      isGlobal: true,
      homedir: '/home/user',
      cwd: '/projects/myapp',
      explicitConfigDir: null,
      env: {},
    });

    expect(result.targetDir).toBe('/home/user/.claude');
    expect(result.pathPrefix).toBe('~/.claude/');
    expect(result.commandsDir).toBe('/home/user/.claude/commands');
  });

  it('computes local paths for claude-code', () => {
    const result = computePaths(claudePlatform, {
      isGlobal: false,
      homedir: '/home/user',
      cwd: '/projects/myapp',
      explicitConfigDir: null,
      env: {},
    });

    expect(result.targetDir).toBe('/projects/myapp/.claude');
    expect(result.pathPrefix).toBe('./.claude/');
  });

  it('computes global paths for opencode', () => {
    const result = computePaths(opencodePlatform, {
      isGlobal: true,
      homedir: '/home/user',
      cwd: '/projects/myapp',
      explicitConfigDir: null,
      env: {},
    });

    expect(result.targetDir).toBe('/home/user/.config/opencode');
    expect(result.pathPrefix).toBe('~/.config/opencode/');
    expect(result.commandsDir).toBe('/home/user/.config/opencode/command');
  });

  it('uses explicit config dir when provided', () => {
    const result = computePaths(claudePlatform, {
      isGlobal: true,
      homedir: '/home/user',
      cwd: '/projects/myapp',
      explicitConfigDir: '/custom/config',
      env: {},
    });

    expect(result.targetDir).toBe('/custom/config');
    expect(result.pathPrefix).toBe('/custom/config/');
  });

  it('expands tilde in explicit config dir', () => {
    const result = computePaths(claudePlatform, {
      isGlobal: true,
      homedir: '/home/user',
      cwd: '/projects/myapp',
      explicitConfigDir: '~/custom/config',
      env: {},
    });

    expect(result.targetDir).toBe('/home/user/custom/config');
  });

  it('uses env var config dir when no explicit dir', () => {
    const result = computePaths(claudePlatform, {
      isGlobal: true,
      homedir: '/home/user',
      cwd: '/projects/myapp',
      explicitConfigDir: null,
      env: { CLAUDE_CONFIG_DIR: '/env/config' },
    });

    expect(result.targetDir).toBe('/env/config');
  });

  it('prefers explicit config dir over env var', () => {
    const result = computePaths(claudePlatform, {
      isGlobal: true,
      homedir: '/home/user',
      cwd: '/projects/myapp',
      explicitConfigDir: '/explicit/config',
      env: { CLAUDE_CONFIG_DIR: '/env/config' },
    });

    expect(result.targetDir).toBe('/explicit/config');
  });
});

// ============================================================================
// createInstallPlan
// ============================================================================

describe('createInstallPlan', () => {
  const paths = {
    targetDir: '/home/user/.claude',
    pathPrefix: '~/.claude/',
    commandsDir: '/home/user/.claude/commands',
  };

  it('creates plan with gsd commands from default source', () => {
    const plan = createInstallPlan(PLATFORMS['claude-code'], paths, {
      srcDir: '/src',
      existsSync: (p) => !p.includes('adapters'),
      version: '1.0.0',
    });

    const gsdTask = plan.find(t => t.description === 'commands/gsd');
    expect(gsdTask).toBeDefined();
    expect(gsdTask.src).toBe('/src/commands/gsd');
    expect(gsdTask.dest).toBe('/home/user/.claude/commands/gsd');
  });

  it('creates plan with gsd commands from adapter for opencode', () => {
    const ocPaths = {
      targetDir: '/home/user/.config/opencode',
      pathPrefix: '~/.config/opencode/',
      commandsDir: '/home/user/.config/opencode/command',
    };

    const plan = createInstallPlan(PLATFORMS['opencode'], ocPaths, {
      srcDir: '/src',
      existsSync: () => true, // adapter exists
      version: '1.0.0',
    });

    const gsdTask = plan.find(t => t.description === 'command/gsd');
    expect(gsdTask).toBeDefined();
    expect(gsdTask.src).toBe('/src/adapters/opencode/command/gsd');
  });

  it('includes get-shit-done skill', () => {
    const plan = createInstallPlan(PLATFORMS['claude-code'], paths, {
      srcDir: '/src',
      existsSync: () => false,
      version: '1.0.0',
    });

    const skillTask = plan.find(t => t.description === 'get-shit-done');
    expect(skillTask).toBeDefined();
    expect(skillTask.type).toBe('copyDir');
    expect(skillTask.transform).toBe(true);
  });

  it('includes agents when they exist', () => {
    const plan = createInstallPlan(PLATFORMS['claude-code'], paths, {
      srcDir: '/src',
      existsSync: (p) => p === '/src/agents',
      version: '1.0.0',
    });

    const agentsTask = plan.find(t => t.description === 'agents');
    expect(agentsTask).toBeDefined();
    expect(agentsTask.type).toBe('copyAgents');
  });

  it('excludes agents when they do not exist', () => {
    const plan = createInstallPlan(PLATFORMS['claude-code'], paths, {
      srcDir: '/src',
      existsSync: () => false,
      version: '1.0.0',
    });

    const agentsTask = plan.find(t => t.description === 'agents');
    expect(agentsTask).toBeUndefined();
  });

  it('includes VERSION file task', () => {
    const plan = createInstallPlan(PLATFORMS['claude-code'], paths, {
      srcDir: '/src',
      existsSync: () => false,
      version: '1.2.3',
    });

    const versionTask = plan.find(t => t.description === 'VERSION (1.2.3)');
    expect(versionTask).toBeDefined();
    expect(versionTask.type).toBe('writeFile');
    expect(versionTask.content).toBe('1.2.3');
  });

  it('includes hooks for claude-code when they exist', () => {
    const plan = createInstallPlan(PLATFORMS['claude-code'], paths, {
      srcDir: '/src',
      existsSync: (p) => p === '/src/hooks',
      version: '1.0.0',
    });

    const hooksTask = plan.find(t => t.description === 'hooks');
    expect(hooksTask).toBeDefined();
  });

  it('excludes hooks for opencode', () => {
    const ocPaths = {
      targetDir: '/home/user/.config/opencode',
      pathPrefix: '~/.config/opencode/',
      commandsDir: '/home/user/.config/opencode/command',
    };

    const plan = createInstallPlan(PLATFORMS['opencode'], ocPaths, {
      srcDir: '/src',
      existsSync: () => true, // hooks exist but should still be excluded
      version: '1.0.0',
    });

    const hooksTask = plan.find(t => t.description === 'hooks');
    expect(hooksTask).toBeUndefined();
  });

  it('includes CHANGELOG when it exists', () => {
    const plan = createInstallPlan(PLATFORMS['claude-code'], paths, {
      srcDir: '/src',
      existsSync: (p) => p === '/src/CHANGELOG.md',
      version: '1.0.0',
    });

    const changelogTask = plan.find(t => t.description === 'CHANGELOG.md');
    expect(changelogTask).toBeDefined();
    expect(changelogTask.type).toBe('copyFile');
  });
});

// ============================================================================
// readSettings
// ============================================================================

describe('readSettings', () => {
  it('returns empty object when file does not exist', () => {
    const fs = {
      existsSync: () => false,
    };
    const result = readSettings('/path/settings.json', fs);
    expect(result).toEqual({});
  });

  it('parses JSON when file exists', () => {
    const fs = {
      existsSync: () => true,
      readFileSync: () => '{"key": "value"}',
    };
    const result = readSettings('/path/settings.json', fs);
    expect(result).toEqual({ key: 'value' });
  });

  it('returns empty object on JSON parse error', () => {
    const fs = {
      existsSync: () => true,
      readFileSync: () => 'not json',
    };
    const result = readSettings('/path/settings.json', fs);
    expect(result).toEqual({});
  });
});

// ============================================================================
// createInstaller (integration-style tests)
// ============================================================================

describe('createInstaller', () => {
  let mockFs;
  let mockOs;
  let mockProcess;
  let mockReadline;
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
      unlinkSync: vi.fn(),
    };
    
    mockOs = {
      homedir: vi.fn(() => '/home/user'),
    };
    
    mockProcess = {
      cwd: vi.fn(() => '/projects/myapp'),
      env: {},
      stdin: { isTTY: false },
      stdout: {},
    };
    
    mockReadline = {
      createInterface: vi.fn(() => ({
        question: vi.fn((q, cb) => cb('1')),
        close: vi.fn(),
      })),
    };
  });

  function createTestInstaller() {
    return createInstaller({
      fs: mockFs,
      os: mockOs,
      process: mockProcess,
      readline: mockReadline,
      pkg: { version: '1.0.0' },
      log: (msg) => logs.push(msg),
      logError: (msg) => logs.push(`ERROR: ${msg}`),
    });
  }

  describe('detectPlatform', () => {
    it('detects opencode from args', () => {
      const installer = createTestInstaller();
      const result = installer.detectPlatform({ opencode: true });
      expect(result).toBe('opencode');
    });

    it('detects claude-code from args', () => {
      const installer = createTestInstaller();
      const result = installer.detectPlatform({ claudeCode: true });
      expect(result).toBe('claude-code');
    });
  });

  describe('install', () => {
    beforeEach(() => {
      // Setup fs mock to simulate successful operations
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('adapters/opencode')) return true;
        if (path.includes('agents')) return true;
        if (path.includes('hooks')) return true;
        if (path.includes('CHANGELOG.md')) return true;
        return false;
      });
      
      mockFs.readdirSync.mockImplementation((path, opts) => {
        if (opts?.withFileTypes) {
          return [
            { name: 'file.md', isDirectory: () => false, isFile: () => true },
          ];
        }
        return ['file.md'];
      });
    });

    it('creates commands directory', () => {
      const installer = createTestInstaller();
      installer.install('claude-code', true, { srcDir: '/src' });
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        '/home/user/.claude/commands',
        { recursive: true }
      );
    });

    it('installs to local directory when isGlobal is false', () => {
      const installer = createTestInstaller();
      installer.install('claude-code', false, { srcDir: '/src' });
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        '/projects/myapp/.claude/commands',
        { recursive: true }
      );
    });

    it('uses custom config dir when provided', () => {
      const installer = createTestInstaller();
      installer.install('claude-code', true, { 
        srcDir: '/src',
        configDir: '/custom/path',
      });
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        '/custom/path/commands',
        { recursive: true }
      );
    });

    it('writes VERSION file with correct version', () => {
      const installer = createTestInstaller();
      installer.install('claude-code', true, { srcDir: '/src' });
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.claude/get-shit-done/VERSION',
        '1.0.0'
      );
    });

    it('returns success result on successful install', () => {
      // For successful install, existsSync must return true for verification
      // and readdirSync must return non-empty arrays for directory verification
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation((path, opts) => {
        if (opts?.withFileTypes) {
          return [
            { name: 'file.md', isDirectory: () => false, isFile: () => true },
          ];
        }
        return ['file.md'];
      });
      
      const installer = createTestInstaller();
      const result = installer.install('claude-code', true, { srcDir: '/src' });
      
      expect(result.success).toBe(true);
      expect(result.platform).toBeDefined();
    });

    it('logs platform and location during install', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['file']);
      
      const installer = createTestInstaller();
      installer.install('opencode', true, { srcDir: '/src' });
      
      const platformLog = logs.find(l => l.includes('OpenCode'));
      expect(platformLog).toBeDefined();
    });
  });

  describe('promptPlatform', () => {
    it('defaults to claude-code in non-TTY mode', () => {
      return new Promise((resolve) => {
        const installer = createTestInstaller();
        installer.promptPlatform((result) => {
          expect(result).toBe('claude-code');
          resolve();
        });
      });
    });
  });

  describe('promptLocation', () => {
    it('defaults to global in non-TTY mode', () => {
      return new Promise((resolve) => {
        const installer = createTestInstaller();
        installer.promptLocation('claude-code', null, (isGlobal) => {
          expect(isGlobal).toBe(true);
          resolve();
        });
      });
    });
  });
});
