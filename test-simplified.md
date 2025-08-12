# Test Simplified Workflow

This PR tests the simplified auto-review workflow that:

1. Uses `anthropics/claude-code-action@v1-dev` directly
2. Doesn't explicitly specify PR number in prompt
3. Relies on agent mode's context prefixing to provide PR details

## Expected Behavior

Claude should:
- Automatically detect the correct PR number from context
- Post a comprehensive review
- Submit as COMMENT (not APPROVE)