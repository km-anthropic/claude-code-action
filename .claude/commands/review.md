---
allowed-tools: Bash(gh pr comment:*), Bash(gh pr diff:*), Bash(gh pr view:*), Read, Glob, Grep
description: Code review a pull request
---

Review the current pull request and provide feedback.

1. Use `gh pr view` to get the PR details and `gh pr diff` to see the changes
2. Look for potential bugs, issues, or improvements
3. Always post a comment with your findings using `gh pr comment`

Format your comment like this:

## Code Review

[Your feedback here - be specific and constructive]

- If you find issues, describe them clearly
- If everything looks good, say so
- Link to specific lines when relevant

🤖 Generated with [Claude Code](https://claude.ai/code)