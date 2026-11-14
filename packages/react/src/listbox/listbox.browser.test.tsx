import { fireEvent, render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Listbox } from './listbox';
import { ListboxGroup, ListboxLabel, ListboxOption } from './listbox-parts';

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

/* A group may lay its options out in a column count of its own, inside one listbox. */
describe('a listbox whose groups have their own column counts', () => {
  function open() {
    render(
      <Listbox aria-label="Pay with" columns={1}>
        <ListboxGroup label="Accounts">
          {['a', 'b'].map((key) => (
            <ListboxOption key={key} value={key}>
              <ListboxLabel>{key.toUpperCase()}</ListboxLabel>
            </ListboxOption>
          ))}
        </ListboxGroup>
        <ListboxGroup columns={2} label="Cards">
          {['c', 'd'].map((key) => (
            <ListboxOption key={key} value={key}>
              <ListboxLabel>{key.toUpperCase()}</ListboxLabel>
            </ListboxOption>
          ))}
        </ListboxGroup>
      </Listbox>,
    );
    const options = Object.fromEntries(
      [...document.querySelectorAll<HTMLElement>('[data-part="option"]')].map((node) => [
        node.dataset['key'],
        node,
      ]),
    );
    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;

    return { listbox, options };
  }

  function current() {
    return document.querySelector<HTMLElement>('[data-part="option"][data-current]')?.dataset[
      'key'
    ];
  }

  it('lays out one option per row in the first group and two in the second', () => {
    const { options } = open();
    const top = (key: string) => options[key]!.getBoundingClientRect().top;

    expect(top('b')).toBeGreaterThan(top('a'));
    expect(top('d')).toBe(top('c'));
  });

  it('steps by the columns of the active option’s group', () => {
    const { listbox } = open();

    listbox.focus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(current()).toBe('a');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(current()).toBe('a');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(current()).toBe('b');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(current()).toBe('c');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(current()).toBe('d');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(current()).toBe('d');
  });
});
