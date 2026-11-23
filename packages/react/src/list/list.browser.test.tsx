import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Glyph, Icon } from '../icon';
import {
  ListItem,
  ListItemBody,
  ListItemButton,
  ListItemEnd,
  ListItemLabel,
  ListItemStart,
} from '../list-item';
import { List, ListSection } from './index';
import type { ListProps, ListVariant } from './index';

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

/* The tile sat inside the list's content box: either the icon touched the tile's edge or the content
   left the page margin. The tile reaches past the content, which keeps the container's inline edge. */
describe('a list with the inset fill in a page container', () => {
  const REACH = 10;

  function mount(props: ListProps = {}) {
    const { container } = render(
      <div
        data-testid="page"
        style={
          {
            '--slotted-list-fill-inset': `${REACH}px`,
            '--slotted-list-item-border-color': 'rgb(1, 2, 3)',
            boxSizing: 'border-box',
            inlineSize: 390,
            paddingInline: 16,
          } as CSSProperties
        }
      >
        <p>Page text</p>
        <List fill="inset" {...props}>
          <ListSection label="Today">
            <ListItem>
              <ListItemButton>
                <ListItemStart>
                  <Icon>
                    <Glyph name="circle-info" />
                  </Icon>
                </ListItemStart>
                <ListItemBody>
                  <ListItemLabel>First</ListItemLabel>
                </ListItemBody>
                <ListItemEnd>12.00</ListItemEnd>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemBody>
                  <ListItemLabel>Second</ListItemLabel>
                </ListItemBody>
              </ListItemButton>
            </ListItem>
            <ListItem selected>
              <ListItemButton>
                <ListItemBody>
                  <ListItemLabel>Third</ListItemLabel>
                </ListItemBody>
              </ListItemButton>
            </ListItem>
          </ListSection>
        </List>
      </div>,
    );
    const box = (selector: string) => container.querySelector(selector)!.getBoundingClientRect();

    return {
      box,
      page: container.querySelector<HTMLElement>('[data-testid="page"]')!,
      rows: [...container.querySelectorAll<HTMLElement>('[data-ui="list-item"]')],
      text: box('p'),
    };
  }

  it('keeps the leading icon, the label and the end on the inline edges of the page text', () => {
    const { box, text } = mount();

    expect(box('[data-part="start"] [data-ui="icon"]').left).toBeCloseTo(text.left, 1);
    expect(box('[data-part="end"]').right).toBeCloseTo(text.right, 1);
    const name = document.createRange();
    name.selectNodeContents(document.querySelector('[data-part="section-label"]')!);
    expect(name.getBoundingClientRect().left).toBeCloseTo(text.left, 1);
  });

  it('starts the pressed tile the token before the text, with the row radius, and presses there', async () => {
    const { rows, text } = mount();
    const row = rows[0]!;
    const tile = row.getBoundingClientRect();

    expect(tile.left).toBeCloseTo(text.left - REACH, 1);
    expect(tile.right).toBeCloseTo(text.right + REACH, 1);
    expect(parseFloat(getComputedStyle(row).borderTopLeftRadius)).toBeGreaterThan(0);
    expect(
      document.elementFromPoint(tile.left + 2, tile.top + tile.height / 2)?.closest('button'),
    ).not.toBeNull();
    expect(getComputedStyle(rows[2]!).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('widens no page that pads its content by as much', () => {
    const { page } = mount();

    expect(page.scrollWidth).toBe(page.clientWidth);
  });

  it('draws the rule between rows from edge to edge of the content', () => {
    const { rows } = mount({ variant: 'ruled' });
    const rule = getComputedStyle(rows[1]!, '::after');

    expect(rule.left).toBe(`${REACH}px`);
    expect(rule.right).toBe(`${REACH}px`);
    expect(rule.boxShadow).toContain('rgb(1, 2, 3)');
    expect(getComputedStyle(rows[1]!).boxShadow).not.toContain('rgb(1, 2, 3)');
  });

  it('leaves a framed list to its frame', () => {
    const { box, text } = mount({ variant: 'framed' });

    expect(box('[data-ui="list"]').left).toBeCloseTo(text.left, 1);
  });
});
