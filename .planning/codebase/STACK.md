# Technology Stack

**Analysis Date:** 2026-01-16

## Languages

**Primary:**
- JavaScript (ES Modules) - All application code (`bin/install.js`, `bin/test-install.js`)
- Markdown - Command definitions, workflows, templates (`commands/gsd/*.md`, `get-shit-done/**/*.md`)

**Secondary:**
- None

## Runtime

**Environment:**
- Node.js >= 16.7.0 (`package.json` engines field)
- No browser runtime (CLI tool only)

**Package Manager:**
- npm (implicit from `package.json`)
- Lockfile: No lockfile present (no `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`)

## Frameworks

**Core:**
- None (vanilla Node.js CLI with zero dependencies)

**Testing:**
- Custom test runner (`bin/test-install.js`)
- No standard test framework (Jest, Vitest, etc.)

**Build/Dev:**
- None - Uses native ES modules without transpilation
- No TypeScript - No `tsconfig.json`
- No bundler (no Vite, Webpack, esbuild config)

## Key Dependencies

**Critical:**
- Zero external npm dependencies

**Infrastructure:**
- Node.js built-in modules only:
  - `fs` (promises) - File system operations
  - `path` - Path resolution
  - `url` (fileURLToPath) - ES module path handling
  - `readline` - Interactive CLI prompts
  - `os` - OS detection
  - `child_process` (spawn) - Process spawning for tests

## Configuration

**Environment:**
- No environment variables required
- No `.env` files

**Build:**
- `package.json` - Package manifest with `"type": "module"` for ES modules

**Runtime:**
- `get-shit-done/templates/config.json` - Project configuration template

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js >= 16.7.0)
- No external tooling required

**Production:**
- Distributed as npm package
- Installed via `npx gsd-jj`
- Copies files to `~/.claude/` (Claude Code) or `~/.config/opencode/` (OpenCode)

---

*Stack analysis: 2026-01-16*
*Update after major dependency changes*
