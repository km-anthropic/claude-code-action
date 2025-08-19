// This file has intentional errors to test auto-fix CI
// Testing the simplified workflow with slash command
// Now with workflow_run support added!

function calculateTotal(items: number[]): number {
  // Type error: sum might be used before being assigned
  let sum;
  for (const item of items) {
    sum += item;  // Error: sum is possibly undefined
  }
  return sum;
}

// Syntax error: missing closing parenthesis
console.log("Testing CI failure"

// Another type error
const result: string = calculateTotal([1, 2, 3]); // Type error: number is not assignable to string

export { calculateTotal };// Trigger CI again with fixed workflow
// Final test with bun commands allowed
// Final test with everything in place
