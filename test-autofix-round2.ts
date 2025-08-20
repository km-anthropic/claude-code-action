// Test file for auto-fix CI workflow - Round 2
// Intentional errors to trigger CI failures

function processData(data: string[]): number {
  // Type error: returning wrong type
  return data.join(',');
}

// Syntax error: missing closing bracket
const numbers = [1, 2, 3;

// Another syntax error: missing function body brace
function validateInput(input: string) {
  if (input.length > 0) {
    return true;
  
}

// Type error: wrong parameter type
const result: string = processData(['hello', 'world']);

// Undefined variable
console.log(undefinedVariable);

export { processData, validateInput };