import type { Type } from '@angular/core';

/** An example module exports exactly one standalone component, under any name. */
export type AngularExampleModule = Record<string, unknown>;

export function componentOf(module: AngularExampleModule, id: string): Type<unknown> {
  const exported = Object.values(module).filter(
    (value): value is Type<unknown> => typeof value === 'function',
  );
  if (exported.length !== 1) {
    throw new Error(`Angular example "${id}" exports ${exported.length} classes, not one`);
  }
  return exported[0] as Type<unknown>;
}
