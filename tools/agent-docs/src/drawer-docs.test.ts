import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadFamilies } from './load.ts';
import { renderFamily } from './render.ts';

const root = resolve(import.meta.dirname, '../../..');

/** A bottom sheet's travel is timed by the drawer's slide tokens; both pages name them. */
describe.each(['react', 'angular'] as const)('the %s drawer page', (binding) => {
  it('names the tokens a bottom sheet travels in', async () => {
    const family = (await loadFamilies(binding, root)).find(
      (each) => each.contract.family === 'drawer',
    )!;
    const page = renderFamily({ ...family, verdicts: new Map() })
      .files.map((file) => file.content)
      .join('\n');

    expect(page).toMatch(
      /travel in --slotted-drawer-slide-duration and --slotted-drawer-slide-easing \(default --slotted-easing-standard\) going up, and in --slotted-drawer-slide-exit-duration and --slotted-drawer-slide-exit-easing \(default --slotted-easing-exit\) going down/,
    );
  });
});
