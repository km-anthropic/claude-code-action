# Test with Origin's v1-dev Branch

This PR tests the auto-review workflow using:
- Origin's v1-dev branch (anthropics/claude-code-action@v1-dev)
- Context prefixing that was recently added
- No explicit PR number in prompt

## Expected Behavior

Claude should:
1. Automatically detect PR #62 from GitHub context
2. Use MCP tools to create a pending review
3. Add review comments with feedback
4. Submit the review as COMMENT (not APPROVE)

## Testing

The workflow should work without specifying the PR number explicitly.