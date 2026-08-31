import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field } from '../field/field';
import { FieldLabel } from '../field/field-label';
import { Input } from '../input/input';
import { Fieldset } from './fieldset';
import { FieldsetLegend } from './fieldset-legend';

const renderGroup = (props: Record<string, unknown> = {}) => {
  render(
    <Fieldset {...props}>
      <FieldsetLegend>Notifications</FieldsetLegend>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input />
      </Field>
    </Fieldset>,
  );
  return screen.getByRole('group');
};

describe('Fieldset', () => {
  it('is the native grouping element, named by its legend', () => {
    const fieldset = renderGroup();
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset).toHaveAccessibleName('Notifications');
    expect(fieldset).toHaveAttribute('data-orientation', 'vertical');
  });

  it('adds no ARIA, because the elements already carry the semantics', () => {
    const fieldset = renderGroup();
    expect(fieldset).not.toHaveAttribute('role');
    expect(fieldset).not.toHaveAttribute('aria-label');
    expect(fieldset).not.toHaveAttribute('aria-labelledby');
  });

  /**
   * `input.disabled` reflects the control's own attribute and stays false, by
   * specification, however the fieldset around it is set. What changes is that
   * the control becomes *actually* disabled: it matches `:disabled`, which is
   * both what makes it inert and what the stylesheet keys its appearance on.
   */
  it('disables every control inside through the native attribute alone', () => {
    const fieldset = renderGroup({ disabled: true });
    expect(fieldset).toBeDisabled();
    expect(fieldset).toHaveAttribute('data-disabled', '');

    const control = screen.getByRole('textbox');
    expect(control.matches(':disabled')).toBe(true);
    expect(control).not.toHaveAttribute('disabled');
  });

  it('leaves the controls alone when it is not disabled', () => {
    renderGroup();
    expect(screen.getByRole('textbox').matches(':disabled')).toBe(false);
  });

  it('carries the orientation it was given', () => {
    const fieldset = renderGroup({ orientation: 'horizontal' });
    expect(fieldset).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('marks itself invalid without touching what it groups', () => {
    const fieldset = renderGroup({ invalid: true });
    expect(fieldset).toHaveAttribute('data-invalid', '');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-invalid');
  });

  it('keeps the class the consumer added', () => {
    const fieldset = renderGroup({ className: 'app-group' });
    expect(fieldset).toHaveClass('slotted-fieldset', 'app-group');
  });

  it('marks the legend as its part, so the stylesheet can reach it', () => {
    renderGroup();
    expect(screen.getByText('Notifications')).toHaveAttribute('data-part', 'legend');
  });
});
