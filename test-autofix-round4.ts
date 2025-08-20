// Test file for auto-fix CI workflow - Round 4
// Testing with fixed workflow that checks out PR branch

// Syntax error: missing semicolon and wrong bracket
const items = [1, 2, 3}

// Type error: incompatible types
function addNumbers(a: number, b: number): string {
  return a + b; // Returns number but declares string
}

// Syntax error: unterminated template literal  
const greeting = `Hello, ${name

// Missing closing parenthesis
console.log("Testing auto-fix"

// Undefined variable reference
const result = processData(unknownVariable);

// Another syntax error: missing function closing brace
function validateData(data: any) {
  if (data) {
    return true;
  // Missing closing brace

export { addNumbers, validateData };