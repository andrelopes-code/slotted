import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Glyph } from '../icon';
import { Inline } from '../inline';
import { List } from '../list';
import {
  ListItem,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemLabel,
} from '../list-item';
import { Tag } from './tag';
import { TagToggle } from './tag-toggle';

const root = (name: string) =>
  [...document.querySelectorAll<HTMLElement>('[data-ui="tag"][data-part="root"]')].find(
    (element) => element.textContent === name,
  )!;

describe('a dashed tag', () => {
  it('draws the outline edge in dashes, and a solid edge once selected', () => {
    render(
      <>
        <Tag variant="outline">Outline</Tag>
        <Tag variant="dashed">Dashed</Tag>
        <TagToggle selected variant="dashed">
          Picked
        </TagToggle>
      </>,
    );
    const outline = getComputedStyle(root('Outline'));
    const dashed = getComputedStyle(root('Dashed'));

    expect(dashed.borderTopStyle).toBe('dashed');
    expect(dashed.borderTopColor).toBe(outline.borderTopColor);
    expect(dashed.backgroundColor).toBe(outline.backgroundColor);
    expect(getComputedStyle(root('Picked')).borderTopStyle).toBe('solid');
  });
});

/**
 * A theme widens the room between a tag's edge and its text at every size
 * through one token; the body beside a remove button keeps its end gap.
 */
describe('the inline inset of a tag', () => {
  it('reads --slotted-tag-inset-inline at the sm size', () => {
    render(
      <>
        <Tag size="sm" variant="outline">
          Default
        </Tag>
        <div style={{ '--slotted-tag-inset-inline': '0.5rem' } as CSSProperties}>
          <Tag size="sm" variant="outline">
            Themed
          </Tag>
          <Tag onRemove={() => undefined} size="sm" variant="outline">
            Removable
          </Tag>
        </div>
      </>,
    );
    const body = (name: string) =>
      getComputedStyle(
        [...document.querySelectorAll<HTMLElement>('[data-ui="tag"] [data-part="body"]')].find(
          (element) => element.textContent === name,
        )!,
      );

    expect(body('Default').paddingInlineStart).toBe('6px');
    expect(body('Themed').paddingInlineStart).toBe('8px');
    expect(body('Removable').paddingInlineEnd).toBe('4px');
  });
});

describe('a tag in a flex row narrower than it', () => {
  it('shrinks inside the row and cuts its label with an ellipsis', () => {
    const { container } = render(
      <div style={{ display: 'flex', inlineSize: '10rem' }}>
        <span>Name</span>
        <Tag size="sm">a label longer than the remaining space</Tag>
      </div>,
    );
    const row = container.firstElementChild!;
    const tag = row.querySelector<HTMLElement>('[data-ui="tag"][data-part="root"]')!;
    const label = tag.querySelector<HTMLElement>('[data-part="label"]')!;

    expect(tag.getBoundingClientRect().right).toBeLessThanOrEqual(
      row.getBoundingClientRect().right + 0.5,
    );
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  });
});

/**
 * A chip taller than the line of a title pushed the description away from it,
 * and two items of one list stood at two heights.
 */
describe('an inline tag beside a title', () => {
  it.each(
    (['sm', 'md', 'lg'] as const).flatMap((list) =>
      (['sm', 'md', 'lg'] as const).flatMap((size) =>
        (['soft', 'solid', 'outline', 'dashed'] as const).map((variant) => ({
          list,
          size,
          variant,
        })),
      ),
    ),
  )('adds nothing to the line of a $list list at $size in $variant', ({ list, size, variant }) => {
    const { container } = render(
      <div style={{ fontSize: 14 }}>
        <List size={list}>
          <ListItem>
            <ListItemContent>
              <ListItemBody>
                <ListItemLabel>
                  <Inline gap={3}>
                    First item{' '}
                    <Tag inline size={size} variant={variant}>
                      New
                    </Tag>
                  </Inline>
                </ListItemLabel>
                <ListItemDescription>Description</ListItemDescription>
              </ListItemBody>
            </ListItemContent>
          </ListItem>
          <ListItem>
            <ListItemContent>
              <ListItemBody>
                <ListItemLabel>Second item</ListItemLabel>
                <ListItemDescription>Description</ListItemDescription>
              </ListItemBody>
            </ListItemContent>
          </ListItem>
        </List>
      </div>,
    );
    const boxes = (part: string) =>
      [...container.querySelectorAll(`[data-part="${part}"]`)]
        .filter((element) => element.closest('[data-ui="tag"]') === null)
        .map((element) => element.getBoundingClientRect());
    const [tagged, plain] = boxes('label') as [DOMRect, DOMRect];
    const [below, belowPlain] = boxes('description') as [DOMRect, DOMRect];
    const tag = container.querySelector('[data-ui="tag"]')!.getBoundingClientRect();

    expect(Math.abs(tagged.height - plain.height)).toBeLessThanOrEqual(0.5);
    expect(
      Math.abs(below.top - tagged.bottom - (belowPlain.top - plain.bottom)),
    ).toBeLessThanOrEqual(0.5);
    expect(tagged.top - tag.top).toBeLessThanOrEqual(0.5);
    expect(tag.bottom - tagged.bottom).toBeLessThanOrEqual(0.5);
  });

  it('keeps the line of a paragraph it stands in, and its own line when it wraps', () => {
    const { container } = render(
      <div style={{ font: '14px/1.4 sans-serif', inlineSize: 120 }}>
        <p style={{ margin: 0 }}>
          Short{' '}
          <Tag inline size="sm">
            New
          </Tag>
        </p>
        <p style={{ margin: 0 }}>Short</p>
        <p style={{ margin: 0 }}>
          A title of a line{' '}
          <Tag inline size="sm">
            New
          </Tag>
        </p>
      </div>,
    );
    const [tagged, plain, wrapped] = [...container.querySelectorAll('p')].map(
      (element) => element.getBoundingClientRect().height,
    ) as [number, number, number];

    expect(Math.abs(tagged - plain)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(wrapped - 2 * plain)).toBeLessThanOrEqual(0.5);
  });

  it('keeps a removable tag inside the line', () => {
    const { container } = render(
      <p style={{ font: '14px/1.4 sans-serif', margin: 0 }}>
        Title{' '}
        <Tag end={<Glyph name="check" />} inline onRemove={() => undefined} size="lg">
          New
        </Tag>
      </p>,
    );

    expect(container.querySelector('p')!.getBoundingClientRect().height).toBeCloseTo(19.6, 0);
  });
});
