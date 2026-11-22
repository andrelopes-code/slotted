import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import { Inline } from '../inline';
import { Heading, Text } from './index';

describe('the box of a text', () => {
  it('is trimmed on the root when asked, and left whole by default', () => {
    const { container } = render(
      <>
        <Text data-testid="both" textBox="both">
          Both
        </Text>
        <Text data-testid="start" textBox={{ trim: 'start', edge: 'cap' }}>
          Start
        </Text>
        <Heading
          data-testid="heading"
          textBox={{ trim: 'end', edge: { over: 'cap', under: 'alphabetic' } }}
        >
          Heading
        </Heading>
        <Text data-testid="none">None</Text>
      </>,
    );
    const style = (id: string) =>
      getComputedStyle(container.querySelector(`[data-testid="${id}"]`)!);

    expect(style('both').textBoxTrim).toBe('trim-both');
    expect(style('both').textBoxEdge).toBe('cap alphabetic');
    expect(style('start').textBoxTrim).toBe('trim-start');
    expect(style('start').textBoxEdge).toBe('cap text');
    expect(style('heading').textBoxTrim).toBe('trim-end');
    expect(style('none').textBoxTrim).toBe('none');
  });

  it('reads the theme’s edge, as a button’s label does', () => {
    const { container } = render(
      <div style={{ '--slotted-text-box-edge': 'text alphabetic' } as CSSProperties}>
        <Text data-testid="text" textBox="both">
          Text
        </Text>
        <Button>Label</Button>
      </div>,
    );

    expect(getComputedStyle(container.querySelector('[data-testid="text"]')!).textBoxEdge).toBe(
      'text alphabetic',
    );
    expect(getComputedStyle(container.querySelector('[data-part="label"]')!).textBoxEdge).toBe(
      'text alphabetic',
    );
  });

  it('lines two sizes up on one top edge, each box as tall as its cap height', () => {
    const { container } = render(
      <Inline align="start" gap={2}>
        <Text data-testid="large" size="2xl" textBox="both" weight="semibold">
          1,240.00
        </Text>
        <Text data-testid="small" size="xs" textBox="both" tone="muted">
          per month
        </Text>
      </Inline>,
    );
    const box = (id: string) => container.querySelector(`[data-testid="${id}"]`)!;
    const large = box('large').getBoundingClientRect();
    const small = box('small').getBoundingClientRect();
    const cap = (element: Element) => parseFloat(getComputedStyle(element).fontSize) * 0.75;

    expect(Math.abs(large.top - small.top)).toBeLessThan(1);
    expect(Math.abs(large.height - cap(box('large')))).toBeLessThan(1.5);
    expect(Math.abs(small.height - cap(box('small')))).toBeLessThan(1.5);
  });
});
