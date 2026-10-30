import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Form } from '../form';
import { NumberField } from '../number-field';
import { Field } from './field';
import { FieldLabel } from './field-parts';

const control = () => document.querySelector<HTMLElement>('[data-ui="number-field"]')!;

/**
 * Every control filled its container, so a day of the month stood as wide as a
 * description. The width of a field is a cue to the length of its answer.
 */
describe('a field with a width', () => {
  it('bounds its control by the step it names, read from the theme', () => {
    render(
      <Form style={{ inlineSize: '40rem' }}>
        <Field width="short">
          <FieldLabel>Day</FieldLabel>
          <NumberField />
        </Field>
      </Form>,
    );
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    expect(control().getBoundingClientRect().width).toBe(6 * rem);

    document.documentElement.style.setProperty('--slotted-field-width-short', '8rem');
    expect(control().getBoundingClientRect().width).toBe(8 * rem);
    document.documentElement.style.removeProperty('--slotted-field-width-short');
  });

  it('bounds its control at medium, and fills the field at full', () => {
    render(
      <Form style={{ inlineSize: '40rem' }}>
        <Field width="medium">
          <FieldLabel>Amount</FieldLabel>
          <NumberField />
        </Field>
        <Field>
          <FieldLabel>Count</FieldLabel>
          <NumberField />
        </Field>
      </Form>,
    );
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const [medium, full] = [...document.querySelectorAll<HTMLElement>('[data-ui="number-field"]')];

    expect(medium!.getBoundingClientRect().width).toBe(15 * rem);
    expect(full!.getBoundingClientRect().width).toBe(40 * rem);
  });

  it('shrinks under its bound in a narrower container', () => {
    render(
      <Form style={{ inlineSize: '4rem' }}>
        <Field width="short">
          <FieldLabel>Day</FieldLabel>
          <NumberField />
        </Field>
      </Form>,
    );
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    expect(control().getBoundingClientRect().width).toBeLessThanOrEqual(4 * rem);
  });
});
