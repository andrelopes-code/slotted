import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadFamilies } from './load.ts';
import { renderFamily } from './render.ts';

const root = resolve(import.meta.dirname, '../../..');

/**
 * Agents composing screens put an inline-message at the head of sections,
 * because the page called its md size "the message of a section" while its
 * rules bound it to a field. The page sizes it by the field it sits beside and
 * sends a message about a region to alert; the errors topic names both.
 */
describe.each(['react', 'angular'] as const)('the %s inline-message page', (binding) => {
  it('sizes the message by its field and sends a region’s message to alert', async () => {
    const family = (await loadFamilies(binding, root)).find(
      (each) => each.contract.family === 'inline-message',
    )!;
    const page = renderFamily({ ...family, verdicts: new Map() })
      .files.map((file) => file.content)
      .join('\n');

    expect(page).not.toMatch(/message of a section/i);
    expect(page).toMatch(/sm beside a compact field, md beside a large field/);
    expect(page).toMatch(/A message about a section, a page or a command’s outcome is an alert/);
  });
});

describe('the errors and conflicts topic', () => {
  it('names alert wherever it names inline-message', () => {
    const topic = readFileSync(
      resolve(root, 'tools/agent-docs/content/guidelines/errors-and-conflicts.md'),
      'utf8',
    );
    const families = /^families: \[(.*)\]$/m.exec(topic)?.[1]?.split(/,\s*/) ?? [];
    expect(families).toContain('inline-message');
    expect(families).toContain('alert');
  });
});
