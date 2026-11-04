import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { EntityPicker } from './entity-picker';
import { Menu, MenuContent, MenuItem, MenuTrigger } from './menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const ROWS = Array.from({ length: 50 }, (_, index) => index);

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const CASES: [family: string, content: string, overlay: ReactNode][] = [
  [
    'Select',
    '[data-ui-select] > [data-part-content]',
    <Select defaultOpen key="s">
      <SelectTrigger>
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        {ROWS.map((row) => (
          <SelectItem key={row} value={String(row)}>
            Currency {row}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>,
  ],
  [
    'EntityPicker',
    '[data-ui-entity-picker] > [data-part-content]',
    <EntityPicker
      aria-label="Account"
      defaultOpen
      items={ROWS.map((row) => ({ id: String(row), label: `Account ${row}` }))}
      key="e"
    />,
  ],
  [
    'Menu',
    '[data-ui-menu] > [data-part-content]',
    <Menu defaultOpen key="m">
      <MenuTrigger>Actions</MenuTrigger>
      <MenuContent>
        {ROWS.map((row) => (
          <MenuItem key={row}>Action {row}</MenuItem>
        ))}
      </MenuContent>
    </Menu>,
  ],
];

/**
 * The content of an overlay family was bounded only by the height the
 * positioner had left, so a list of 150 entries opened near the height of the
 * viewport. `--slotted-overlay-max-block-size` caps it for every family.
 */
describe('--slotted-overlay-max-block-size', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--slotted-overlay-max-block-size');
  });

  it.each(CASES)('caps the content of %s', async (_family, selector, overlay) => {
    document.documentElement.style.setProperty('--slotted-overlay-max-block-size', '20rem');
    render(overlay);
    await frame();
    await frame();

    const content = document.querySelector<HTMLElement>(selector)!;

    expect(content.getBoundingClientRect().height).toBe(320);
    expect(content.scrollHeight).toBeGreaterThan(320);
  });
});
