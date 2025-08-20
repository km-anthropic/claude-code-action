// This file has intentional errors to test auto-fix CI
// Testing the simplified workflow with slash command
// Now with workflow_run support added!

function calculateTotal(items: number[]): number {
  let sum = 0;
  for (const item of items) {
    sum += item;
  }
  return sum;
}

console.log("Testing CI failure");

const result: number = calculateTotal([1, 2, 3]);

export { calculateTotal };
