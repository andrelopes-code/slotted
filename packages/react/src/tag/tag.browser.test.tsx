import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

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
