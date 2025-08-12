# Test: Slash Command Review

This PR tests the new `/review` slash command that:

1. Uses the comprehensive multi-agent review process
2. Posts reviews using `gh pr comment`
3. Works with the simplified workflow configuration

## Changes
- Updated README title for testing
- Added this test file

## Expected Behavior
Claude should:
- Execute the `/review` command from `.claude/commands/review.md`
- Use multiple agents to analyze the PR
- Score issues and filter by 80+ confidence
- Post a formatted review comment