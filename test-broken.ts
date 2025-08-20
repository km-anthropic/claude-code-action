// Simple test file with compilation errors

function processData(items: string[]): number {
  // Type error: returning wrong type
  return items.join(',');
}

// Syntax error: missing closing bracket
const numbers = [1, 2, 3;

export { processData };