import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import {
  getMode,
  registerMode,
  resetRegistry,
  type ModeName,
} from "../../src/modes/registry";
import { tagMode } from "../../src/modes/tag";
import { checkContainsTrigger } from "../../src/github/validation/trigger";
import type { Mode } from "../../src/modes/types";
import { createMockContext } from "../mockContext";
import * as core from "@actions/core";

describe("Mode System Integration Tests", () => {
  let coreInfoSpy: any;
  let coreErrorSpy: any;

  beforeEach(() => {
    resetRegistry();
    coreInfoSpy = spyOn(core, "info").mockImplementation(() => {});
    coreErrorSpy = spyOn(core, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    coreInfoSpy.mockRestore();
    coreErrorSpy.mockRestore();
  });

  describe("End-to-End Mode Flow", () => {
    test("complete flow from GitHub event to mode execution", async () => {
      const mockContext = createMockContext({
        eventName: "issue_comment",
        eventAction: "created",
        isPR: false,
        inputs: {
          ...createMockContext().inputs,
          mode: "tag",
          triggerPhrase: "@claude",
          directPrompt: "",
        },
        payload: {
          action: "created",
          issue: {
            number: 123,
            title: "Bug: Application crashes",
            body: "The app crashes when clicking the submit button",
            user: { login: "user123" },
          },
          comment: {
            id: 456,
            body: "@claude can you help fix this bug?",
            user: { login: "reviewer" },
            html_url:
              "https://github.com/test/repo/issues/123#issuecomment-456",
          },
        } as any,
      });

      const mode = getMode("tag");
      expect(mode.shouldTrigger(mockContext)).toBe(true);

      const modeContext = mode.prepareContext(mockContext, {
        commentId: 456,
        baseBranch: "main",
        claudeBranch: "claude/fix-bug-123",
      });

      expect(modeContext.mode).toBe("tag");
      expect(modeContext.commentId).toBe(456);
      expect(modeContext.baseBranch).toBe("main");
      expect(modeContext.claudeBranch).toBe("claude/fix-bug-123");

      const allowedTools = mode.getAllowedTools();
      const disallowedTools = mode.getDisallowedTools();
      expect(Array.isArray(allowedTools)).toBe(true);
      expect(Array.isArray(disallowedTools)).toBe(true);

      const shouldCreateComment = mode.shouldCreateTrackingComment();
      expect(shouldCreateComment).toBe(true);
    });

    test("mode selection based on input parameter", () => {
      const contextWithTag = createMockContext({
        inputs: {
          ...createMockContext().inputs,
          mode: "tag",
        },
      });

      const mode = getMode(contextWithTag.inputs.mode as ModeName);
      expect(mode.name).toBe("tag");
      expect(mode).toBe(tagMode);
    });

    test("trigger validation integration with modes", () => {
      const contexts = [
        {
          name: "comment trigger",
          context: createMockContext({
            eventName: "issue_comment",
            inputs: {
              ...createMockContext().inputs,
              triggerPhrase: "@claude",
            },
            payload: {
              comment: { body: "Hey @claude, please help" },
            } as any,
          }),
          expected: true,
        },
        {
          name: "assignee trigger",
          context: createMockContext({
            eventName: "issues",
            eventAction: "assigned",
            inputs: {
              ...createMockContext().inputs,
              assigneeTrigger: "claude-bot",
            },
            payload: {
              action: "assigned",
              assignee: { login: "claude-bot" },
            } as any,
          }),
          expected: true,
        },
        {
          name: "label trigger",
          context: createMockContext({
            eventName: "issues",
            eventAction: "labeled",
            inputs: {
              ...createMockContext().inputs,
              labelTrigger: "needs-claude",
            },
            payload: {
              action: "labeled",
              label: { name: "needs-claude" },
            } as any,
          }),
          expected: true,
        },
        {
          name: "no trigger",
          context: createMockContext({
            eventName: "issue_comment",
            inputs: {
              ...createMockContext().inputs,
              triggerPhrase: "@claude",
            },
            payload: {
              comment: { body: "Just a regular comment" },
            } as any,
          }),
          expected: false,
        },
      ];

      contexts.forEach(({ context, expected }) => {
        const result = checkContainsTrigger(context);
        expect(result).toBe(expected);

        const mode = getMode("tag");
        expect(mode.shouldTrigger(context)).toBe(expected);
      });
    });
  });


  describe("Mode Integration with Context Preparation", () => {
    test("mode context preparation with different data types", () => {
      const mode = getMode("tag");

      const contextWithAllData = mode.prepareContext(createMockContext(), {
        commentId: 789,
        baseBranch: "main",
        claudeBranch: "claude/feature",
      });

      expect(contextWithAllData.mode).toBe("tag");
      expect(contextWithAllData.commentId).toBe(789);
      expect(contextWithAllData.baseBranch).toBe("main");
      expect(contextWithAllData.claudeBranch).toBe("claude/feature");

      const contextWithPartialData = mode.prepareContext(createMockContext(), {
        commentId: 456,
      });

      expect(contextWithPartialData.mode).toBe("tag");
      expect(contextWithPartialData.commentId).toBe(456);
      expect(contextWithPartialData.baseBranch).toBeUndefined();
      expect(contextWithPartialData.claudeBranch).toBeUndefined();
    });

    test("mode tool configuration integration", () => {
      const toolMode: Mode = {
        name: "tool-mode" as unknown as ModeName,
        description: "Mode for testing tool configuration",
        shouldTrigger: () => true,
        prepareContext: (ctx) => ({
          mode: "tool-mode" as ModeName,
          githubContext: ctx,
        }),
        getAllowedTools: () => ["Read", "Write", "Edit"],
        getDisallowedTools: () => ["Bash", "WebSearch"],
        shouldCreateTrackingComment: () => true,
      };

      registerMode(toolMode);
      const mode = getMode("tool-mode" as unknown as ModeName) as any;

      const allowedTools = mode.getAllowedTools();
      const disallowedTools = mode.getDisallowedTools();
      const shouldCreateComment = mode.shouldCreateTrackingComment();

      expect(allowedTools).toEqual(["Read", "Write", "Edit"]);
      expect(disallowedTools).toEqual(["Bash", "WebSearch"]);
      expect(shouldCreateComment).toBe(true);

      const context = mode.prepareContext(createMockContext());
      expect(context.mode).toBe("tool-mode");
    });

    test("mode system handles context with different GitHub event types", () => {
      const mode = getMode("tag");

      const issueContext = createMockContext({
        eventName: "issues",
        eventAction: "opened",
        isPR: false,
      });

      const prContext = createMockContext({
        eventName: "pull_request",
        eventAction: "opened",
        isPR: true,
      });

      const commentContext = createMockContext({
        eventName: "issue_comment",
        eventAction: "created",
        isPR: false,
      });

      expect(mode.prepareContext(issueContext).mode).toBe("tag");
      expect(mode.prepareContext(prContext).mode).toBe("tag");
      expect(mode.prepareContext(commentContext).mode).toBe("tag");

      expect(mode.prepareContext(issueContext).githubContext).toBe(
        issueContext,
      );
      expect(mode.prepareContext(prContext).githubContext).toBe(prContext);
      expect(mode.prepareContext(commentContext).githubContext).toBe(
        commentContext,
      );
    });
  });

  describe("Error Propagation Through Integration", () => {
    test("mode errors propagate to action workflow", async () => {
      const errorMode: Mode = {
        name: "error-integration" as unknown as ModeName,
        description: "Mode that errors during integration",
        shouldTrigger: () => {
          throw new Error("Trigger check failed");
        },
        prepareContext: (ctx) => ({
          mode: "error-integration" as ModeName,
          githubContext: ctx,
        }),
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(errorMode);
      const mode = getMode("error-integration" as unknown as ModeName);

      const mockContext = createMockContext({
        inputs: {
          ...createMockContext().inputs,
          mode: "error-integration" as any,
        },
      });

      expect(() => mode.shouldTrigger(mockContext)).toThrow(
        "Trigger check failed",
      );
      expect(coreErrorSpy).not.toHaveBeenCalled();
    });

  });


  describe("Mode Compatibility and Migration", () => {
    test("mode system maintains backward compatibility", () => {
      const legacyContext = createMockContext({
        eventName: "issue_comment",
        inputs: {
          ...createMockContext().inputs,
          mode: "tag",
          triggerPhrase: "@claude",
        },
        payload: {
          comment: { body: "@claude help" },
        } as any,
      });

      const mode = getMode("tag");
      const shouldTriggerOld = checkContainsTrigger(legacyContext);
      const shouldTriggerNew = mode.shouldTrigger(legacyContext);

      expect(shouldTriggerOld).toBe(shouldTriggerNew);
      expect(shouldTriggerNew).toBe(true);
    });

    test("mode system handles missing optional features", () => {
      const minimalMode: Mode = {
        name: "minimal" as unknown as ModeName,
        description: "Minimal mode implementation",
        shouldTrigger: () => true,
        prepareContext: (ctx, data) => ({
          mode: "minimal" as ModeName,
          githubContext: ctx,
          ...data,
        }),
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(minimalMode);
      const mode = getMode("minimal" as unknown as ModeName);

      const context = mode.prepareContext(createMockContext());
      expect(context.commentId).toBeUndefined();
      expect(context.baseBranch).toBeUndefined();
      expect(context.claudeBranch).toBeUndefined();

      const contextWithData = mode.prepareContext(createMockContext(), {
        commentId: 123,
        unknownField: "ignored",
      } as any);
      expect(contextWithData.commentId).toBe(123);
      expect((contextWithData as any).unknownField).toBe("ignored");
    });
  });
});
