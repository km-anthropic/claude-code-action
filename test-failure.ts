// This file intentionally has TypeScript errors to trigger CI failure
// Updated to trigger new workflow run
const testFunction = (param: string): number => {
  return 42;
}

function brokenFunction() {
  console.log("missing closing brace");
}

export { testFunction, brokenFunction };