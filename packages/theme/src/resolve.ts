const REFERENCE = /var\(\s*(--[a-z0-9-]+)\s*(?:,([^()]*(?:\([^()]*\)[^()]*)*))?\)/i;

/**
 * Expands the `var()` references a token map makes to itself. It is not a CSS
 * engine: it resolves within one map, which is what one theme block is.
 */
export function resolveTokens(values: Readonly<Record<string, string>>): Record<string, string> {
  const resolved: Record<string, string> = { ...values };
  for (const name of Object.keys(resolved)) {
    resolved[name] = resolveValue(values, values[name]!, name, new Set([name]));
  }
  return resolved;
}

function resolveValue(
  values: Readonly<Record<string, string>>,
  value: string,
  name: string,
  path: ReadonlySet<string>,
): string {
  let current = value;
  while (REFERENCE.test(current)) {
    current = current.replace(REFERENCE, (_whole, reference: string, fallback?: string) => {
      if (reference in values) {
        if (path.has(reference)) throw new Error(`Reference cycle at ${reference}`);
        return resolveValue(values, values[reference]!, name, new Set([...path, reference]));
      }
      if (fallback !== undefined) return fallback.trim();
      throw new Error(`${name} references ${reference}, which the map does not hold`);
    });
  }
  return current;
}
