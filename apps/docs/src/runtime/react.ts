import type { ComponentType } from 'react';

import { byExampleId } from './frameworks';

export { exampleIdPrefix } from './react-ids';

type ExampleModule = { default: ComponentType };

/**
 * Lazy: each example is its own chunk, loaded when its preview is mounted.
 * Browser and tests only: a page renders from its own family's registry, so
 * the build does not hand every page the stylesheets of every example.
 */
const examples = byExampleId(import.meta.glob<ExampleModule>('../../examples/react/**/*.tsx'));

export const reactExampleIds = (): string[] => [...examples.keys()];

export async function loadReactExample(id: string): Promise<ComponentType> {
  const load = examples.get(id);
  if (!load) throw new Error(`No React example "${id}"`);
  return (await load()).default;
}
