---
description: Analyze and fix CI failures with signed commits using MCP tools
allowed_tools: Edit,MultiEdit,Write,Read,Glob,Grep,LS,Bash(bun:*),Bash(npm:*),Bash(npx:*),Bash(gh:*),mcp__github_file_ops__commit_files,mcp__github_file_ops__delete_files
---

# Fix CI Failures with Signed Commits

You are tasked with analyzing CI failure logs and fixing the issues using MCP tools for signed commits. Follow these steps:

## Context Provided

$ARGUMENTS

## Important Context Information

Look for these key pieces of information in the arguments:

- **Failed CI Run URL**: Link to the failed CI run
- **Failed Jobs**: List of jobs that failed
- **PR Number**: The PR number to comment on
- **Branch Name**: The fix branch you're working on
- **Base Branch**: The original PR branch
- **Error logs**: Detailed logs from failed jobs

## CRITICAL: Use MCP Tools for Git Operations

**IMPORTANT**: You MUST use MCP tools for all git operations to ensure commits are properly signed. DO NOT use `git` commands directly via Bash.

- Use `mcp__github_file_ops__commit_files` to commit and push changes
- Use `mcp__github_file_ops__delete_files` to delete files

**⚠️ CRITICAL UNDERSTANDING**: The MCP commit tool (`mcp__github_file_ops__commit_files`) works by:
1. Reading files from YOUR LOCAL DISK at the paths you specify
2. Creating a commit with those file contents
3. Pushing to GitHub with signed commits

**This means you MUST edit files locally FIRST using Edit/MultiEdit/Write tools before committing!**

## Step 1: Analyze the Failure

Parse the provided CI failure information to understand:

- Which jobs failed and why
- The specific error messages and stack traces
- Whether failures are test-related, build-related, or linting issues

## Step 2: Search and Understand the Codebase

Use search tools to locate the failing code:

- Use `Grep` or `Glob` to find failing test names or functions
- Use `Read` to read source files mentioned in error messages
- Review related configuration files (package.json, tsconfig.json, etc.)

## Step 3: Apply Targeted Fixes

**CRITICAL: You MUST edit files locally using Edit/MultiEdit/Write tools BEFORE committing!**

Make minimal, focused changes:

- **For test failures**: Determine if the test or implementation needs fixing
- **For type errors**: Fix type definitions or correct the code logic
- **For linting issues**: Apply formatting using the project's tools
- **For build errors**: Resolve dependency or configuration issues
- **For missing imports**: Add the necessary imports or install packages
- **For syntax errors**: Use Edit tool to remove or fix the problematic lines

**WORKFLOW REQUIREMENT**: 
1. First READ the file to see the current content
2. Then EDIT/WRITE the file to fix the issue
3. Verify the file was edited successfully (the tool will show the updated content)
4. Only THEN proceed to commit the files

Requirements:

- Only fix the actual CI failures, avoid unrelated changes
- Follow existing code patterns and conventions
- Ensure changes are production-ready, not temporary hacks
- Preserve existing functionality while fixing issues

## Step 4: Verify Fixes Locally

Run available verification commands using Bash:

- Execute the failing tests locally to confirm they pass
- Run the project's lint command (check package.json for scripts)
- Run type checking if available
- Execute any build commands to ensure compilation succeeds

## Step 5: Commit and Push Changes Using MCP

**CRITICAL WORKFLOW - READ THIS CAREFULLY**:

The MCP commit tool reads files from your local disk. You MUST follow this exact sequence:

### Step 5.1: Verify Your Local Edits
Before committing, ensure you have:
- ✅ Used Read tool to view the original file content
- ✅ Used Edit/MultiEdit/Write tools to fix the issues
- ✅ Confirmed the tool showed "file has been updated" or similar success message
- ✅ The edited files exist on disk at the exact paths you'll pass to commit_files

### Step 5.2: Commit Your Changes
**Use `mcp__github_file_ops__commit_files` to commit and push all changes:**

```
mcp__github_file_ops__commit_files with:
- files: ["src/utils/retry.ts", "src/other/file.ts"]  // EXACT paths of files you edited locally
- message: "Fix CI failures: [describe specific fixes]"
```

**HOW IT WORKS**:
1. The MCP tool reads the content from YOUR LOCAL FILES at the paths specified
2. It creates a commit with those file contents
3. It pushes to the branch specified in "Branch Name:" from context

**COMMON MISTAKE TO AVOID**:
❌ DO NOT try to commit files you haven't edited locally first
❌ DO NOT skip the Edit/Write step thinking the MCP tool will make changes
✅ ALWAYS edit files locally first, THEN commit them

**Example of CORRECT workflow**:
```
1. Read("src/config.ts")  // See the problem
2. Edit("src/config.ts", old_string="console.log(\"broken);", new_string="")  // Fix it locally
3. mcp__github_file_ops__commit_files(files=["src/config.ts"], message="Fix syntax error")  // Commit the local fix
```

Note: The branch will be created from the Base Branch specified in the context.

## Step 6: Create PR Comment with Enhanced Format (REQUIRED - DO NOT SKIP)

**CRITICAL: You MUST create a PR comment after pushing. This step is MANDATORY.**

After successfully pushing the fixes, create an informative comment on the original PR.

### Part A: Prepare Fix Summary with Proper GitHub Links

1. **Get the full commit SHA** from your pushed fix branch:
   ```bash
   COMMIT_SHA=$(git rev-parse HEAD)
   echo "Commit SHA: $COMMIT_SHA"
   ```

2. **For each file you modified**, create a summary with GitHub permalink:
   - Identify the fix type: lint error, type error, test failure, etc.
   - Note the primary line number where the fix was applied
   - Create a GitHub permalink with 1 line of context (line before and after)
   
   **FORMAT**: `Fix-type in [\`filename:line\`](permalink)`
   
   **CRITICAL LINK FORMAT** (must match exactly):
   ```
   https://github.com/OWNER/REPO/blob/FULL_SHA/path/to/file.ext#LSTART-LEND
   ```
   - Use FULL commit SHA (40 characters), not abbreviated
   - Line range format: `#L10-L12` (for line 11 with context)
   - Include 1 line before and after the fix (e.g., fix on line 41 → link to L40-L42)

3. **Combine summaries** with bullet separator:
   ```
   SUMMARY1 • SUMMARY2 • SUMMARY3
   ```

### Part B: Check for Duplicate Comments

**MANDATORY**: Check if a CI fix comment already exists for this PR:

```bash
gh api repos/REPOSITORY/issues/PR_NUMBER/comments --jq '.[] | select(.user.login == "github-actions[bot]" and (.body | contains("CI Auto-Fix Available")) and (.body | contains("FIX_BRANCH")))' | jq -r '.id'
```

**If the command returns any IDs**: STOP - do not create a new comment.

### Part C: Create the PR Comment

**Execute this exact command** (replace placeholders with actual values):

```bash
gh pr comment PR_NUMBER --body "### 🤖 CI Auto-Fix Available

Fixed: FIX_SUMMARIES

**[→ Create PR with fixes](https://github.com/OWNER/REPO/compare/BASE_BRANCH...FIX_BRANCH?quick_pull=1)**

🤖 Generated with [Claude Code](https://claude.ai/code) • [Failed CI run](CI_RUN_URL)"
```

### COMPLETE EXAMPLES

**Example 1** - Multiple fixes (assuming PR #123, commit sha abc123...):
```bash
gh pr comment 123 --body "### 🤖 CI Auto-Fix Available

Fixed: Missing semicolon in [\`utils/helper.ts:41\`](https://github.com/anthropics/claude-cli-internal/blob/abc1234567890abcdef1234567890abcdef123456/src/utils/helper.ts#L40-L42) • Type mismatch in [\`api/client.ts:99\`](https://github.com/anthropics/claude-cli-internal/blob/abc1234567890abcdef1234567890abcdef123456/src/api/client.ts#L98-L100) • Undefined variable in [\`tests/auth.test.ts:55\`](https://github.com/anthropics/claude-cli-internal/blob/abc1234567890abcdef1234567890abcdef123456/tests/auth.test.ts#L54-L56)

**[→ Create PR with fixes](https://github.com/anthropics/claude-cli-internal/compare/main...claude-auto-fix-ci-signed-feature-xyz-28476234)**

🤖 Generated with [Claude Code](https://claude.ai/code) • [Failed CI run](https://github.com/anthropics/claude-cli-internal/actions/runs/17282789906)"
```

**Example 2** - Single fix:
```bash
gh pr comment 456 --body "### 🤖 CI Auto-Fix Available

Fixed: Import statement error in [\`index.ts:5\`](https://github.com/anthropics/claude-cli-internal/blob/def4567890abcdef1234567890abcdef123456789/src/index.ts#L4-L6)

**[→ Create PR with fixes](https://github.com/anthropics/claude-cli-internal/compare/develop...claude-auto-fix-ci-signed-bugfix-28476235)**

🤖 Generated with [Claude Code](https://claude.ai/code) • [Failed CI run](https://github.com/anthropics/claude-cli-internal/actions/runs/17282789907)"
```

### CRITICAL REQUIREMENTS

1. **Link format MUST be exact**:
   - ✅ CORRECT: `https://github.com/anthropics/claude-cli-internal/blob/abc1234567890abcdef1234567890abcdef123456/src/file.ts#L10-L12`
   - ❌ WRONG: `https://github.com/anthropics/claude-cli-internal/blob/abc123/src/file.ts#L11`
   - ❌ WRONG: Missing `#L` prefix or `-L` in range
   - ❌ WRONG: Abbreviated SHA

2. **Fix summaries MUST be concise**:
   - ✅ GOOD: "Missing semicolon in [`file.ts:41`](link)"
   - ❌ BAD: "Fixed missing semicolon issue in TypeScript file [`file.ts:41`](link) that was causing build to fail"

3. **MUST use bullet separator** (` • `) between multiple fixes, not commas or newlines

## Step 7: Final Verification

**BEFORE CONSIDERING THE TASK COMPLETE**, verify you have:

1. ✅ Fixed all CI failures  
2. ✅ Committed changes using `mcp__github_file_ops__commit_files`
3. ✅ Created the PR comment with ALL of these elements:
   - Fix summaries with GitHub permalinks using full commit SHA
   - Proper link format with line ranges (e.g., #L40-L42)
   - Bullet separators between multiple fixes
   - "Create PR with fixes" link
   - Claude Code attribution
   - Failed CI run reference
4. ✅ Verified no duplicate comments were created

### FINAL OUTPUT FORMAT

Your PR comment MUST follow this exact format (example with 3 fixes):

---

### 🤖 CI Auto-Fix Available

Fixed: Missing semicolon in [`utils/helper.ts:41`](https://github.com/anthropics/claude-cli-internal/blob/abc1234567890abcdef1234567890abcdef123456/src/utils/helper.ts#L40-L42) • Type mismatch in [`api/client.ts:99`](https://github.com/anthropics/claude-cli-internal/blob/abc1234567890abcdef1234567890abcdef123456/src/api/client.ts#L98-L100) • Undefined variable in [`tests/auth.test.ts:55`](https://github.com/anthropics/claude-cli-internal/blob/abc1234567890abcdef1234567890abcdef123456/tests/auth.test.ts#L54-L56)

**[→ Create PR with fixes](https://github.com/anthropics/claude-cli-internal/compare/main...claude-auto-fix-ci-signed-feature-xyz-28476234)**

🤖 Generated with [Claude Code](https://claude.ai/code) • [Failed CI run](https://github.com/anthropics/claude-cli-internal/actions/runs/17282789906)

---

Or for a single fix:

---

### 🤖 CI Auto-Fix Available

Fixed: Import statement error in [`index.ts:5`](https://github.com/anthropics/claude-cli-internal/blob/def4567890abcdef1234567890abcdef123456789/src/index.ts#L4-L6)

**[→ Create PR with fixes](https://github.com/anthropics/claude-cli-internal/compare/develop...claude-auto-fix-ci-signed-bugfix-28476235)**

🤖 Generated with [Claude Code](https://claude.ai/code) • [Failed CI run](https://github.com/anthropics/claude-cli-internal/actions/runs/17282789907)

---

**THE TASK IS NOT COMPLETE** until the PR comment is created with this exact format.

## Important Guidelines

- Always use MCP tools for git operations to ensure proper commit signing
- Focus exclusively on fixing the reported CI failures
- Maintain code quality and follow the project's established patterns
- If a fix requires significant refactoring, document why it's necessary
- When multiple solutions exist, choose the simplest one that maintains code quality

Begin by analyzing the failure details provided above.
