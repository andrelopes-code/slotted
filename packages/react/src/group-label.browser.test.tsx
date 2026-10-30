import { render } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { Combobox, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem } from './combobox';
import { CommandPalette } from './command-palette';
import { EntityPicker } from './entity-picker';
import { Menu, MenuContent, MenuGroup, MenuItem, MenuTrigger } from './menu';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectGroup,
  MultiSelectItem,
} from './multi-select';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const bounded: CSSProperties = { maxBlockSize: 200 };
const names = (group: string) =>
  Array.from({ length: 20 }, (_, index) => `${group} ${String(index + 1)}`);
/** The same two groups as records and commands, grouped by the family's own field. */
const grouped = ['Alpha', 'Beta'].flatMap((group) =>
  names(group).map((name) => ({ id: name, label: name, group })),
);

/** Two groups of twenty, in each family's own parts. */
const families: {
  name: string;
  ui: string;
  open: string;
  /** The element that holds the groups, when it is not the family's `content` part. */
  content?: string;
  tree: (filter?: boolean) => ReactNode;
}[] = [
  {
    name: 'select',
    ui: 'select',
    open: '[data-part="trigger"]',
    tree: () => (
      <Select>
        <SelectTrigger aria-label="Pick">
          <SelectValue />
        </SelectTrigger>
        <SelectContent style={bounded}>
          {['Alpha', 'Beta'].map((group) => (
            <SelectGroup key={group} label={group}>
              {names(group).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    ),
  },
  {
    name: 'combobox',
    ui: 'combobox',
    open: 'input',
    tree: () => (
      <Combobox>
        <ComboboxInput aria-label="Pick" />
        <ComboboxContent aria-label="Pick" style={bounded}>
          {['Alpha', 'Beta'].map((group) => (
            <ComboboxGroup key={group} label={group}>
              {names(group).map((name) => (
                <ComboboxItem key={name} value={name}>
                  {name}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          ))}
        </ComboboxContent>
      </Combobox>
    ),
  },
  {
    name: 'multi-select',
    ui: 'multi-select',
    open: 'input',
    tree: () => (
      <MultiSelect>
        <MultiSelectControl aria-label="Pick" />
        <MultiSelectContent aria-label="Pick" style={bounded}>
          {['Alpha', 'Beta'].map((group) => (
            <MultiSelectGroup key={group} label={group}>
              {names(group).map((name) => (
                <MultiSelectItem key={name} value={name}>
                  {name}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    ),
  },
  {
    name: 'entity-picker',
    ui: 'entity-picker',
    open: 'input',
    tree: () => <EntityPicker aria-label="Pick" items={grouped} media="none" openOn="focus" />,
  },
  {
    name: 'command-palette',
    ui: 'command-palette',
    open: 'input',
    content: '[data-ui="command-palette"] [data-part="list"]',
    tree: () => (
      <CommandPalette
        defaultOpen
        groups={[
          { id: 'Alpha', label: 'Alpha' },
          { id: 'Beta', label: 'Beta' },
        ]}
        items={grouped}
      />
    ),
  },
  {
    name: 'menu',
    ui: 'menu',
    open: 'button',
    tree: () => (
      <Menu>
        <MenuTrigger>Pick</MenuTrigger>
        <MenuContent style={bounded}>
          {['Alpha', 'Beta'].map((group) => (
            <MenuGroup key={group} label={group}>
              {names(group).map((name) => (
                <MenuItem key={name}>{name}</MenuItem>
              ))}
            </MenuGroup>
          ))}
        </MenuContent>
      </Menu>
    ),
  },
];

/**
 * A group label scrolled away with its group's first items, and the options
 * left in view had no group a reader could see.
 */
describe.each(families)('the group labels of a $name', ({ ui, open, content: holder, tree }) => {
  async function opened() {
    render(tree());
    await userEvent.click(document.querySelector<HTMLElement>(open)!);
    for (let index = 0; index < 10; index += 1) await frame();
    /* A popup that scales in measures its rows off their place until it lands. */
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
    const content = document.querySelector<HTMLElement>(
      holder ?? `[data-ui="${ui}"][data-part="content"], [data-ui="${ui}"] [data-part="content"]`,
    )!;
    const [alpha, beta] = [...content.querySelectorAll<HTMLElement>('[data-part="group-label"]')];
    const item = (name: string) =>
      [...content.querySelectorAll<HTMLElement>('[data-part="item"]')].find(
        (element) => element.textContent.trim() === name,
      )!;
    const scroller = item('Alpha 1').closest<HTMLElement>('[data-part="list"]') ?? content;
    /* A popup with no height of its own to set is bounded here, as the others are by `bounded`. */
    scroller.style.maxBlockSize = '200px';
    await frame();
    const top = () => scroller.getBoundingClientRect().top + scroller.clientTop;
    /** Scrolls until `name` sits just under a label stuck to the top. */
    const scrollTo = async (name: string) => {
      scroller.scrollTop += item(name).getBoundingClientRect().top - top() - alpha!.offsetHeight;
      await frame();
    };
    return { alpha: alpha!, beta: beta!, item, scrollTo, top };
  }

  it('keeps the label of the group in view at the top of the list', async () => {
    const { alpha, beta, scrollTo, top } = await opened();

    await scrollTo('Alpha 10');
    expect(alpha.getBoundingClientRect().top).toBeCloseTo(top(), 0);

    await scrollTo('Beta 5');
    expect(beta.getBoundingClientRect().top).toBeCloseTo(top(), 0);
    expect(alpha.getBoundingClientRect().bottom).toBeLessThanOrEqual(top() + 0.5);
  });

  it('brings an item the arrow keys reach in below the stuck label', async () => {
    const { beta, item, scrollTo } = await opened();
    await scrollTo('Beta 5');
    await userEvent.hover(item('Beta 5'));
    const active = () =>
      document.querySelector<HTMLElement>(`[data-ui="${ui}"] [data-part="item"][data-current]`) ??
      (document.activeElement as HTMLElement);
    expect(active().textContent.trim()).toBe('Beta 5');

    for (const name of ['Beta 4', 'Beta 3', 'Beta 2', 'Beta 1']) {
      await userEvent.keyboard('{ArrowUp}');
      await frame();
      expect(active().textContent.trim()).toBe(name);
      expect(active().getBoundingClientRect().top).toBeGreaterThanOrEqual(
        beta.getBoundingClientRect().bottom - 0.5,
      );
    }
  });
});

const filtered = families.filter(({ open }) => open === 'input');

describe.each(filtered)('the group labels of a $name under a query', ({ open, tree }) => {
  it('hides a group whose items the query rejected, label and all', async () => {
    render(tree());
    const input = document.querySelector<HTMLInputElement>(open)!;
    await userEvent.click(input);
    await userEvent.fill(input, 'Beta');
    for (let index = 0; index < 5; index += 1) await frame();
    const alpha = [...document.querySelectorAll<HTMLElement>('[data-part="group"]')].find((group) =>
      group.textContent.includes('Alpha'),
    );

    expect(alpha === undefined || !alpha.checkVisibility()).toBe(true);
  });
});
