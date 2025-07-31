# Test Review Mode

This is a test file to demonstrate the review mode functionality.

## Features to Review

- Code quality analysis
- Security vulnerability detection
- Performance optimization suggestions
- Best practices enforcement

## Test Code

```javascript
function processUser(user) {
    // Potential issues for review:
    // 1. No input validation
    // 2. No error handling
    var name = user.name;
    var age = user.age;
    
    if (age > 18) {
        console.log(name + " is an adult");
    }
    
    // SQL injection vulnerability
    const query = "SELECT * FROM users WHERE name = '" + name + "'";
    
    return query;
}
```

This code has several issues that the review mode should catch.