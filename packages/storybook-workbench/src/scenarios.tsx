export const BUTTON_FAMILY_SCENARIOS = {
  overview: ['matrix', 'themes', 'densities'],
  button: ['playground', 'states', 'content', 'fullWidth', 'loading', 'accessibility'],
  buttonLink: ['playground', 'states', 'routerIntegration', 'accessibility'],
  iconButton: ['playground', 'sizes', 'states', 'loading', 'accessibility'],
  toggleButton: ['playground', 'pressed', 'states', 'accessibility'],
  buttonGroup: ['playground', 'orientations', 'splitAction', 'accessibility'],
} as const;

export type ScenarioPage = keyof typeof BUTTON_FAMILY_SCENARIOS;

export function scenario(id: string) {
  return { slotted: { scenarioId: id } } as const;
}

export function storyScenarioIds(storyModule: Record<string, unknown>) {
  return Object.entries(storyModule)
    .filter(([name]) => name !== 'default')
    .flatMap(([, value]) => {
      if (typeof value !== 'object' || value === null) return [];
      const parameters = Reflect.get(value, 'parameters');
      const slotted =
        typeof parameters === 'object' && parameters !== null
          ? Reflect.get(parameters, 'slotted')
          : undefined;
      const id =
        typeof slotted === 'object' && slotted !== null
          ? Reflect.get(slotted, 'scenarioId')
          : undefined;
      return typeof id === 'string' ? [id] : [];
    });
}

export function scenarioCoverageErrors(
  expected: readonly string[],
  storyModule: Record<string, unknown>,
) {
  const actual = storyScenarioIds(storyModule);
  const duplicates = [
    ...new Set(
      actual.filter(
        (id) => expected.includes(id) && actual.filter((actualId) => actualId === id).length > 1,
      ),
    ),
  ];
  return [
    ...expected.filter((id) => !actual.includes(id)).map((id) => `missing ${id}`),
    ...actual.filter((id) => !expected.includes(id)).map((id) => `unknown ${id}`),
    ...duplicates.map((id) => `duplicate ${id}`),
  ];
}

interface ContractMember {
  capabilities: readonly string[];
  defaults: Record<string, boolean | string>;
}

const capabilityApi = {
  appearance: ['variant', 'fill', 'size'],
  content: ['leading', 'trailing'],
  fullWidth: ['fullWidth'],
  disabled: ['disabled'],
  loading: ['loading'],
  pressed: ['pressed'],
  orientation: ['orientation'],
} as const;

export function apiMetadataErrors(
  member: ContractMember,
  rows: readonly { name: string; defaultValue: string }[],
) {
  const errors: string[] = [];
  const names = rows.map((row) => row.name);
  const duplicates = [
    ...new Set(names.filter((name) => names.filter((candidate) => candidate === name).length > 1)),
  ];
  if (duplicates.length > 0) return duplicates.map((name) => `duplicate API ${name}`);
  for (const capability of member.capabilities) {
    const required = capabilityApi[capability as keyof typeof capabilityApi] ?? [];
    for (const name of required) {
      if (!names.includes(name)) errors.push(`missing API ${name}`);
    }
  }
  for (const [name, value] of Object.entries(member.defaults)) {
    const row = rows.find((candidate) => candidate.name === name);
    if (row === undefined) errors.push(`missing default ${name}`);
    else if (row.defaultValue !== String(value)) {
      errors.push(`default ${name}: expected ${String(value)}, received ${row.defaultValue}`);
    }
  }
  return errors;
}
