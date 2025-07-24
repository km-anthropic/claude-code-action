import { describe, test, expect } from "bun:test";
import { getMode, isValidMode, type ModeName } from "../../src/modes/registry";
import { tagMode } from "../../src/modes/tag";

describe("Mode Registry", () => {
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
});
