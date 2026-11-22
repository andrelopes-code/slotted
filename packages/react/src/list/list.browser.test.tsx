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
