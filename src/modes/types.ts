import type { GitHubContext } from "../github/context";

export type ModeName = "tag" | "agent" | "review";

export type ModeContext = {
  mode: ModeName;
  githubContext: GitHubContext;
  commentId?: number;
  baseBranch?: string;
  claudeBranch?: string;
};

export type ModeData = {
  commentId?: number;
  baseBranch?: string;
  claudeBranch?: string;
};

/**
 * Mode interface for claude-code-action execution modes.
 * Each mode defines its own behavior for trigger detection, prompt generation,
 * and tracking comment creation.
 *
 * Current modes include:
 * - 'tag': Traditional implementation triggered by mentions/assignments
 * - 'agent': For automation with no trigger checking
 */
export type Mode = {
  name: ModeName;
  description: string;

  /**
   * Determines if this mode should trigger based on the GitHub context
   */
  shouldTrigger(context: GitHubContext): boolean;

  /**
   * Prepares the mode context with any additional data needed for prompt generation
   */
  prepareContext(context: GitHubContext, data?: ModeData): ModeContext;

  /**
   * Returns the list of tools that should be allowed for this mode
   */
  getAllowedTools(): string[];

  /**
   * Returns the list of tools that should be disallowed for this mode
   */
  getDisallowedTools(): string[];

  /**
   * Determines if this mode should create a tracking comment
   */
  shouldCreateTrackingComment(): boolean;

  /**
   * Generates a custom prompt for this mode (optional).
   * If not provided, the default prompt will be used.
   * @returns The prompt string or undefined to use default
   */
  generatePrompt?(
    context: any, // PreparedContext from create-prompt
    githubData: any, // FetchDataResult from github/data/fetcher
  ): string | undefined;

  /**
   * Prepares the GitHub environment for this mode.
   * Each mode decides how to handle different event types.
   * @returns PrepareResult with commentId, branchInfo, and mcpConfig
   */
  prepare(options: ModeOptions): Promise<ModeResult>;
};

// Define types for mode prepare method to avoid circular dependencies
export type ModeOptions = {
  context: GitHubContext;
  octokit: any; // We'll use any to avoid circular dependency with Octokits
  githubToken: string;
};

export type ModeResult = {
  commentId?: number;
  branchInfo: {
    baseBranch: string;
    claudeBranch?: string;
    currentBranch: string;
  };
  mcpConfig: string;
};
