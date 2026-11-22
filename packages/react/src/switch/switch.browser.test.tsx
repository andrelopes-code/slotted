import { render } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { Field, FieldLabel } from '../field';
import { Inline } from '../inline';
import { TextField } from '../text-field';
import { Switch } from './index';

/* No transition, so the computed colors are the end state. */
const still = (node: ReactNode) =>
  render(
    <div
      style={
        {
          '--slotted-control-transition-duration': '0s',
          '--slotted-switch-invalid-border-color': 'rgb(200, 0, 0)',
        } as CSSProperties
      }
    >
      {node}
    </div>,
  );

const parts = (container: HTMLElement) => ({
  thumb: getComputedStyle(container.querySelector('[data-part="thumb"]')!),
  track: getComputedStyle(container.querySelector('[data-part="track"]')!),
});

describe('an invalid switch', () => {
  it.each([true, false])('marks the outer edge of the track alone, checked %s', (checked) => {
    const valid = parts(
      still(<Switch aria-label="Feed" checked={checked} onCheckedChange={() => {}} />).container,
    );
    const invalid = parts(
      still(<Switch aria-label="Feed" checked={checked} invalid onCheckedChange={() => {}} />)
        .container,
    );

    /* One edge outside the track's border, in the invalid color, and nothing inset. */
    expect(invalid.track.boxShadow).toMatch(/^rgb\(200, 0, 0\) 0px 0px 0px \d/);
    expect(invalid.track.boxShadow).not.toContain('inset');
    expect(invalid.thumb.boxShadow).toBe(valid.thumb.boxShadow);
    expect(invalid.thumb.borderTopColor).toBe(valid.thumb.borderTopColor);
  });
});

describe('a switch in a row of fields', () => {
  const center = (element: Element) => {
    const box = element.getBoundingClientRect();
    return box.top + box.height / 2;
  };

  it.each([
    ['md', {}],
    /* The height of the field's control, which the test theme leaves at its fallback. */
    ['sm', { '--slotted-switch-control-block-size': '34px' }],
  ] as const)('sits a %s pill on the line of the controls', (size, style) => {
    const { container } = render(
      <Inline align="end" gap={3} wrap="nowrap">
        <Field>
          <FieldLabel>Rate</FieldLabel>
          <TextField />
        </Field>
        <Switch size={size} style={style as CSSProperties} variant="control">
          Exempt
        </Switch>
      </Inline>,
    );
    const input = container.querySelector('[data-ui="text-field"][data-part="root"]')!;
    const track = container.querySelector('[data-ui="switch"] [data-part="track"]')!;

    expect(Math.abs(center(track) - center(input))).toBeLessThan(0.5);
  });
});
