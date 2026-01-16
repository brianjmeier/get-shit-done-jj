# Testing Patterns

**Analysis Date:** 2026-01-16

## Test Framework

**Runner:**
- Custom test runner (no standard framework)
- No Jest, Vitest, or Mocha
- Location: `bin/test-install.js`

**Assertion Library:**
- Manual assertions with try/catch
- File existence checks via `fs.access()`

**Run Commands:**
```bash
node bin/test-install.js          # Run all installation tests
node bin/install.js --local       # Manual testing (per CONTRIBUTING.md)
```

## Test File Organization

**Location:**
- Co-located in `bin/` with source files
- Pattern: `test-*.js`

**Naming:**
- `test-install.js` for installation tests
- No separate unit/integration distinction in naming

**Structure:**
```
bin/
  install.js           # Main installer
  test-install.js      # Installation tests
```

## Test Structure

**Suite Organization:**
```javascript
// Custom test functions
async function testClaudeCodeInstallation() {
  // Create temp directory
  // Run installer with flags
  // Verify expected files exist
  // Cleanup
}

async function testOpenCodeInstallation() {
  // Similar pattern
}

async function main() {
  await testClaudeCodeInstallation();
  await testOpenCodeInstallation();
}
```

**Patterns:**
- Each test function is self-contained
- Setup (temp dir) → Execute (run installer) → Verify (check files) → Cleanup
- No shared state between tests

## Mocking

**Framework:**
- None (integration tests only)

**Patterns:**
- Tests spawn actual installer process via `child_process`
- No mocking of file system or other dependencies
- Tests use temporary directories for isolation

**What to Mock:**
- Not applicable (no mocking framework)

**What NOT to Mock:**
- Everything - tests are integration-level

## Fixtures and Factories

**Test Data:**
- No fixture files
- Tests use actual installer with temporary directories

**Location:**
- Not applicable

## Coverage

**Requirements:**
- No coverage target
- No coverage tool configured

**Configuration:**
- None (no c8, nyc, istanbul)

**View Coverage:**
- Not available

## Test Types

**Unit Tests:**
- None

**Integration Tests:**
- `bin/test-install.js` - Tests full installation workflow
- Spawns installer process
- Verifies file copying behavior

**E2E Tests:**
- Manual testing via Claude Code interface (documented in `CONTRIBUTING.md`)

## Common Patterns

**Async Testing:**
```javascript
async function testClaudeCodeInstallation() {
  try {
    // test code
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}
```

**Error Testing:**
- Exit with non-zero code on failure
- Console output for pass/fail status

**File System Testing:**
```javascript
import { promises as fs } from 'fs';
import { spawn } from 'child_process';

// Run installer in temp directory
const installer = spawn('node', ['bin/install.js', '--claude-code'], {
  cwd: tempDir
});

// Verify files exist
await fs.access(path.join(tempDir, 'expected-file.md'));
```

**Snapshot Testing:**
- Not used

## Manual Testing

**Per CONTRIBUTING.md:**
```bash
# Test local installation
node bin/install.js --claude-code --local

# Test in Claude Code
# 1. Open Claude Code
# 2. Run slash commands
# 3. Verify behavior
```

**Test Output Directory:**
- `test-output/` contains test artifacts
- Files: `dad-jokes.md`, `random-numbers.md`, `animal-facts.md`
- Note: Should probably be gitignored

## Gaps and Recommendations

**Missing:**
- Standard test framework (recommend Vitest)
- Unit tests for JavaScript functions
- Test coverage reporting
- CI pipeline for automated testing

**Current State:**
- Only installation workflow tested
- Manual testing required for command/workflow verification
- No tests for markdown template parsing

---

*Testing analysis: 2026-01-16*
*Update when test patterns change*
