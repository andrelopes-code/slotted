import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Inline } from '../inline';
import { Tag } from '../tag';
import { Collapsible } from './collapsible';
import { CollapsibleHeader, CollapsiblePanel, CollapsibleTrigger } from './collapsible-parts';
import type { CollapsibleSize } from './collapsible.types';

const center = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.top + box.height / 2;
};

/* A control height above padding plus one line leaves the trigger free block
   space, which is where the empty description row took its share. */
const tallControls = {
  '--slotted-control-height-sm': '48px',
  '--slotted-control-height-md': '52px',
  '--slotted-control-height-lg': '56px',
} as CSSProperties;

describe('Collapsible trigger without a description', () => {
  it.each<CollapsibleSize>(['sm', 'md', 'lg'])(
    'centers the label and the indicator on the trigger at size %s',
    (size) => {
      render(
        <div style={tallControls}>
          <Collapsible size={size}>
            <CollapsibleHeader>
              <CollapsibleTrigger>Sources: 3</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>Body</CollapsiblePanel>
          </Collapsible>
        </div>,
      );
      const trigger = document.querySelector('[data-part="trigger"]') as HTMLElement;
      const label = trigger.querySelector('[data-part="label"]') as HTMLElement;
      const indicator = trigger.querySelector('[data-part="indicator"]') as HTMLElement;

      expect(trigger.getBoundingClientRect().height).toBeGreaterThan(label.offsetHeight + 12);
      expect(Math.abs(center(label) - center(trigger))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(center(indicator) - center(trigger))).toBeLessThanOrEqual(0.5);
    },
  );
});

describe('Collapsible panel content', () => {
  it('reserves as much space above the content as below it while open', () => {
    render(
      <Collapsible defaultOpen size="lg" variant="framed">
        <CollapsibleHeader>
          <CollapsibleTrigger description="Steps and formula">
            How it is calculated
          </CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>
          <p>First line of the content.</p>
        </CollapsiblePanel>
      </Collapsible>,
    );
    const content = getComputedStyle(document.querySelector('[data-part="content"]')!);

    expect(content.paddingBlockStart).toBe(content.paddingBlockEnd);
    expect(content.paddingBlockStart).not.toBe('0px');
  });

  it('holds no space above the content while closed', () => {
    render(
      <Collapsible>
        <CollapsibleHeader>
          <CollapsibleTrigger>Sources</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Body</CollapsiblePanel>
      </Collapsible>,
    );

    expect(
      getComputedStyle(document.querySelector('[data-part="content"]')!).paddingBlockStart,
    ).toBe('0px');
  });
});

/**
 * A closed disclosure states what it holds at the end of the title's line:
 * the summary shares the title's line, ends before the mark, is cut with an
 * ellipsis when it does not fit, and is part of the trigger's name.
 */
describe('a trigger with a summary', () => {
  const scene = (summary: string) => {
    const { container } = render(
      <div style={{ inlineSize: 320 }}>
        <Collapsible>
          <CollapsibleHeader>
            <CollapsibleTrigger summary={summary}>Usage and limits</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Content</CollapsiblePanel>
        </Collapsible>
      </div>,
    );
    const box = (part: string) =>
      container.querySelector(`[data-part="${part}"]`)!.getBoundingClientRect();

    return { container, indicator: box('indicator'), label: box('label'), summary: box('summary') };
  };

  it('shares the title line and ends before the mark', () => {
    const { container, indicator, label, summary } = scene('65 requests today');

    expect(
      Math.abs(summary.top + summary.height / 2 - (label.top + label.height / 2)),
    ).toBeLessThan(2);
    expect(summary.left).toBeGreaterThanOrEqual(label.right);
    expect(summary.right).toBeLessThanOrEqual(indicator.left);
    expect(container.querySelector('button')).toHaveAccessibleName(
      'Usage and limits 65 requests today',
    );
  });

  it('cuts a long summary with an ellipsis and keeps the title whole', () => {
    const { container, indicator, label, summary } = scene(
      '65 requests today · 1 paused · 3 over the monthly limit of the plan',
    );
    const part = container.querySelector<HTMLElement>('[data-part="summary"]')!;

    expect(part.scrollWidth).toBeGreaterThan(part.clientWidth);
    expect(label.height).toBeLessThan(30);
    expect(summary.right).toBeLessThanOrEqual(indicator.left);
  });
});

describe('a framed collapsible', () => {
  it('occupies the width of its container, border included', () => {
    const { container } = render(
      <div style={{ display: 'grid', inlineSize: 300 }}>
        <Collapsible variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger>More</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Body</CollapsiblePanel>
        </Collapsible>
      </div>,
    );
    const root = container.querySelector<HTMLElement>('[data-ui="collapsible"]')!;

    expect(root.getBoundingClientRect().width).toBe(300);
  });
});

describe('a label that holds an element taller than its line', () => {
  it.each<CollapsibleSize>(['sm', 'md', 'lg'])(
    'centers the indicator on the label at size %s',
    (size) => {
      const { container } = render(
        <Collapsible size={size} variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger>
              <Inline gap={3}>
                <span>Other</span>
                <Tag size="sm">32</Tag>
              </Inline>
            </CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Body</CollapsiblePanel>
        </Collapsible>,
      );
      const indicator = container.querySelector('[data-part="indicator"]')!;
      const label = container.querySelector('[data-part="label"]')!;

      expect(Math.abs(center(indicator) - center(label))).toBeLessThan(1);
    },
  );

  it('keeps the indicator on the first line of a title that wraps', () => {
    const { container } = render(
      <div style={{ inlineSize: 160 }}>
        <Collapsible>
          <CollapsibleHeader>
            <CollapsibleTrigger>A title long enough to wrap onto three lines here</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Body</CollapsiblePanel>
        </Collapsible>
      </div>,
    );
    const indicator = container.querySelector('[data-part="indicator"]')!;
    const label = container.querySelector<HTMLElement>('[data-part="label"]')!;
    const line = parseFloat(getComputedStyle(label).lineHeight);
    const firstLine = label.getBoundingClientRect().top + line / 2;

    expect(label.getBoundingClientRect().height).toBeGreaterThan(line * 2);
    expect(Math.abs(center(indicator) - firstLine)).toBeLessThan(1);
  });
});
