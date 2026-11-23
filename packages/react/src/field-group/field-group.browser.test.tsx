import { render } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';

import { Field, FieldLabel } from '../field';

import { FieldGroup, FieldGroupContent, FieldGroupLegend } from './index';

/**
 * A question's legend stands over its choices at the distance a field's label
 * stands over its control; a section's legend stands a step further from its
 * first field. Both were drawn at the section's distance.
 */
describe('the distance from a legend to the content', () => {
  it.each([
    ['question', '6px'],
    ['section', '20px'],
  ] as const)('of a %s is %s', (kind, gap) => {
    render(
      <FieldGroup kind={kind}>
        <FieldGroupLegend>Ends</FieldGroupLegend>
        <FieldGroupContent>
          <input aria-label="Never" type="radio" />
        </FieldGroupContent>
      </FieldGroup>,
    );
    const content = document.querySelector('[data-part="content"]') as HTMLElement;

    const margin = getComputedStyle(content).marginBlockStart;

    expect(margin).toBe(gap);
  });
});

/* A question's legend was drawn a step above the labels of the fields around it and read as a
   section's title. The control scale is written per density, and the steps differ. */
describe('the type of a legend', () => {
  const DENSITIES = {
    comfortable: { lg: '14px', md: '13px', sm: '12px' },
    dense: { lg: '13px', md: '11px', sm: '10px' },
  } as const;

  it.each(
    (['comfortable', 'dense'] as const).flatMap((density) =>
      (['sm', 'md', 'lg'] as const).map((size) => [size, density] as const),
    ),
  )('of a question is the label of a field, at %s in %s', (size, density) => {
    const { container } = render(
      <div style={controlScale(DENSITIES[density])}>
        <FieldGroup size={size}>
          <FieldGroupLegend>Ends</FieldGroupLegend>
        </FieldGroup>
        <Field size={size}>
          <FieldLabel>Name</FieldLabel>
        </Field>
      </div>,
    );

    const legend = getComputedStyle(container.querySelector('[data-part="legend"]')!);
    const label = getComputedStyle(container.querySelector('[data-part="label"]')!);

    expect(legend.fontSize).toBe(DENSITIES[density][size]);
    expect(legend.fontSize).toBe(label.fontSize);
  });

  it.each([
    ['sm', '13px'],
    ['md', '14px'],
    ['lg', '14px'],
  ] as const)('of a section stays a step above it, at %s', (size, expected) => {
    const { container } = render(
      <div style={controlScale(DENSITIES.comfortable)}>
        <FieldGroup kind="section" size={size}>
          <FieldGroupLegend>Address</FieldGroupLegend>
        </FieldGroup>
      </div>,
    );

    expect(getComputedStyle(container.querySelector('[data-part="legend"]')!).fontSize).toBe(
      expected,
    );
  });
});

function controlScale(steps: { lg: string; md: string; sm: string }) {
  return {
    '--slotted-control-font-size-lg': steps.lg,
    '--slotted-control-font-size-md': steps.md,
    '--slotted-control-font-size-sm': steps.sm,
  } as CSSProperties;
}
