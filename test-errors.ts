// Intentional TypeScript errors for testing
const unused = "This variable is never used"

function badFormatting(){console.log("No space before brace")}

const missingSemicolon = "Missing semicolon"

export function typeError(input: string): number {
  return input; // Type error: returning string instead of number
}
