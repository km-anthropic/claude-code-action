import * as core from "@actions/core";
import { mkdir, writeFile } from "fs/promises";
import type { Mode, ModeOptions, ModeResult } from "../types";
import type { PreparedContext } from "../../create-prompt/types";

/**
 * Agent mode implementation.
 *
 * This mode runs whenever an explicit prompt is provided in the workflow configuration.
 * It bypasses the standard @claude mention checking and comment tracking used by tag mode,
 * providing direct access to Claude Code for automation workflows.
 */
export const agentMode: Mode = {
  name: "agent",
  description: "Direct automation mode for explicit prompts",

  shouldTrigger(context) {
    // Only trigger when an explicit prompt is provided
    return !!context.inputs?.prompt;
  },

  prepareContext(context) {
    // Agent mode doesn't use comment tracking or branch management
    return {
      mode: "agent",
      githubContext: context,
    };
  },

  getAllowedTools() {
    return [];
  },

  getDisallowedTools() {
    return [];
  },

  shouldCreateTrackingComment() {
    return false;
  },

  async prepare({ context, githubToken }: ModeOptions): Promise<ModeResult> {
    // Agent mode handles automation events and any event with explicit prompts
    
    console.log(`Agent mode: githubToken provided: ${!!githubToken}, length: ${githubToken?.length || 0}`);

    // TODO: handle by createPrompt (similar to tag and review modes)
    // Create prompt directory
    await mkdir(`${process.env.RUNNER_TEMP}/claude-prompts`, {
      recursive: true,
    });
    // Write the prompt file - the base action requires a prompt_file parameter.
    // Use the unified prompt field from v1.0.
    const promptContent =
      context.inputs.prompt ||
      `Repository: ${context.repository.owner}/${context.repository.repo}`;
    await writeFile(
      `${process.env.RUNNER_TEMP}/claude-prompts/claude-prompt.txt`,
      promptContent,
    );

    // Agent mode: User has full control via claudeArgs
    // No default tools are enforced - Claude Code's defaults will apply

    // Always include the GitHub comment server in agent mode
    // This ensures GitHub tools (PR reviews, comments, etc.) work out of the box
    // without requiring users to manually configure the MCP server
    const mcpConfig: any = {
      mcpServers: {
        github_comment: {
          command: "bun",
          args: [
            "run",
            `${process.env.GITHUB_ACTION_PATH}/src/mcp/github-comment-server.ts`,
          ],
          env: {
            GITHUB_TOKEN: githubToken || "",
            REPO_OWNER: context.repository.owner,
            REPO_NAME: context.repository.repo,
            CLAUDE_COMMENT_ID: process.env.CLAUDE_COMMENT_ID || "",
            PR_NUMBER: (context as any).entityNumber?.toString() || process.env.GITHUB_EVENT_PULL_REQUEST_NUMBER || "",
            ISSUE_NUMBER: (context as any).entityNumber?.toString() || "",
            GITHUB_EVENT_NAME: process.env.GITHUB_EVENT_NAME || "",
            GITHUB_API_URL:
              process.env.GITHUB_API_URL || "https://api.github.com",
          },
        },
      },
    };
    
    // Include inline comment server for PR contexts
    if (context.eventName === "pull_request" || context.eventName === "pull_request_review") {
      // Get PR number from the context payload
      const prNumber = (context as any).payload?.pull_request?.number || 
                      (context as any).entityNumber || 
                      "";
      
      mcpConfig.mcpServers.github_inline_comment = {
        command: "bun",
        args: [
          "run",
          `${process.env.GITHUB_ACTION_PATH}/src/mcp/github-inline-comment-server.ts`,
        ],
        env: {
          GITHUB_TOKEN: githubToken || "",
          REPO_OWNER: context.repository.owner,
          REPO_NAME: context.repository.repo,
          PR_NUMBER: prNumber.toString(),
          GITHUB_API_URL: process.env.GITHUB_API_URL || "https://api.github.com",
        },
      };
    }

    // Add user-provided additional MCP config if any
    const additionalMcpConfig = process.env.MCP_CONFIG || "";
    if (additionalMcpConfig.trim()) {
      try {
        const additional = JSON.parse(additionalMcpConfig);
        if (additional && typeof additional === "object") {
          // Merge mcpServers if both have them
          if (additional.mcpServers && mcpConfig.mcpServers) {
            Object.assign(mcpConfig.mcpServers, additional.mcpServers);
          } else {
            Object.assign(mcpConfig, additional);
          }
        }
      } catch (error) {
        core.warning(`Failed to parse additional MCP config: ${error}`);
      }
    }

    // Agent mode: pass through user's claude_args with MCP config
    const userClaudeArgs = process.env.CLAUDE_ARGS || "";
    const escapedMcpConfig = JSON.stringify(mcpConfig).replace(/'/g, "'\\''");
    const claudeArgs =
      `--mcp-config '${escapedMcpConfig}' ${userClaudeArgs}`.trim();
    core.setOutput("claude_args", claudeArgs);

    return {
      commentId: undefined,
      branchInfo: {
        baseBranch: "",
        currentBranch: "",
        claudeBranch: undefined,
      },
      mcpConfig: JSON.stringify(mcpConfig),
    };
  },

  generatePrompt(context: PreparedContext): string {
    // Agent mode uses prompt field
    if (context.prompt) {
      return context.prompt;
    }

    // Minimal fallback - repository is a string in PreparedContext
    return `Repository: ${context.repository}`;
  },

  getSystemPrompt() {
    // Agent mode doesn't need additional system prompts
    return undefined;
  },
};
