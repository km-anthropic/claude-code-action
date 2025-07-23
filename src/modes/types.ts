import type { ParsedGitHubContext } from "../github/context";
import type { ModeName } from "./registry";

export type ModeContext = {
  mode: ModeName;
  githubContext: ParsedGitHubContext;
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
 * Future modes might include:
 * - 'review': Optimized for code reviews without tracking comments
 * - 'freeform': For automation with no trigger checking
 */
export type Mode = {
  name: ModeName;
  description: string;

  /**
   * Determines if this mode should trigger based on the GitHub context
   */
  shouldTrigger(context: ParsedGitHubContext): boolean;

  /**
   * Prepares the mode context with any additional data needed for prompt generation
   */
  prepareContext(context: ParsedGitHubContext, data?: ModeData): ModeContext;

  /**
   * Returns additional tools that should be allowed for this mode
   * (base GitHub tools are always included)
   */
  getAllowedTools(): string[];

  /**
   * Returns tools that should be disallowed for this mode
   */
  getDisallowedTools(): string[];

  /**
   * Determines if this mode should create a tracking comment
   */
  shouldCreateTrackingComment(): boolean;
};
