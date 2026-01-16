# Coding Conventions

**Analysis Date:** 2026-01-16

## Naming Patterns

**Files:**
- kebab-case for all files: `install.js`, `execute-plan.md`, `plan-phase.md`
- UPPERCASE for important docs: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- `gsd-*.md` prefix for agent definitions: `gsd-executor.md`, `gsd-verifier.md`
- `test-*.js` for test files: `test-install.js`

**Functions:**
- camelCase for all functions: `parseArgs()`, `showHelp()`, `copyDirectory()`, `install()`
- No special prefix for async functions: `async function main()`
- Descriptive verbs: `selectClient()`, `getTargetPath()`, `confirmInstall()`

**Variables:**
- camelCase for variables: `options`, `client`, `targetPath`, `absoluteTargetPath`
- camelCase for object keys: `colors.reset`, `colors.bright`
- No UPPER_SNAKE_CASE constants observed (minimal JS code)

**Types:**
- Not applicable (no TypeScript)

## Code Style

**Formatting:**
- 2 space indentation (observed in `bin/install.js`, `bin/test-install.js`)
- Single quotes for strings: `'claude-code'`, `'\x1b[32m'`
- Semicolons required
- ~100 character line length (inferred)
- No explicit config files (no `.prettierrc`, `.eslintrc`)

**Linting:**
- None configured
- No ESLint or Biome
- Style inferred from code examination

## Import Organization

**Order:**
1. Node.js built-in modules

**Pattern:**
```javascript
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { homedir } from 'os';
```

**Path Aliases:**
- None (pure Node.js with relative imports)

**ES Modules:**
- `"type": "module"` in `package.json`
- `import.meta.url` for `__filename`/`__dirname` equivalents

## Error Handling

**Patterns:**
- try/catch blocks at function boundaries
- `process.exit(1)` on fatal errors
- Colored console output for error messages

**Example (`bin/install.js`):**
```javascript
try {
  await install(client, scope);
} catch (error) {
  log(`\n${colors.red}Installation failed: ${error.message}${colors.reset}`);
  process.exit(1);
}
```

**Error Types:**
- Throw on file system errors
- Log with context before exiting
- Default to safe behavior on invalid input (e.g., default to 'claude-code')

## Logging

**Framework:**
- Custom `log()` function in `bin/install.js`
- Uses ANSI escape codes for colors

**Patterns:**
```javascript
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  // ...
};

function log(message) {
  console.log(message);
}
```

**Output Style:**
- Structured output with visual separators (`'='.repeat(60)`)
- Color-coded status messages (green for success, red for errors)

## Comments

**When to Comment:**
- Brief explanations for non-obvious code
- Example: `// ANSI color codes for terminal output`

**JSDoc:**
- Not used (minimal JS codebase)

**TODO Comments:**
- Not observed in JS files
- Markdown files may contain inline TODOs in workflow steps

## Function Design

**Size:**
- Functions kept reasonably short
- Main functions: `install()`, `main()`, `parseArgs()`

**Parameters:**
- Simple positional parameters: `install(client, scope)`
- No destructuring in parameters (simple JS)

**Return Values:**
- Explicit returns
- Async functions return promises

## Module Design

**Exports:**
- No exports (standalone CLI scripts)
- Direct execution via `#!/usr/bin/env node`

**Barrel Files:**
- Not applicable

## Markdown Prompt Conventions

**Command File Structure:**
```markdown
---
name: command-name
description: Brief description
argument-hint: [args]
allowed-tools: [...]
---

<objective>
What this command does
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/...
@~/.claude/get-shit-done/templates/...
</execution_context>

<process>
<step name="step-name">
Instructions...
</step>
</process>

<success_criteria>
- [ ] Criterion 1
- [ ] Criterion 2
</success_criteria>
```

**Workflow File Structure:**
```markdown
<purpose>
What this workflow does
</purpose>

<process>
<step name="step-name" priority="first">
Instructions...
</step>

<step name="another-step">
More instructions...
</step>
</process>
```

**Path References:**
- Claude Code: `@~/.claude/get-shit-done/...`
- OpenCode: `@~/.config/opencode/get-shit-done/...`

---

*Convention analysis: 2026-01-16*
*Update when patterns change*
