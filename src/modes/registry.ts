/**
 * Mode Registry for claude-code-action
 *
 * This registry manages all available execution modes. Modes are loaded lazily
 * to avoid circular dependencies.
 *
 * To add a new mode:
 * 1. Add the mode name to VALID_MODES below
 * 2. Create the mode implementation in a new directory (e.g., src/modes/review/)
 * 3. Register it in initializeRegistry() function
 * 4. Update action.yml description to mention the new mode
 */

import type { Mode } from "./types";

export const DEFAULT_MODE = "tag" as const;
export const VALID_MODES = ["tag"] as const;
export type ModeName = (typeof VALID_MODES)[number];

const modeRegistry = new Map<ModeName, Mode>();
let initialized = false;

function initializeRegistry(): void {
  if (!initialized) {
    const { tagMode } = require("./tag/index");
    modeRegistry.set("tag", tagMode);
    initialized = true;
  }
}

/**
 * Registers a new mode in the registry.
 * @param mode The mode to register
 */
export function registerMode(mode: Mode): void {
  modeRegistry.set(mode.name, mode);
}

/**
 * Retrieves a mode from the registry by name.
 * @param name The mode name to retrieve
 * @returns The requested mode
 * @throws Error if the mode is not found
 */
export function getMode(name: ModeName): Mode {
  initializeRegistry();
  const mode = modeRegistry.get(name);
  if (!mode) {
    throw new Error(`Unknown mode: ${name}`);
  }
  return mode;
}

/**
 * Type guard to check if a string is a valid mode name.
 * @param name The string to check
 * @returns True if the name is a valid mode name
 */
export function isValidMode(name: string): name is ModeName {
  return VALID_MODES.includes(name as ModeName);
}
