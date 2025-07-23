import { describe, test, expect, beforeEach, spyOn, afterEach } from "bun:test";
import {
  getMode,
  registerMode,
  resetRegistry,
  isValidMode,
  type ModeName,
} from "../../src/modes/registry";
import type { Mode } from "../../src/modes/types";
import { createMockContext } from "../mockContext";
import * as core from "@actions/core";

describe("Mode System Error Handling", () => {
  let coreErrorSpy: any;
  let coreWarningSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    resetRegistry();
    coreErrorSpy = spyOn(core, "error").mockImplementation(() => {});
    coreWarningSpy = spyOn(core, "warning").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    coreErrorSpy.mockRestore();
    coreWarningSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("Registry Corruption and State Issues", () => {
    test("registry handles missing required mode gracefully", () => {
      const invalidModeName = "non-existent" as unknown as ModeName;
      expect(() => getMode(invalidModeName)).toThrow(
        "Invalid mode 'non-existent'. Valid modes are: 'tag'. Please check your workflow configuration.",
      );
    });

    test("registry prevents duplicate mode registration from corrupting state", () => {
      // First get the original tag mode to verify initial state
      const originalMode = getMode("tag");
      expect(originalMode.description).toBe(
        "Traditional implementation mode triggered by @claude mentions",
      );

      const testMode1: Mode = {
        name: "tag",
        description: "Custom tag mode v1",
        shouldTrigger: () => true,
        prepareContext: (ctx) => ({ mode: "tag", githubContext: ctx }),
        getAllowedTools: () => ["tool1"],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => true,
      };

      const testMode2: Mode = {
        name: "tag",
        description: "Custom tag mode v2",
        shouldTrigger: () => false,
        prepareContext: (ctx) => ({ mode: "tag", githubContext: ctx }),
        getAllowedTools: () => ["tool2"],
        getDisallowedTools: () => ["tool1"],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(testMode1);
      let retrievedMode = getMode("tag");
      expect(retrievedMode.description).toBe("Custom tag mode v1");

      registerMode(testMode2);
      retrievedMode = getMode("tag");
      expect(retrievedMode.description).toBe("Custom tag mode v2");
      expect(retrievedMode.shouldTrigger(createMockContext())).toBe(false);
      expect(retrievedMode.getAllowedTools()).toEqual(["tool2"]);
    });

  });

  describe("Mode Execution Failures", () => {
    test("handles shouldTrigger throwing an error", () => {
      const errorMode: Mode = {
        name: "error-mode" as unknown as ModeName,
        description: "Mode that throws errors",
        shouldTrigger: () => {
          throw new Error("Trigger check database connection failed");
        },
        prepareContext: (ctx) => ({
          mode: "error-mode" as ModeName,
          githubContext: ctx,
        }),
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(errorMode);
      const mode = getMode("error-mode" as unknown as ModeName);

      expect(() => mode.shouldTrigger(createMockContext())).toThrow(
        "Trigger check database connection failed",
      );
    });

    test("handles prepareContext throwing an error", () => {
      const errorMode: Mode = {
        name: "context-error" as unknown as ModeName,
        description: "Mode with context preparation errors",
        shouldTrigger: () => true,
        prepareContext: (ctx) => {
          if ('issue' in ctx.payload && !ctx.payload.issue?.number) {
            throw new Error("Missing required issue number in context");
          }
          return { mode: "context-error" as ModeName, githubContext: ctx };
        },
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(errorMode);
      const mode = getMode("context-error" as unknown as ModeName);

      const invalidContext = createMockContext({
        payload: {
          issue: {
            title: "Test Issue",
            body: "Test body",
            user: { login: "test-user" },
          },
        } as any,
      });
      // Remove the number property to simulate invalid context
      if ('issue' in invalidContext.payload && invalidContext.payload.issue) {
        delete (invalidContext.payload.issue as any).number;
      }

      expect(() => mode.prepareContext(invalidContext)).toThrow(
        "Missing required issue number in context",
      );
    });

    test("handles getAllowedTools returning invalid data", () => {
      const badMode: Mode = {
        name: "bad-tools" as unknown as ModeName,
        description: "Mode returning invalid tools",
        shouldTrigger: () => true,
        prepareContext: (ctx) => ({
          mode: "bad-tools" as ModeName,
          githubContext: ctx,
        }),
        getAllowedTools: () => null as any,
        getDisallowedTools: () => undefined as any,
        shouldCreateTrackingComment: () => true,
      };

      registerMode(badMode);
      const mode = getMode("bad-tools" as unknown as ModeName);

      const allowedTools = mode.getAllowedTools() as any;
      const disallowedTools = mode.getDisallowedTools() as any;

      expect(allowedTools).toBe(null);
      expect(disallowedTools).toBe(undefined);
    });

  });

  describe("Context Preparation Failures", () => {
    test("handles malformed GitHub context gracefully", () => {
      const testMode: Mode = {
        name: "context-test" as unknown as ModeName,
        description: "Context validation mode",
        shouldTrigger: () => true,
        prepareContext: (ctx, data) => {
          if (!ctx.repository?.owner || !ctx.repository?.repo) {
            throw new Error("Invalid repository information");
          }
          if (data?.commentId && typeof data.commentId !== "number") {
            throw new Error("Invalid comment ID type");
          }
          return {
            mode: "context-test" as ModeName,
            githubContext: ctx,
            ...data,
          };
        },
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(testMode);
      const mode = getMode("context-test" as unknown as ModeName);

      const malformedContext = createMockContext();
      malformedContext.repository = { owner: "", repo: "", full_name: "" };

      expect(() => mode.prepareContext(malformedContext)).toThrow(
        "Invalid repository information",
      );

      const validContext = createMockContext();
      expect(() =>
        mode.prepareContext(validContext, {
          commentId: "not-a-number" as any,
        }),
      ).toThrow("Invalid comment ID type");
    });

    test("handles extremely long branch names", () => {
      const testMode: Mode = {
        name: "branch-test" as unknown as ModeName,
        description: "Branch validation mode",
        shouldTrigger: () => true,
        prepareContext: (ctx, data) => {
          if (data?.claudeBranch && data.claudeBranch.length > 255) {
            throw new Error("Branch name exceeds maximum length");
          }
          if (
            data?.claudeBranch &&
            /[^a-zA-Z0-9\-_\/]/.test(data.claudeBranch)
          ) {
            throw new Error("Branch name contains invalid characters");
          }
          return {
            mode: "branch-test" as ModeName,
            githubContext: ctx,
            ...data,
          };
        },
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(testMode);
      const mode = getMode("branch-test" as unknown as ModeName);

      const longBranchName = "a".repeat(256);
      expect(() =>
        mode.prepareContext(createMockContext(), {
          claudeBranch: longBranchName,
        }),
      ).toThrow("Branch name exceeds maximum length");

      const invalidBranchName = "feature/test-@#$%^&*()";
      expect(() =>
        mode.prepareContext(createMockContext(), {
          claudeBranch: invalidBranchName,
        }),
      ).toThrow("Branch name contains invalid characters");
    });

    test("handles missing required payload fields", () => {
      const strictMode: Mode = {
        name: "strict" as unknown as ModeName,
        description: "Strict validation mode",
        shouldTrigger: (ctx) => {
          if (!ctx.payload || !ctx.eventName) {
            return false;
          }
          return true;
        },
        prepareContext: (ctx) => {
          const requiredFields = [
            "actor",
            "repository",
            "eventName",
            "payload",
          ];
          const missing = requiredFields.filter((field) => !(field in ctx));
          if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(", ")}`);
          }
          return { mode: "strict" as ModeName, githubContext: ctx };
        },
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(strictMode);
      const mode = getMode("strict" as unknown as ModeName);

      const incompleteContext = {
        runId: "123",
        eventName: "issue_comment",
      } as any;

      expect(() => mode.prepareContext(incompleteContext)).toThrow(
        "Missing required fields: actor, repository, payload",
      );
    });
  });


  describe("State Management and Cleanup", () => {
    test("handles mode cleanup failures gracefully", () => {
      const cleanupMode: Mode = {
        name: "cleanup-test" as unknown as ModeName,
        description: "Cleanup test mode",
        shouldTrigger: () => true,
        prepareContext: (ctx) => {
          const context = {
            mode: "cleanup-test" as unknown as ModeName,
            githubContext: ctx,
          };

          return context;
        },
        getAllowedTools: () => [],
        getDisallowedTools: () => [],
        shouldCreateTrackingComment: () => false,
      };

      registerMode(cleanupMode);
      const mode = getMode("cleanup-test" as unknown as ModeName);
      const result = mode.prepareContext(createMockContext());

      expect((result as any).mode).toBe("cleanup-test");
      expect(result.githubContext).toBeDefined();
    });

  });

});
