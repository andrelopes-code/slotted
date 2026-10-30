import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field, FieldLabel } from '../field';
import { FieldGroup, FieldGroupLegend } from '../field-group';
import { TextField } from '../text-field';
import { Form } from './form';
import { FormActions, FormAside } from './form-parts';

/**
 * A form written from the minimal example — fields as direct children of the
 * form — rendered its fields touching: the root is a block and drew no
 * distance between them.
 */
describe('fields written directly inside a form', () => {
  it('stand apart by a step of the space scale', () => {
    render(
      <Form>
        <Field>
          <FieldLabel>A</FieldLabel>
          <TextField name="a" />
        </Field>
        <Field>
          <FieldLabel>B</FieldLabel>
          <TextField name="b" />
        </Field>
      </Form>,
    );
    const [first, second] = [...document.querySelectorAll('[data-ui="field"]')] as HTMLElement[];

    expect(
      second!.getBoundingClientRect().top - first!.getBoundingClientRect().bottom,
    ).toBeGreaterThan(0);
  });
});

/**
 * Two sections stood 1rem apart, the gap between two fields of one section, so
 * a form split into topics showed no structure.
 */
describe('sections written directly inside a form', () => {
  it('stand apart by the section gap, and their fields by the field gap', () => {
    render(
      <Form>
        <FieldGroup>
          <FieldGroupLegend>Value</FieldGroupLegend>
          <Field>
            <FieldLabel>A</FieldLabel>
            <TextField name="a" />
          </Field>
        </FieldGroup>
        <FieldGroup>
          <FieldGroupLegend>When</FieldGroupLegend>
          <Field>
            <FieldLabel>B</FieldLabel>
            <TextField name="b" />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel>C</FieldLabel>
          <TextField name="c" />
        </Field>
        <Field>
          <FieldLabel>D</FieldLabel>
          <TextField name="d" />
        </Field>
      </Form>,
    );
    const form = document.querySelector<HTMLElement>('[data-ui="form"]')!;
    form.style.setProperty('--slotted-form-section-gap', '40px');
    form.style.setProperty('--slotted-form-field-gap', '12px');
    const [first, second] = [
      ...form.querySelectorAll(':scope > [data-ui="field-group"]'),
    ] as HTMLElement[];
    const [third, fourth] = [
      ...form.querySelectorAll(':scope > [data-ui="field"]'),
    ] as HTMLElement[];

    expect(second!.getBoundingClientRect().top - first!.getBoundingClientRect().bottom).toBe(40);
    expect(fourth!.getBoundingClientRect().top - third!.getBoundingClientRect().bottom).toBe(12);
  });
});

/**
 * A form page with content about the whole record — a preview, a summary in
 * words — built its own grid and its own sticky offset for it.
 */
describe('a form with an aside', () => {
  const draw = (inlineSize: string) =>
    render(
      <Form style={{ inlineSize }}>
        <Field>
          <FieldLabel>A</FieldLabel>
          <TextField name="a" />
        </Field>
        <Field>
          <FieldLabel>B</FieldLabel>
          <TextField name="b" />
        </Field>
        <FormAside>Preview</FormAside>
        <FormActions>
          <button type="submit">Save</button>
        </FormActions>
      </Form>,
    );
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
  const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();

  it('sets the fields in a bounded column and the aside beside it at the end', () => {
    draw('80rem');
    const form = box('[data-ui="form"][data-part="root"]');
    const field = box('[data-ui="field"]');
    const aside = box('[data-part="aside"]');

    expect(field.width).toBe(40 * rem());
    expect(aside.width).toBe(20 * rem());
    expect(aside.left).toBeGreaterThanOrEqual(field.right);
    expect(aside.top).toBeGreaterThanOrEqual(field.top);
    expect(aside.top).toBeLessThan(field.bottom);
    expect(aside.right).toBe(form.right);
    expect(getComputedStyle(document.querySelector('[data-part="aside"]')!).position).toBe(
      'sticky',
    );
  });

  it('sets the aside after the last field in a narrow form', () => {
    draw('50rem');
    const fields = [...document.querySelectorAll('[data-ui="field"]')];
    const last = fields.at(-1)!.getBoundingClientRect();
    const aside = box('[data-part="aside"]');

    expect(aside.top).toBeGreaterThan(last.bottom);
    expect(aside.left).toBe(last.left);
  });

  it('bounds the fields of a form without one', () => {
    render(
      <Form style={{ inlineSize: '80rem' }}>
        <Field>
          <FieldLabel>A</FieldLabel>
          <TextField name="a" />
        </Field>
      </Form>,
    );

    expect(box('[data-ui="field"]').width).toBe(40 * rem());
  });
});
