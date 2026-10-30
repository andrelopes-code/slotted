import { render } from '@testing-library/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '../combobox';
import { DatePicker } from '../date-picker';
import { EntityPicker } from '../entity-picker';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../menu';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from '../multi-select';
import { Popover, PopoverContent, PopoverLayer, PopoverTrigger } from '../popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { Tooltip, TooltipContent, TooltipLayer, TooltipTrigger } from '../tooltip';

/**
 * In Chromium an ancestor with `opacity` below one is the Backdrop Root of what
 * it holds, so a `backdrop-filter` on the content blurs nothing until the layer
 * is opaque and then appears at once. The layer only moves; the content fades.
 * Each popup family opens and closes with a filter on its content, and the
 * layer is fully opaque on every frame it is sampled.
 */
const CASES: [family: string, layer: string, popup: (open: boolean) => ReactNode][] = [
  [
    'select',
    '[data-ui-select][data-part-positioner]',
    (open) => (
      <Select open={open}>
        <SelectTrigger>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    ),
  ],
  [
    'combobox',
    '[data-ui-combobox][data-part-positioner]',
    (open) => (
      <Combobox open={open}>
        <ComboboxInput aria-label="Customer" />
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    ),
  ],
  [
    'multi-select',
    '[data-ui-multi-select][data-part-positioner]',
    (open) => (
      <MultiSelect open={open}>
        <MultiSelectControl aria-label="Warehouses" />
        <MultiSelectContent>
          <MultiSelectItem value="a">A</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>
    ),
  ],
  [
    'entity-picker',
    '[data-ui-entity-picker][data-part-positioner]',
    (open) => <EntityPicker aria-label="Owner" items={[{ id: 'a', label: 'Ana' }]} open={open} />,
  ],
  [
    'date-picker',
    '[data-ui-date-picker][data-part-positioner]',
    (open) => <DatePicker aria-label="Date" open={open} />,
  ],
  [
    'menu',
    '[data-ui-menu]',
    (open) => (
      <Menu open={open}>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent>
          <MenuItem>One</MenuItem>
        </MenuContent>
      </Menu>
    ),
  ],
  [
    'popover',
    '[data-ui-popover]',
    (open) => (
      <Popover open={open}>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverLayer>
          <PopoverContent>Body</PopoverContent>
        </PopoverLayer>
      </Popover>
    ),
  ],
  [
    'tooltip',
    '[data-ui-tooltip]',
    (open) => (
      <Tooltip open={open}>
        <TooltipTrigger>Sync</TooltipTrigger>
        <TooltipLayer>
          <TooltipContent>Pulls stock levels.</TooltipContent>
        </TooltipLayer>
      </Tooltip>
    ),
  ],
];

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

describe('the motion of a popup whose content has a backdrop filter', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.head.querySelector('style[data-popup-backdrop]')?.remove();
  });

  it.each(CASES)(
    '%s: the layer is opaque on every frame of the entrance and the exit',
    async (family, layer, popup) => {
      /* The theme's motion tokens, which the test document does not load. */
      document.documentElement.style.setProperty('--slotted-duration-short', '160ms');
      document.documentElement.style.setProperty('--slotted-duration-medium', '240ms');
      const style = document.createElement('style');
      style.setAttribute('data-popup-backdrop', '');
      style.textContent = `${layer} [data-part-content], ${layer} > [data-part-content] { backdrop-filter: blur(20px); }`;
      document.head.append(style);

      let toggle: (open: boolean) => void = () => {};
      function Host() {
        const [open, setOpen] = useState(false);
        toggle = setOpen;
        return <>{popup(open)}</>;
      }
      render(<Host />);
      for (let index = 0; index < 5; index += 1) await frame();

      const opacities: string[] = [];
      const sample = () => {
        const element = document.querySelector(layer);
        if (element !== null) opacities.push(getComputedStyle(element).opacity);
        return element;
      };

      toggle(true);
      for (let index = 0; index < 24; index += 1) {
        await frame();
        sample();
      }
      const content = document.querySelector(`${layer} [data-part-content]`);
      expect(content, `${family} rendered no content`).not.toBeNull();
      expect(getComputedStyle(content!).backdropFilter).toBe('blur(20px)');
      expect(opacities.length).toBeGreaterThan(10);

      toggle(false);
      for (let index = 0; index < 24; index += 1) {
        await frame();
        sample();
      }
      expect(opacities.filter((opacity) => opacity !== '1')).toEqual([]);
    },
  );
});
