// Test file for auto-fix CI workflow - Round 3
// Testing with allowed-tools configuration

interface User {
  name: string;
  age: number;
}

// Type error: missing return statement
function getUser(id: number): User {
  if (id === 1) {
    return { name: "Alice", age: 30 };
  }
  // Missing return for other cases
}

// Syntax error: unclosed string
const message = "This string is not closed properly

// Another syntax error: missing closing brace
function processItems(items: string[]) {
  items.forEach(item => {
    console.log(item);
  // Missing closing brace for forEach
}

// Type error: incorrect types
const userAge: string = 42;
const userName: number = "Bob";

// Undefined function call
const result = calculateSum(5, 10);

export { getUser, processItems };