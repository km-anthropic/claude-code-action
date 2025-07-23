import { describe, test, expect, beforeEach } from "bun:test";
import { tagMode } from "../../src/modes/tag";
import { resetRegistry } from "../../src/modes/registry";
import type { ParsedGitHubContext } from "../../src/github/context";
import type {
  IssueCommentEvent,
  IssuesEvent,
} from "@octokit/webhooks-types";
import { createMockContext } from "../mockContext";

describe("Tag Mode", () => {
  let mockContext: ParsedGitHubContext;

  beforeEach(() => {
    resetRegistry();
    mockContext = createMockContext({
      eventName: "issue_comment",
      isPR: false,
    });
  });

  test("tag mode has correct properties", () => {
    expect(tagMode.name).toBe("tag");
    expect(tagMode.description).toBe(
      "Traditional implementation mode triggered by @claude mentions",
    );
    expect(tagMode.shouldCreateTrackingComment()).toBe(true);
  });

  test("shouldTrigger delegates to checkContainsTrigger", () => {
    const contextWithTrigger = createMockContext({
      eventName: "issue_comment",
      isPR: false,
      inputs: {
        ...createMockContext().inputs,
        triggerPhrase: "@claude",
      },
      payload: {
        comment: {
          body: "Hey @claude, can you help?",
        },
      } as IssueCommentEvent,
    });

    expect(tagMode.shouldTrigger(contextWithTrigger)).toBe(true);

    const contextWithoutTrigger = createMockContext({
      eventName: "issue_comment",
      isPR: false,
      inputs: {
        ...createMockContext().inputs,
        triggerPhrase: "@claude",
      },
      payload: {
        comment: {
          body: "This is just a regular comment",
        },
      } as IssueCommentEvent,
    });

    expect(tagMode.shouldTrigger(contextWithoutTrigger)).toBe(false);
  });

  test("prepareContext includes all required data", () => {
    const data = {
      commentId: 123,
      baseBranch: "main",
      claudeBranch: "claude/fix-bug",
    };

    const context = tagMode.prepareContext(mockContext, data);

    expect(context.mode).toBe("tag");
    expect(context.githubContext).toBe(mockContext);
    expect(context.commentId).toBe(123);
    expect(context.baseBranch).toBe("main");
    expect(context.claudeBranch).toBe("claude/fix-bug");
  });

  test("prepareContext works without data", () => {
    const context = tagMode.prepareContext(mockContext);

    expect(context.mode).toBe("tag");
    expect(context.githubContext).toBe(mockContext);
    expect(context.commentId).toBeUndefined();
    expect(context.baseBranch).toBeUndefined();
    expect(context.claudeBranch).toBeUndefined();
  });

  test("getAllowedTools returns empty array", () => {
    expect(tagMode.getAllowedTools()).toEqual([]);
  });

  test("getDisallowedTools returns empty array", () => {
    expect(tagMode.getDisallowedTools()).toEqual([]);
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("shouldTrigger handles different event types", () => {
      const issueAssignedContext = createMockContext({
        eventName: "issues",
        eventAction: "assigned",
        isPR: false,
        inputs: {
          ...createMockContext().inputs,
          assigneeTrigger: "claude-bot",
        },
        payload: {
          action: "assigned",
          assignee: { login: "claude-bot" },
          issue: {
            number: 1,
            title: "Test Issue",
            body: "Test body",
            user: { login: "test-user" },
          },
        } as IssuesEvent,
      });
      expect(tagMode.shouldTrigger(issueAssignedContext)).toBe(true);

      const issueLabeledContext = createMockContext({
        eventName: "issues",
        eventAction: "labeled",
        isPR: false,
        inputs: {
          ...createMockContext().inputs,
          labelTrigger: "claude-help",
        },
        payload: {
          action: "labeled",
          label: { name: "claude-help" },
          issue: {
            number: 1,
            title: "Test Issue",
            body: "Test body",
            user: { login: "test-user" },
          },
        } as IssuesEvent,
      });
      expect(tagMode.shouldTrigger(issueLabeledContext)).toBe(true);

      const prReviewContext = createMockContext({
        eventName: "pull_request_review_comment",
        eventAction: "created",
        isPR: true,
        inputs: {
          ...createMockContext().inputs,
          triggerPhrase: "@claude",
        },
        payload: {
          action: "created",
          comment: {
            body: "@claude please review this change",
            user: { login: "reviewer" },
          },
          pull_request: {
            number: 1,
            title: "Test PR",
            body: "Test PR body",
            user: { login: "test-user" },
          },
        } as any,
      });
      expect(tagMode.shouldTrigger(prReviewContext)).toBe(true);
    });

    test("shouldTrigger handles malformed trigger phrases", () => {
      const specialCharsContext = createMockContext({
        eventName: "issue_comment",
        isPR: false,
        inputs: {
          ...createMockContext().inputs,
          triggerPhrase: "@claude[bot]",
        },
        payload: {
          comment: {
            body: "Hey @claude[bot], can you help?",
          },
        } as IssueCommentEvent,
      });
      expect(tagMode.shouldTrigger(specialCharsContext)).toBe(true);

      const unicodeContext = createMockContext({
        eventName: "issue_comment",
        isPR: false,
        inputs: {
          ...createMockContext().inputs,
          triggerPhrase: "@claude🤖",
        },
        payload: {
          comment: {
            body: "Hey @claude🤖, can you help?",
          },
        } as IssueCommentEvent,
      });
      expect(tagMode.shouldTrigger(unicodeContext)).toBe(true);
    });

    test("shouldTrigger handles empty or null values", () => {
      const emptyCommentContext = createMockContext({
        eventName: "issue_comment",
        isPR: false,
        payload: {
          comment: {
            body: "",
          },
        } as IssueCommentEvent,
      });
      expect(tagMode.shouldTrigger(emptyCommentContext)).toBe(false);

      const nullCommentContext = createMockContext({
        eventName: "issue_comment",
        isPR: false,
        payload: {
          comment: {
            body: null as any,
          },
        } as IssueCommentEvent,
      });
      expect(tagMode.shouldTrigger(nullCommentContext)).toBe(false);

      const undefinedCommentContext = createMockContext({
        eventName: "issue_comment",
        isPR: false,
        payload: {
          comment: {} as any,
        } as IssueCommentEvent,
      });
      expect(tagMode.shouldTrigger(undefinedCommentContext)).toBe(false);
    });

    test("prepareContext handles invalid data types", () => {
      const stringCommentId = tagMode.prepareContext(mockContext, {
        commentId: 123,
        baseBranch: "main",
        claudeBranch: "claude/fix",
      });
      expect(stringCommentId.commentId).toBe(123);

      const objectCommentId = tagMode.prepareContext(mockContext, {
        commentId: 456,
        baseBranch: "main",
        claudeBranch: "claude/fix",
      });
      expect(objectCommentId.commentId).toBe(456);

      const nullData = tagMode.prepareContext(mockContext, null as any);
      expect(nullData.commentId).toBeUndefined();
      expect(nullData.baseBranch).toBeUndefined();
      expect(nullData.claudeBranch).toBeUndefined();
    });

    test("prepareContext handles extremely long branch names", () => {
      const longBranchName = "a".repeat(300);
      const context = tagMode.prepareContext(mockContext, {
        commentId: 123,
        baseBranch: longBranchName,
        claudeBranch: `claude/${longBranchName}`,
      });
      expect(context.baseBranch).toBe(longBranchName);
      expect(context.claudeBranch).toBe(`claude/${longBranchName}`);
    });

    test("prepareContext handles special characters in branch names", () => {
      const realBranches = [
        "feature/test-123",
        "bugfix/issue-#123",
        "release/v1.0.0",
        "feature/test_with_underscores",
        "feature/test with spaces",
      ];

      realBranches.forEach((branch) => {
        const context = tagMode.prepareContext(mockContext, {
          commentId: 123,
          baseBranch: branch,
          claudeBranch: `claude/${branch}`,
        });
        expect(context.baseBranch).toBe(branch);
        expect(context.claudeBranch).toBe(`claude/${branch}`);
      });
    });

    test("prepareContext preserves context reference", () => {
      const context1 = tagMode.prepareContext(mockContext);
      const context2 = tagMode.prepareContext(mockContext);

      expect(context1.githubContext).toBe(mockContext);
      expect(context2.githubContext).toBe(mockContext);
      expect(context1.githubContext).toBe(context2.githubContext);
    });

    test("prepareContext handles partial data correctly", () => {
      const onlyCommentId = tagMode.prepareContext(mockContext, {
        commentId: 456,
      });
      expect(onlyCommentId.commentId).toBe(456);
      expect(onlyCommentId.baseBranch).toBeUndefined();
      expect(onlyCommentId.claudeBranch).toBeUndefined();

      const onlyBranches = tagMode.prepareContext(mockContext, {
        baseBranch: "develop",
        claudeBranch: "claude/feature",
      });
      expect(onlyBranches.commentId).toBeUndefined();
      expect(onlyBranches.baseBranch).toBe("develop");
      expect(onlyBranches.claudeBranch).toBe("claude/feature");
    });


    test("shouldTrigger with complex markdown content", () => {
      const markdownContext = createMockContext({
        eventName: "issue_comment",
        isPR: false,
        inputs: {
          ...createMockContext().inputs,
          triggerPhrase: "@claude",
        },
        payload: {
          comment: {
            body: `
              ## Complex Markdown
              
              \`\`\`javascript
              // @claude is mentioned in code
              console.log("@claude");
              \`\`\`
              
              But @claude is also mentioned outside code blocks.
              
              > @claude in a quote
              
              - @claude in a list
              
              | Header | Value |
              |--------|-------|
              | Mention | @claude |
            `,
          },
        } as IssueCommentEvent,
      });
      expect(tagMode.shouldTrigger(markdownContext)).toBe(true);
    });

    test("shouldTrigger with HTML in comments", () => {
      const htmlContext = createMockContext({
        eventName: "issue_comment",
        isPR: false,
        inputs: {
          ...createMockContext().inputs,
          triggerPhrase: "@claude",
        },
        payload: {
          comment: {
            body: `
              <div>@claude</div>
              <script>alert('@claude')</script>
              <img src="x" onerror="@claude">
              <!-- @claude in HTML comment -->
              &lt;@claude&gt;
            `,
          },
        } as IssueCommentEvent,
      });
      expect(tagMode.shouldTrigger(htmlContext)).toBe(true);
    });

    test("mode methods are immutable", () => {
      const originalGetAllowedTools = tagMode.getAllowedTools;
      const originalGetDisallowedTools = tagMode.getDisallowedTools;
      const originalShouldCreateTrackingComment =
        tagMode.shouldCreateTrackingComment;

      tagMode.getAllowedTools();
      tagMode.getDisallowedTools();
      tagMode.shouldCreateTrackingComment();

      expect(tagMode.getAllowedTools).toBe(originalGetAllowedTools);
      expect(tagMode.getDisallowedTools).toBe(originalGetDisallowedTools);
      expect(tagMode.shouldCreateTrackingComment).toBe(
        originalShouldCreateTrackingComment,
      );
    });

    test("prepareContext with frozen objects", () => {
      const frozenData = Object.freeze({
        commentId: 789,
        baseBranch: "frozen-main",
        claudeBranch: "claude/frozen-feature",
      });

      const context = tagMode.prepareContext(mockContext, frozenData);
      expect(context.commentId).toBe(789);
      expect(context.baseBranch).toBe("frozen-main");
      expect(context.claudeBranch).toBe("claude/frozen-feature");
    });

  });
});
