# Claude Code Action Mode Refactor

## Overview

We're introducing a flexible mode system to make claude-code-action suitable for different use cases beyond just tagging Claude for implementation tasks. Following Ashwin's guidance, we'll start by refactoring current behavior into a "tag" mode, setting up infrastructure for future modes while making zero breaking changes.

> **Ashwin's guidance**: "I think you could start it just by refactoring so that there's one 'mode' and it's always 'tag'"

> **Goal**: "each mode almost be its own little code path, with some basics around github API calls shared, but generally decoupled enough that we can add more as we like"

## Long-Term Vision

The mode system will eventually support:

- **`tag`** (default): Current behavior for implementation tasks
- **`review`**: Optimized for code reviews without tracking comments
- **`freeform`**: For automation with no trigger checking

This initial implementation creates the foundation for these modes.

## Implementation Strategy

### Phase 1: Mode Infrastructure with Tag Mode Only

Start by refactoring current behavior into a mode system with just "tag" mode. No new features, just code organization.

### Future Phases (Not in Initial PR)

- Add `freeform` mode for automation (no trigger checking)
- Add `review` mode for code reviews (no tracking comment by default)
- Add `use_tracking_comment` input to override mode defaults

## Architecture Design

### Mode Interface

```typescript
// src/modes/types.ts
export type ModeName = "tag"; // More modes to be added later

export interface Mode {
  name: ModeName;
  description: string;

  // Each mode owns its entire lifecycle
  shouldTrigger(context: ParsedGitHubContext): boolean;
  prepareContext(context: ParsedGitHubContext): ModeContext;
  generatePrompt(context: ModeContext, data: FetchDataResult): string;
  getAllowedTools(): string[];
  getDisallowedTools(): string[];
  shouldCreateTrackingComment(): boolean;
}
```

### File Structure

```
src/
├── modes/
│   ├── types.ts          # Mode interfaces
│   ├── registry.ts       # Mode registration
│   └── tag/
│       ├── index.ts      # Tag mode implementation
│       ├── prompt.ts     # Tag-specific prompts (future)
│       └── triggers.ts   # Tag-specific triggers (future)
├── entrypoints/
│   └── prepare.ts        # Updated to use modes
└── github/
    └── context.ts        # Updated to parse mode
```

### Mode Registry

```typescript
// src/modes/registry.ts
import type { Mode, ModeName } from "./types";
import { tagMode } from "./tag";

const modeRegistry = new Map<ModeName, Mode>([["tag", tagMode]]);

export function getMode(name: ModeName): Mode {
  const mode = modeRegistry.get(name);
  if (!mode) {
    throw new Error(`Unknown mode: ${name}`);
  }
  return mode;
}
```

### Tag Mode Implementation

```typescript
// src/modes/tag/index.ts
import type { Mode } from "../types";
import { checkContainsTrigger } from "../../github/validation/trigger";
import { generatePrompt } from "../../create-prompt";

export const tagMode: Mode = {
  name: "tag",
  description: "Traditional implementation mode triggered by @claude mentions",

  shouldTrigger(context) {
    return checkContainsTrigger(context);
  },

  prepareContext(context) {
    return { mode: "tag", githubContext: context };
  },

  generatePrompt(context, githubData) {
    // Initially delegate to existing logic
    return generatePrompt({ ...context.githubContext, ...githubData });
  },

  getAllowedTools() {
    return []; // Use defaults for now
  },

  getDisallowedTools() {
    return [];
  },

  shouldCreateTrackingComment() {
    return true;
  },
};
```

### Integration in prepare.ts

```typescript
// src/entrypoints/prepare.ts
import { getMode } from "../modes/registry";

export async function prepare(): Promise<void> {
  // ... existing steps 1-3

  // Step 4: Get mode and check triggers
  const mode = getMode(context.mode);

  if (!mode.shouldTrigger(context)) {
    core.notice("No trigger detected. Skipping Claude Code execution.");
    return;
  }

  // Step 6: Create initial comment (mode-aware)
  if (mode.shouldCreateTrackingComment()) {
    const commentId = await createInitialComment(context, octokit);
    core.setOutput("comment_id", commentId);
  }

  // Step 10: Generate prompt using mode
  const modeContext = mode.prepareContext(context);
  const prompt = mode.generatePrompt(modeContext, fetchedData);
}
```

## Implementation Checklist

### Phase 1: Setup ✅

- [x] Add `mode` input to `action.yml` with default 'tag'
- [x] Create `src/modes/` directory structure
- [x] Create `src/modes/types.ts` with Mode interface
- [x] Create `src/modes/registry.ts` for mode registration
- [x] Create `src/modes/tag/index.ts` implementing Mode interface

### Phase 2: Integration ✅

- [x] Update `src/github/context.ts` to parse mode input
- [x] Add mode validation (only 'tag' allowed initially)
- [x] Update `src/entrypoints/prepare.ts` to use mode system
- [x] Replace direct trigger check with `mode.shouldTrigger`
- [x] Use `mode.shouldCreateTrackingComment` for comment logic
- [x] Use `mode.generatePrompt` for prompt generation

### Phase 3: Testing ✅

- [x] Test mode parsing and validation
- [x] Test invalid mode values throw error
- [x] Verify all existing workflows work unchanged
- [x] Test mode registry functionality
- [x] Run full test suite

### Phase 4: Documentation ✅

- [x] Update action.yml description
- [x] Add comments explaining mode system
- [x] Document how to add new modes (for contributors)
- [x] Note that override_prompt with variable substitution already works

## Implementation Summary

Successfully implemented the mode system infrastructure with:

1. **Mode Architecture**: Clean interface-based design with lazy loading to avoid circular dependencies
2. **Tag Mode**: Fully functional implementation that delegates to existing logic
3. **Registry Pattern**: Extensible registry for easy mode addition
4. **Integration**: Seamless integration into prepare.ts workflow
5. **Testing**: Comprehensive tests for registry and tag mode
6. **Documentation**: JSDoc comments and README for contributors
7. **Constants**: DEFAULT_MODE and VALID_MODES for type safety

The implementation maintains 100% backward compatibility while providing a foundation for future modes like `review` and `freeform`.

## Mode Separation Benefits

Each mode will be completely self-contained:

```
tag/
├── index.ts      # All tag mode logic
├── prompt.ts     # Tag-specific prompts
└── triggers.ts   # Tag-specific triggers

review/           # Future mode
├── index.ts      # All review logic
├── api.ts        # Review-specific GitHub APIs
└── tools.ts      # Review-only tools
```

This achieves:

- **True Isolation**: Modes can't interfere with each other
- **Easy Testing**: Test each mode independently
- **Clear Ownership**: All mode logic in one place
- **Safe Changes**: Modify one mode without affecting others
- **Easy Addition**: New modes don't touch existing code

## Future Mode Examples

Once infrastructure is in place, adding modes is simple:

```typescript
// Future: Review Mode
export const reviewMode: Mode = {
  name: "review",
  shouldCreateTrackingComment: () => false,
  getAllowedTools: () => ["pr_review_create", "file_read"],
  getDisallowedTools: () => ["file_write", "git_commit"],
  // ... review-specific behavior
};

// Future: Freeform Mode
export const freeformMode: Mode = {
  name: "freeform",
  shouldTrigger: () => true, // Always runs
  // ... automation behavior
};
```

## Timeline

- **Day 1-2**: Mode infrastructure + tag mode
- **Day 3**: Integration and testing
- **Day 4**: Documentation and cleanup
- **Day 5**: Review and polish
- **End of Week**: Ready to merge

## Success Criteria

- ✅ All existing tests pass
- ✅ Zero breaking changes
- ✅ Mode system working with tag mode
- ✅ Clean separation of concerns
- ✅ Easy to add new modes later

## Key Design Decisions

1. **Functional Style**: No classes, just objects with functions (fits codebase)
2. **Registry Pattern**: Central registration of modes
3. **Incremental**: Ship with one mode, add more later
4. **Backward Compatible**: No behavior changes initially
5. **Self-Contained**: Each mode owns its complete lifecycle
