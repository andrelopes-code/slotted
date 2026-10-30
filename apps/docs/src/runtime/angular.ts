import type { Type } from '@angular/core';

import { componentOf, type AngularExampleModule } from './angular-component';
import { byExampleId } from './frameworks';

/**
 * Lazy: each example is its own chunk, loaded when its preview is mounted.
 * Browser and tests only, for the reason `react.ts` gives.
 */
const examples = byExampleId(
  import.meta.glob<AngularExampleModule>('../../examples/angular/**/*.ts'),
);

export const angularExampleIds = (): string[] => [...examples.keys()];

export async function loadAngularExample(id: string): Promise<Type<unknown>> {
  const load = examples.get(id);
  if (!load) throw new Error(`No Angular example "${id}"`);
  return componentOf(await load(), id);
}
