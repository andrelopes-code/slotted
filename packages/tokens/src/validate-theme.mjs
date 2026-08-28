function checkTokenMap(errors, label, expectedNames, values) {
  const expected = new Set(expectedNames);
  const actual = values ?? {};

  for (const name of expectedNames) {
    if (!(name in actual)) errors.push(`${label} is missing ${name}`);
  }

  for (const name of Object.keys(actual)) {
    if (!expected.has(name)) errors.push(`${label} contains unknown token ${name}`);
  }
}

export function validateTheme(contract, theme) {
  const errors = [];
  checkTokenMap(errors, 'base', contract.base, theme.base);

  for (const scheme of contract.requiredSchemes) {
    checkTokenMap(errors, `scheme ${scheme}`, contract.scheme, theme.schemes?.[scheme]);
  }

  for (const density of contract.requiredDensities) {
    checkTokenMap(errors, `density ${density}`, contract.density, theme.densities?.[density]);
  }

  return errors;
}

export function assertValidTheme(contract, theme) {
  const errors = validateTheme(contract, theme);
  if (errors.length > 0) {
    throw new Error(`Invalid theme:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}
