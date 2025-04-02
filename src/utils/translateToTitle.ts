const translateToTitleCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\s+\w/g, (match) => match.toUpperCase());
};

export { translateToTitleCase };
