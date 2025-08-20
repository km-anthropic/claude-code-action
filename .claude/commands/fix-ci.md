---
description: Analyze and fix CI failures by examining logs and making targeted fixes
allowed_tools: Edit,MultiEdit,Write,Read,Glob,Grep,LS,Bash(git:*),Bash(bun:*),Bash(npm:*),Bash(npx:*)
---

# Fix CI Failures

You are tasked with analyzing CI failure logs and fixing the issues. Follow these steps:

## Context Provided

$ARGUMENTS

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
4. Push the branch: `git push origin HEAD`
5. If there's a PR number in the arguments, post a comment about the fixes

## Step 5: Verify Fixes Locally

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
