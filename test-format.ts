function badCode() {
  const x = "missing semicolon";
  const y: string = 123; // type error
  console.log("no space before brace");
}

export function another() {
  return "also missing semicolon";
}
