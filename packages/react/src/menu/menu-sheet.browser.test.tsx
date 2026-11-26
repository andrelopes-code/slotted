import { render } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Menu } from './menu';
import { MenuDefaultsProvider } from './menu-defaults';
import { MenuItem } from './menu-items';
import { MenuContent, MenuTrigger } from './menu-parts';
import type { MenuPresentation } from './menu.types';

function RowActions({
  onSelect,
  presentation,
}: {
  onSelect?: (value: string) => void;
  presentation?: MenuPresentation | undefined;
}) {
  return (
    <Menu {...(presentation === undefined ? {} : { presentation })}>
      <MenuTrigger>Row actions</MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={() => onSelect?.('edit')}>Edit</MenuItem>
        <MenuItem onSelect={() => onSelect?.('duplicate')}>Duplicate</MenuItem>
        <MenuItem onSelect={() => onSelect?.('delete')} tone="danger">
          Delete
        </MenuItem>
        <Menu>
          <MenuTrigger>Move to</MenuTrigger>
          <MenuContent>
            <MenuItem onSelect={() => onSelect?.('archive')}>Archive</MenuItem>
            <MenuItem onSelect={() => onSelect?.('trash')}>Trash</MenuItem>
          </MenuContent>
        </Menu>
      </MenuContent>
    </Menu>
  );
}

const trigger = () => document.querySelector<HTMLElement>('button:not([role])')!;
const layers = () => [...document.querySelectorAll<HTMLElement>('[data-ui="menu"][data-open]')];

async function settle() {
  for (let index = 0; index < 5; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  await Promise.allSettled(document.getAnimations().map((animation) => animation.finished));
}

async function open() {
  await userEvent.click(trigger());
  await vi.waitFor(() => expect(layers()).toHaveLength(1));
  await settle();
}

/**
 * A menu of row actions on a phone opened as a list anchored to its trigger,
 * at the list's own height, while the sheet beside it rose from the bottom.
 */
describe('a menu on a phone', () => {
  afterEach(async () => {
    await page.viewport(412, 915);
  });

  it('is a modal sheet of its items under presentation="auto"', async () => {
    await page.viewport(390, 844);
    render(<RowActions presentation="auto" />);

    await open();
    const [sheet] = layers();
    const menu = sheet!.querySelector<HTMLElement>('[role="menu"]')!;
    const items = [...menu.querySelectorAll<HTMLElement>(':scope > [role="menuitem"]')];
    const box = menu.getBoundingClientRect();

    expect(sheet!.dataset['presentation']).toBe('sheet');
    expect(items.map((item) => item.textContent)).toEqual([
      'Edit',
      'Duplicate',
      'Delete',
      'Move to',
    ]);
    expect(menu.contains(document.activeElement)).toBe(true);
    expect(trigger().closest('[inert]')).not.toBeNull();
    expect(Math.round(box.bottom)).toBe(844);
    expect(Math.round(box.width)).toBe(390);
    for (const item of items)
      expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);

    const scrim = sheet!.querySelector<HTMLElement>(':scope > [data-part="backdrop"]')!;
    await userEvent.click(scrim, { position: { x: 195, y: 20 } });
    await vi.waitFor(() => expect(layers()).toHaveLength(0));

    expect(document.activeElement).toBe(trigger());
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('runs an item and gives focus back to the trigger', async () => {
    await page.viewport(390, 844);
    const onSelect = vi.fn();
    render(<RowActions onSelect={onSelect} presentation="auto" />);

    await open();
    await userEvent.click(layers()[0]!.querySelector<HTMLElement>('[role="menuitem"]')!);
    await vi.waitFor(() => expect(layers()).toHaveLength(0));

    expect(onSelect).toHaveBeenCalledWith('edit');
    expect(document.activeElement).toBe(trigger());
  });

  it('opens a submenu as a second step of the same sheet', async () => {
    await page.viewport(390, 844);
    const onSelect = vi.fn();
    render(<RowActions onSelect={onSelect} presentation="auto" />);

    await open();
    const first = layers()[0]!.querySelector<HTMLElement>('[role="menu"]')!;
    const item = [...first.querySelectorAll<HTMLElement>('[role="menuitem"]')].at(-1)!;
    await userEvent.click(item);
    await vi.waitFor(() => expect(layers()).toHaveLength(2));
    await settle();
    const step = layers()[1]!;
    const second = step.querySelector<HTMLElement>('[role="menu"]')!;

    expect(step.dataset['presentation']).toBe('sheet');
    expect(step.hasAttribute('data-step')).toBe(true);
    expect(second.querySelector('[data-part="title"]')!.textContent).toBe('Move to');
    expect(second.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      first.getBoundingClientRect().height - 1,
    );
    expect(second.contains(document.activeElement)).toBe(true);

    await userEvent.click(second.querySelector<HTMLElement>('[data-part="back"]')!);
    await vi.waitFor(() => expect(layers()).toHaveLength(1));

    expect(document.activeElement).toBe(item);

    await userEvent.click(item);
    await vi.waitFor(() => expect(layers()).toHaveLength(2));
    await settle();
    await userEvent.click(layers()[1]!.querySelector<HTMLElement>('[role="menuitem"]')!);
    await vi.waitFor(() => expect(layers()).toHaveLength(0));

    expect(onSelect).toHaveBeenCalledWith('archive');
    expect(document.activeElement).toBe(trigger());
  });

  it('is a sheet for every menu under the provider', async () => {
    await page.viewport(390, 844);
    render(
      <MenuDefaultsProvider presentation="auto">
        <RowActions />
      </MenuDefaultsProvider>,
    );

    await open();

    expect(layers()[0]!.dataset['presentation']).toBe('sheet');
  });

  it.each([
    ['presentation="auto" on a wide screen', 'auto', 1024],
    ['no presentation on a phone', undefined, 390],
    ['no presentation on a wide screen', undefined, 1024],
  ] as const)('is the anchored list with %s', async (_, presentation, width) => {
    await page.viewport(width, 844);
    render(<RowActions presentation={presentation} />);

    await open();

    expect(layers()[0]!.dataset['presentation']).toBe('popover');
    expect(layers()[0]!.querySelector('[data-part="backdrop"], [data-part="grip"]')).toBeNull();
    expect(document.querySelector('[inert]')).toBeNull();
  });
});
