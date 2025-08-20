---
description: Analyze and fix CI failures by examining logs and making targeted fixes
allowed_tools: Edit,MultiEdit,Write,Read,Glob,Grep,LS,Bash(git:*),Bash(bun:*),Bash(npm:*),Bash(npx:*),Bash(gh:*)
---

# Fix CI Failures

You are tasked with analyzing CI failure logs and fixing the issues. Follow these steps:

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

## Step 1: Analyze the Failure

Parse the provided CI failure information to understand:

- Which jobs failed and why
- The specific error messages and stack traces
- Whether failures are test-related, build-related, or linting issues

## Step 2: Search and Understand the Codebase

Use search tools to locate the failing code:

- Search for the failing test names or functions
- Find the source files mentioned in error messages
- Review related configuration files (package.json, tsconfig.json, etc.)

## Step 3: Apply Targeted Fixes

Make minimal, focused changes:

- **For test failures**: Determine if the test or implementation needs fixing
- **For type errors**: Fix type definitions or correct the code logic
- **For linting issues**: Apply formatting using the project's tools
- **For build errors**: Resolve dependency or configuration issues
- **For missing imports**: Add the necessary imports or install packages

Requirements:

- Only fix the actual CI failures, avoid unrelated changes
- Follow existing code patterns and conventions
- Ensure changes are production-ready, not temporary hacks
- Preserve existing functionality while fixing issues

## Step 4: Commit and Push Changes

After applying ALL fixes:

1. Stage all modified files with `git add -A`
2. Commit with: `git commit -m "Fix CI failures: [describe specific fixes]"`
3. Document which CI jobs/tests were addressed
4. **CRITICAL**: Push the branch with `git push origin HEAD` - You MUST push the branch after committing

## Step 5: Create PR Comment

After successfully pushing the fixes, create a comment on the original PR to notify about the auto-fix:

1. Extract the PR number, branch name, and base branch from the context provided
2. Use gh CLI to create a comment with the fix information
3. Include a link to create a pull request from the fix branch

Use this command format (replace placeholders with actual values):
```bash
gh pr comment PR_NUMBER --body "## 🤖 CI Auto-Fix Available

Claude has analyzed the CI failures and prepared fixes.

[**→ Create pull request to fix CI**](https://github.com/OWNER/REPO/compare/BASE_BRANCH...FIX_BRANCH?quick_pull=1)

_This fix was generated automatically based on the failed CI run._"
```

## Step 6: Verify Fixes Locally

Run available verification commands:

- Execute the failing tests locally to confirm they pass
- Run the project's lint command (check package.json for scripts)
- Run type checking if available
- Execute any build commands to ensure compilation succeeds

## Important Guidelines

- Focus exclusively on fixing the reported CI failures
- Maintain code quality and follow the project's established patterns
- If a fix requires significant refactoring, document why it's necessary
- When multiple solutions exist, choose the simplest one that maintains code quality

Begin by analyzing the failure details provided above.
