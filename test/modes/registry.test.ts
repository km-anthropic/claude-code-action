import { describe, test, expect, beforeEach } from "bun:test";
import {
  getMode,
  isValidMode,
  registerMode,
  resetRegistry,
  type ModeName,
} from "../../src/modes/registry";
import { tagMode } from "../../src/modes/tag";
import type { Mode } from "../../src/modes/types";

describe("Mode Registry", () => {
  beforeEach(() => {
    resetRegistry();
  });
  test("getMode returns tag mode by default", () => {
    const mode = getMode("tag");
    expect(mode).toBe(tagMode);
    expect(mode.name).toBe("tag");
  });

  test("getMode throws error for invalid mode", () => {
    const invalidMode = "invalid" as unknown as ModeName;
    expect(() => getMode(invalidMode)).toThrow(
      "Invalid mode 'invalid'. Valid modes are: 'tag'. Please check your workflow configuration.",
    );
  });

  test("isValidMode returns true for tag mode", () => {
    expect(isValidMode("tag")).toBe(true);
  });

  test("isValidMode returns false for invalid mode", () => {
    expect(isValidMode("invalid")).toBe(false);
    expect(isValidMode("review")).toBe(false);
    expect(isValidMode("freeform")).toBe(false);
  });

  test("registerMode allows adding new modes", () => {
    const testModeName = "test" as unknown as ModeName;
    const mockMode: Mode = {
      name: testModeName,
      description: "Mock mode for testing",
      shouldTrigger: () => false,
      prepareContext: (context) => ({
        mode: testModeName,
        githubContext: context,
      }),
      getAllowedTools: () => [],
      getDisallowedTools: () => [],
      shouldCreateTrackingComment: () => false,
    };

    registerMode(mockMode);

    const retrievedMode = getMode(testModeName);
    expect(retrievedMode.description).toBe("Mock mode for testing");
  });

  test("isValidMode handles edge cases", () => {
    expect(isValidMode("")).toBe(false);
    expect(isValidMode(" tag ")).toBe(false);
    expect(isValidMode("TAG")).toBe(false);
    expect(isValidMode("tag\n")).toBe(false);
    expect(isValidMode(null as any)).toBe(false);
    expect(isValidMode(undefined as any)).toBe(false);
    expect(isValidMode(123 as any)).toBe(false);
    expect(isValidMode({} as any)).toBe(false);
    expect(isValidMode([] as any)).toBe(false);
  });

  test("getMode maintains referential equality", () => {
    const mode1 = getMode("tag");
    const mode2 = getMode("tag");
    expect(mode1).toBe(mode2);
  });

  test("registerMode overwrites existing modes", () => {
    const customModeName = "custom-overwrite" as unknown as ModeName;

    const firstMode: Mode = {
      name: customModeName,
      description: "First version",
      shouldTrigger: () => true,
      prepareContext: (context) => ({
        mode: customModeName,
        githubContext: context,
      }),
      getAllowedTools: () => ["tool1"],
      getDisallowedTools: () => [],
      shouldCreateTrackingComment: () => true,
    };

    const secondMode: Mode = {
      name: customModeName,
      description: "Second version",
      shouldTrigger: () => false,
      prepareContext: (context) => ({
        mode: customModeName,
        githubContext: context,
      }),
      getAllowedTools: () => ["tool2", "tool3"],
      getDisallowedTools: () => ["tool1"],
      shouldCreateTrackingComment: () => false,
    };

    registerMode(firstMode);
    const mode1 = getMode(customModeName);
    expect(mode1.description).toBe("First version");
    expect(mode1.getAllowedTools()).toEqual(["tool1"]);

    registerMode(secondMode);
    const mode2 = getMode(customModeName);
    expect(mode2.description).toBe("Second version");
    expect(mode2.getAllowedTools()).toEqual(["tool2", "tool3"]);
    expect(mode2.getDisallowedTools()).toEqual(["tool1"]);
  });




  test("getMode error message includes available modes hint", () => {
    try {
      getMode("nonexistent" as unknown as ModeName);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Invalid mode 'nonexistent'");
      expect(error.message).toContain("Valid modes are: 'tag'");
      expect(error.message).toContain(
        "Please check your workflow configuration",
      );
    }
  });

  test("resetRegistry clears all modes and allows re-initialization", () => {
    const testModeName = "test-reset" as unknown as ModeName;
    const testMode: Mode = {
      name: testModeName,
      description: "Test mode for reset",
      shouldTrigger: () => false,
      prepareContext: (context) => ({
        mode: testModeName,
        githubContext: context,
      }),
      getAllowedTools: () => [],
      getDisallowedTools: () => [],
      shouldCreateTrackingComment: () => false,
    };

    registerMode(testMode);
    expect(getMode(testModeName).description).toBe("Test mode for reset");

    resetRegistry();

    expect(() => getMode(testModeName)).toThrow();

    const tagModeAfterReset = getMode("tag");
    expect(tagModeAfterReset).toBe(tagMode);
    expect(tagModeAfterReset.name).toBe("tag");
  });
});
