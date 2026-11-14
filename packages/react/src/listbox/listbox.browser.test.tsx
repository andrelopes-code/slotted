import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Listbox } from './listbox';
import { ListboxLabel, ListboxOption } from './listbox-parts';

/* Options drawn as separate cards: an edge, a distance between them, and an edge for the choice. */
describe('a listbox whose options are cards', () => {
  it('reads the option edge, gap, padding and chosen edge from its tokens', () => {
    render(
      <Listbox
        aria-label="Pay with"
        defaultValue="a"
        style={
          {
            '--slotted-listbox-option-border-width': '1px',
            '--slotted-listbox-option-gap': '6px',
            '--slotted-listbox-option-padding-block': '0',
            '--slotted-listbox-selected-border-color': 'rgb(255, 0, 0)',
          } as CSSProperties
        }
      >
        <ListboxOption value="a">
          <ListboxLabel>A</ListboxLabel>
        </ListboxOption>
        <ListboxOption value="b">
          <ListboxLabel>B</ListboxLabel>
        </ListboxOption>
      </Listbox>,
    );
    const [first, second] = [...document.querySelectorAll<HTMLElement>('[data-part="option"]')];
    const chosen = getComputedStyle(first!);
    const other = getComputedStyle(second!);
    const distance = second!.getBoundingClientRect().top - first!.getBoundingClientRect().bottom;

    expect(chosen.borderTopWidth).toBe('1px');
    expect(other.borderTopWidth).toBe('1px');
    expect(chosen.paddingTop).toBe('0px');
    expect(distance).toBeCloseTo(6, 1);
    expect(chosen.borderTopColor).toBe('rgb(255, 0, 0)');
    expect(other.borderTopColor).not.toBe('rgb(255, 0, 0)');
  });
});
