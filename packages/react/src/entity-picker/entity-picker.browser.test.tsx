import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverLayer,
  PopoverTrigger,
} from '../popover';
import { EntityPicker } from './entity-picker';
import {
  EntityPickerOptionDescription,
  EntityPickerOptionLabel,
} from './entity-picker-option-parts';

const PEOPLE = [
  { id: 'ana', label: 'Ana Silva', team: 'Finance' },
  { id: 'bruno', label: 'Bruno Costa', team: 'Sales' },
];

/**
 * An option written as the reference page writes it keeps the family's row:
 * the face in the first column, the name in the second. A span carrying
 * `data-part="label"` alone had no selector key and fell out of the grid.
 */
describe('an option written through renderOption', () => {
  it('places the name in the second column of the row', async () => {
    render(
      <EntityPicker
        aria-label="Owner"
        items={PEOPLE}
        openOn="focus"
        renderOption={(person) => (
          <>
            <EntityPickerOptionLabel>{person.label}</EntityPickerOptionLabel>
            <EntityPickerOptionDescription>
              {(person as (typeof PEOPLE)[number]).team}
            </EntityPickerOptionDescription>
          </>
        )}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Owner' }));
    const option = await screen.findByRole('option', { name: /Ana Silva/ });
    const label = option.querySelector('[data-part="label"]') as HTMLElement;

    expect(getComputedStyle(label).gridColumnStart).toBe('2');
  });
});

/**
 * An element written outside the option parts stood in the first column, which
 * is as wide as the longest option text, and pushed the offer to create away.
 */
describe('an option holding a bare element', () => {
  it('places the element in the name’s column, as the parts do', async () => {
    render(
      <EntityPicker
        aria-label="Fruit"
        items={[{ id: 'a', label: 'A long option label to widen the first column', avatar: null }]}
        media="none"
        onCreate={(name) => ({ id: name, label: name, avatar: null })}
        renderOption={(entity) => <div>{entity.label}</div>}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Fruit' }));
    const option = await screen.findByRole('option', { name: /A long option label/ });
    const bare = option.firstElementChild as HTMLElement;

    expect(getComputedStyle(bare).gridColumnStart).toBe('2');
  });
});

const MANY = Array.from({ length: 150 }, (_, index) => ({
  id: `p${String(index)}`,
  label: `Person ${String(index).padStart(3, '0')}`,
  avatar: { src: `data:image/gif;base64,R0lGODlhAQABAAAAACw=` },
}));

/**
 * Every keystroke over 500 records with faces rendered all 500, and typing
 * lagged. 150 records keep the list above the windowing threshold and the
 * keyboard walk inside the test's time under the full suite's load. Only the options in view are drawn; the keyboard still reaches the
 * last match, the list scrolling to it as it goes.
 */
describe('a long list of records', () => {
  it('draws the options in view and reaches the last match from the keyboard', async () => {
    render(<EntityPicker aria-label="Owner" items={MANY} searchDelay={0} />);
    const input = screen.getByRole('combobox', { name: 'Owner' });
    await userEvent.click(input);
    await userEvent.keyboard('P');
    await screen.findAllByRole('option');

    expect(document.querySelectorAll('[role="option"]').length).toBeLessThan(60);

    await userEvent.keyboard('{ArrowDown>150/}');
    const last = document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
    expect(last?.textContent).toContain('Person 149');
    expect(document.querySelectorAll('[role="option"]').length).toBeLessThan(60);
  });
});

describe('a picker near the bottom of the viewport', () => {
  afterEach(() => page.viewport(412, 915));

  /* The list opens short (no record yet) and fits below; once the records
     arrive the layer is held to the room below and never collided again. */
  it('opens above when the room below holds less than a usable list', async () => {
    const picker = (items: typeof MANY) => (
      <div style={{ insetBlockEnd: 75, insetInlineStart: 16, position: 'fixed', inlineSize: 300 }}>
        <EntityPicker aria-label="Owner" items={items} openOn="focus" searchDelay={0} />
      </div>
    );
    const view = render(picker([]));
    await userEvent.click(screen.getByRole('combobox', { name: 'Owner' }));
    view.rerender(picker(MANY.slice(0, 80)));
    await userEvent.keyboard('P');

    await vi.waitFor(() => {
      const positioner = document.querySelector<HTMLElement>('[data-part="positioner"][data-open]');
      expect(positioner?.getAttribute('data-side')).toBe('top');
      expect(positioner!.getBoundingClientRect().height).toBeGreaterThan(200);
    });
  });

  /* The room was read against the box that clips the trigger. Inside a popover that is the panel, and
     a trigger at the top of it had more of the panel below than above. */
  it('opens above inside a popover that has more of itself below the trigger', async () => {
    await page.viewport(1440, 1000);
    const filter = (items: typeof MANY) => (
      <div style={{ insetBlockEnd: 0, insetInlineStart: 400, position: 'fixed' }}>
        <Popover open side="top">
          <PopoverTrigger>Filter</PopoverTrigger>
          <PopoverLayer>
            <PopoverContent aria-label="Filter">
              <PopoverBody>
                <EntityPicker aria-label="Owner" items={items} openOn="focus" searchDelay={0} />
              </PopoverBody>
              <PopoverFooter>
                <button type="button">Apply</button>
              </PopoverFooter>
            </PopoverContent>
          </PopoverLayer>
        </Popover>
      </div>
    );
    const view = render(filter([]));
    const input = await screen.findByRole('combobox', { name: 'Owner' });
    await vi.waitFor(() => {
      const below = window.innerHeight - input.getBoundingClientRect().bottom;
      expect(below).toBeGreaterThan(50);
      expect(below).toBeLessThan(100);
    });
    await userEvent.click(input);
    view.rerender(filter(MANY.slice(0, 80)));
    await userEvent.keyboard('P');

    await vi.waitFor(() => {
      const list = document.querySelector<HTMLElement>(
        '[data-ui="entity-picker"][data-part="positioner"][data-open]',
      );
      expect(list?.getAttribute('data-side')).toBe('top');
      expect(list!.getBoundingClientRect().height).toBeGreaterThan(200);
    });
  });
});

/* Under a material panel the stuck label had no fill that fits: the rows end at its edge instead. */
describe('a stuck group label', () => {
  it('cuts the rows that pass under it, and paints nothing over the panel', async () => {
    const grouped = MANY.slice(0, 60).map((person, index) => ({
      ...person,
      group: index < 30 ? 'near' : 'far',
    }));
    render(
      <div
        style={{ '--slotted-entity-picker-surface': 'rgb(255 255 255 / 0.68)' } as CSSProperties}
      >
        <EntityPicker aria-label="Owner" items={grouped} openOn="focus" searchDelay={0} />
      </div>,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Owner' }));
    await screen.findAllByRole('option');
    const label = document.querySelector<HTMLElement>('[data-part="group-label"]')!;
    const list = document.querySelector<HTMLElement>('[data-part="content"]')!;

    list.style.maxBlockSize = '220px';
    list.scrollTop = 60;

    await vi.waitFor(() => expect(label.hasAttribute('data-stuck')).toBe(true));
    const edge = label.getBoundingClientRect().bottom;
    const under = [...document.querySelectorAll<HTMLElement>('[role="option"]')].filter(
      (option) => option.getBoundingClientRect().top < edge,
    );

    expect(under.length).toBeGreaterThan(0);
    for (const option of under) {
      const rect = option.getBoundingClientRect();
      const cut = Math.min(1, (edge - rect.top) / rect.height) * 100;
      const inset = Number.parseFloat(getComputedStyle(option).clipPath.slice('inset('.length));
      expect(Math.abs(inset - cut)).toBeLessThan(4);
    }
    expect(getComputedStyle(label).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});
