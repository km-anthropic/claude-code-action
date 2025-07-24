import { describe, test, expect, beforeEach } from "bun:test";
import { agentMode } from "../../src/modes/agent";
import type { ParsedGitHubContext } from "../../src/github/context";
import { createMockContext } from "../mockContext";

describe("Agent Mode", () => {
  let mockContext: ParsedGitHubContext;

  beforeEach(() => {
    mockContext = createMockContext({
      eventName: "workflow_dispatch",
      isPR: false,
    });
  });

  test("agent mode has correct properties and behavior", () => {
    // Basic properties
    expect(agentMode.name).toBe("agent");
    expect(agentMode.description).toBe(
      "Automation mode that always runs without trigger checking",
    );
    // Default context should create tracking comment
    expect(agentMode.shouldCreateTrackingComment(mockContext)).toBe(false); // workflow_dispatch doesn't create comments

    // Tool methods return empty arrays
    expect(agentMode.getAllowedTools()).toEqual([]);
    expect(agentMode.getDisallowedTools()).toEqual([]);

    // Always triggers regardless of context
    const contextWithoutTrigger = createMockContext({
      eventName: "workflow_dispatch",
      isPR: false,
      inputs: {
        ...createMockContext().inputs,
        triggerPhrase: "@claude",
      },
      payload: {} as any,
    });
    expect(agentMode.shouldTrigger(contextWithoutTrigger)).toBe(true);
  });

  test("prepareContext includes all required data", () => {
    const data = {
      commentId: 789,
      baseBranch: "develop",
      claudeBranch: "claude/automated-task",
    };

    const context = agentMode.prepareContext(mockContext, data);

    expect(context.mode).toBe("agent");
    expect(context.githubContext).toBe(mockContext);
    expect(context.commentId).toBe(789);
    expect(context.baseBranch).toBe("develop");
    expect(context.claudeBranch).toBe("claude/automated-task");
  });

  test("prepareContext works without data", () => {
    const context = agentMode.prepareContext(mockContext);

    expect(context.mode).toBe("agent");
    expect(context.githubContext).toBe(mockContext);
    expect(context.commentId).toBeUndefined();
    expect(context.baseBranch).toBeUndefined();
    expect(context.claudeBranch).toBeUndefined();
  });

  test("agent mode triggers for all event types", () => {
    const events = [
      "push",
      "schedule",
      "workflow_dispatch",
      "repository_dispatch",
      "issue_comment",
      "pull_request",
    ];

    events.forEach((eventName) => {
      const context = createMockContext({ eventName, isPR: false });
      expect(agentMode.shouldTrigger(context)).toBe(true);
    });
  });

  test("shouldCreateTrackingComment returns false for workflow_dispatch and schedule", () => {
    const workflowDispatchContext = createMockContext({
      eventName: "workflow_dispatch",
      isPR: false,
    });
    expect(agentMode.shouldCreateTrackingComment(workflowDispatchContext)).toBe(
      false,
    );

    const scheduleContext = createMockContext({
      eventName: "schedule",
      isPR: false,
    });
    expect(agentMode.shouldCreateTrackingComment(scheduleContext)).toBe(false);
  });

  test("shouldCreateTrackingComment returns true for other events", () => {
    const issueContext = createMockContext({
      eventName: "issues",
      isPR: false,
    });
    expect(agentMode.shouldCreateTrackingComment(issueContext)).toBe(true);

    const prContext = createMockContext({
      eventName: "pull_request",
      isPR: true,
    });
    expect(agentMode.shouldCreateTrackingComment(prContext)).toBe(true);

    const commentContext = createMockContext({
      eventName: "issue_comment",
      isPR: false,
    });
    expect(agentMode.shouldCreateTrackingComment(commentContext)).toBe(true);
  });
});
