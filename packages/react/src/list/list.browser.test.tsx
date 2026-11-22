import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { ListItem, ListItemBody, ListItemLabel } from '../list-item';
import { List, ListSection } from './index';
import type { ListVariant } from './index';

function stickyLabel(variant: ListVariant, style?: CSSProperties) {
  const { container } = render(
    <div style={style}>
      <List variant={variant}>
        <ListSection end="12" label="Today" sticky>
          <ListItem>
            <ListItemBody>
              <ListItemLabel>Row</ListItemLabel>
            </ListItemBody>
          </ListItem>
        </ListSection>
      </List>
    </div>,
  );

  return {
    label: getComputedStyle(container.querySelector('[data-part="section-label"]')!),
    list: getComputedStyle(container.querySelector('[data-ui="list"]')!),
  };
}

describe('a sticky group heading', () => {
  it('paints the ground the consumer names for a plain list', () => {
    const { label } = stickyLabel('plain', {
      '--slotted-list-section-background': 'rgb(1, 2, 3)',
    } as CSSProperties);

    expect(label.backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('paints the list background of a framed list without the token', () => {
    const { label, list } = stickyLabel('framed', {
      '--slotted-list-background': 'rgb(4, 5, 6)',
    } as CSSProperties);

    expect(list.backgroundColor).toBe('rgb(4, 5, 6)');
    expect(label.backgroundColor).toBe('rgb(4, 5, 6)');
  });
});

describe('a list with the inset fill', () => {
  function pressedRow(fill?: 'inset') {
    const { container } = render(
      <div style={{ inlineSize: 390 }}>
        <List fill={fill}>
          <ListItem selected>
            <ListItemBody>
              <ListItemLabel>Row</ListItemLabel>
            </ListItemBody>
          </ListItem>
        </List>
      </div>,
    );
    const row = container.querySelector<HTMLElement>('[data-ui="list-item"]')!;

    return {
      label: container.querySelector('[data-part="label"]')!.getBoundingClientRect(),
      row,
      tile: getComputedStyle(row, '::after'),
    };
  }

  it('draws the ground as a rounded tile inside the gutter and leaves the content in place', () => {
    const inset = pressedRow('inset');
    const gutter = parseFloat(inset.tile.left);
    const plainLabel = pressedRow().label;

    expect(gutter).toBeGreaterThan(0);
    expect(parseFloat(inset.tile.right)).toBe(gutter);
    expect(parseFloat(inset.tile.borderTopLeftRadius)).toBeGreaterThan(0);
    expect(inset.tile.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(inset.row).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(inset.label.left).toBe(plainLabel.left);
  });
});
