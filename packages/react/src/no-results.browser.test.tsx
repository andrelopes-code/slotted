import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from './combobox';
import { EntityPicker } from './entity-picker';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from './multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

/**
 * A search that matches nothing draws the empty message. The status beside it
 * is the live region that announces the count; drawn too, it repeated the
 * sentence one line under the other.
 */
describe('a search that matches nothing', () => {
  it.each(SCENES)('draws one no-results line in $family', async ({ scene, open }) => {
    render(scene);

    await userEvent.click(screen.getByRole(open, { name: 'Fruit' }));
    await userEvent.keyboard('zzz');
    const empty = await waitForPart('empty');
    const status = await waitForPart('status');

    expect(empty.getBoundingClientRect().height).toBeGreaterThan(1);
    expect(status).toHaveAttribute('role', 'status');
    expect(status.getBoundingClientRect().height).toBeLessThanOrEqual(1);
    expect(status.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });
});

interface Scene {
  family: string;
  open: 'button' | 'combobox';
  scene: ReactElement;
}

const SCENES: Scene[] = [
  {
    family: 'select',
    open: 'combobox',
    scene: (
      <Select search>
        <SelectTrigger aria-label="Fruit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
  {
    family: 'combobox',
    open: 'combobox',
    scene: (
      <Combobox>
        <ComboboxInput aria-label="Fruit" />
        <ComboboxContent aria-label="Fruit">
          <ComboboxItem value="apple">Apple</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    ),
  },
  {
    family: 'multi-select',
    open: 'combobox',
    scene: (
      <MultiSelect>
        <MultiSelectControl aria-label="Fruit" />
        <MultiSelectContent aria-label="Fruit">
          <MultiSelectItem value="apple">Apple</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>
    ),
  },
  {
    family: 'entity-picker',
    open: 'combobox',
    scene: <EntityPicker aria-label="Fruit" items={[{ id: 'apple', label: 'Apple' }]} />,
  },
];

async function waitForPart(part: string): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector(`[data-part="${part}"]`)).not.toBeNull();

  return document.querySelector<HTMLElement>(`[data-part="${part}"]`)!;
}
