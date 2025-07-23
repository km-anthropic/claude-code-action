import { describe, test, expect } from "bun:test";
import {
  getMode,
  isValidMode,
  registerMode,
  type ModeName,
} from "../../src/modes/registry";
import { tagMode } from "../../src/modes/tag";
import type { Mode } from "../../src/modes/types";

describe("Mode Registry", () => {
  test("getMode returns tag mode by default", () => {
    const mode = getMode("tag");
    expect(mode).toBe(tagMode);
    expect(mode.name).toBe("tag");
  });

  test("getMode throws error for invalid mode", () => {
    const invalidMode = "invalid" as unknown as ModeName;
    expect(() => getMode(invalidMode)).toThrow("Unknown mode: invalid");
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
});
