import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/radio-group/contract.json';
import { Field, FieldLabel } from '../field';
import { FieldGroup, FieldGroupLegend } from '../field-group';
import type {
  RadioGroupLabelPlacement,
  RadioGroupOrientation,
  RadioGroupSize,
  RadioGroupVariant,
} from '../index';
import { RadioGroup } from './radio-group';
import type { RadioGroupProps } from './radio-group.types';
import { RadioGroupDefaultsProvider } from './radio-group-defaults';
import { Radio } from './radio-group-parts';

const OPTIONS = ['standard', 'express', 'pickup'];

const items = () => screen.getAllByRole('radio') as HTMLInputElement[];
const item = (index: number) => items()[index] as HTMLInputElement;
const group = () => screen.getByRole('radiogroup');

function Shipping(props: Partial<RadioGroupProps>) {
  return (
    <RadioGroup aria-label="Envio" {...props}>
      {OPTIONS.map((option) => (
        <Radio key={option} value={option}>
          {option}
        </Radio>
      ))}
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('names every axis the contract lists as a type the entry point exports', () => {
    const axes: {
      size: readonly RadioGroupSize[];
      variant: readonly RadioGroupVariant[];
      orientation: readonly RadioGroupOrientation[];
      labelPlacement: readonly RadioGroupLabelPlacement[];
    } = {
      size: ['sm', 'md', 'lg'],
      variant: ['plain', 'tile'],
      orientation: ['vertical', 'horizontal'],
      labelPlacement: ['end', 'start'],
    };
    expect(axes).toEqual(contract.axes);
  });

  it('is selected in public by the family identifier and its parts', () => {
    render(<Shipping className="page-set" />);

    expect(group().tagName).toBe('DIV');
    expect(group()).toHaveAttribute('data-ui', 'radio-group');
    expect(group()).toHaveAttribute('data-part', 'root');
    expect(group()).toHaveClass('page-set');

    const row = item(0).parentElement as HTMLElement;
    expect(row).toHaveAttribute('data-part', 'item');
    expect(item(0)).toHaveAttribute('data-part', 'control');
    expect(row.querySelector('[data-part="indicator"] svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'dot',
    );
    expect(row.querySelector('[data-part="label"]')).toHaveTextContent('standard');
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<Shipping />);
    expect(group()).toHaveAttribute('data-size', contract.members.radioGroup.defaults.size);
    expect(group()).toHaveAttribute(
      'data-orientation',
      contract.members.radioGroup.defaults.orientation,
    );
  });

  /**
   * The whole keyboard model is the platform's, and a shared `name` within the
   * form owner is what buys it. An unnamed group is not a group, so one is
   * generated.
   */
  it('groups its items by one name, generating one when the consumer writes none', () => {
    render(<Shipping />);
    const names = new Set(items().map((radio) => radio.getAttribute('name')));
    expect(names.size).toBe(1);
    expect([...names][0]).toMatch(/^slotted-radio-group-/);
    expect(contract.grouping).toBe('name');
    expect(contract.generatesName).toBe(true);
  });

  it('takes the submission name a consumer wrote', () => {
    render(<Shipping name="shipping" />);
    for (const radio of items()) expect(radio).toHaveAttribute('name', 'shipping');
  });

  it('asks before it moves, and says whether the pointer or the keyboard asked', () => {
    const onValueChange = vi.fn();
    render(<Shipping onValueChange={onValueChange} />);

    fireEvent.click(item(1), { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      'express',
      expect.objectContaining({ previous: undefined, reason: 'pointer', value: 'express' }),
    );
    expect(item(1)).toBeChecked();

    fireEvent.click(item(2), { detail: 0 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      'pickup',
      expect.objectContaining({ previous: 'express', reason: 'keyboard' }),
    );
  });

  it('keeps the value a controlled group was given until the consumer moves it', () => {
    const onValueChange = vi.fn();
    render(<Shipping onValueChange={onValueChange} value="standard" />);

    fireEvent.click(item(1), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(item(0)).toBeChecked();
    expect(item(1)).not.toBeChecked();
  });

  it('commits nothing when the request is cancelled', () => {
    render(<Shipping onValueChange={(_value, request) => request.cancel()} />);

    fireEvent.click(item(1), { detail: 1 });
    expect(item(1)).not.toBeChecked();
  });

  /** Choosing the chosen option again is not a change, so nothing is emitted. */
  it('emits nothing when the item asked for is already the chosen one', () => {
    const onValueChange = vi.fn();
    render(<Shipping defaultValue="standard" onValueChange={onValueChange} />);

    fireEvent.click(item(0), { detail: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('mirrors the chosen item onto its own root', () => {
    render(<Shipping defaultValue="express" />);
    expect(item(1).parentElement).toHaveAttribute('data-checked', '');
    expect(item(0).parentElement).not.toHaveAttribute('data-checked');
  });

  /**
   * The platform has no `readonly` for a radio, so the group refuses the change
   * on the one event a pointer and `Space` share, and the items keep their tab
   * stop — which is what tells the state apart from `disabled`.
   */
  it('refuses every change while it is read-only, and stays reachable', () => {
    const onValueChange = vi.fn();
    render(<Shipping defaultValue="standard" onValueChange={onValueChange} readOnly />);

    fireEvent.click(item(1), { detail: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(item(0)).toBeChecked();
    expect(group()).toHaveAttribute('aria-readonly', 'true');
    expect(item(1)).not.toBeDisabled();
  });

  it('disables every item through the platform, and one item on its own', () => {
    const { rerender } = render(<Shipping disabled />);
    for (const radio of items()) expect(radio).toBeDisabled();

    rerender(
      <RadioGroup aria-label="Envio">
        <Radio value="standard">standard</Radio>
        <Radio disabled value="express">
          express
        </Radio>
      </RadioGroup>,
    );
    expect(item(0)).not.toBeDisabled();
    expect(item(1)).toBeDisabled();
    expect(item(1).parentElement).toHaveAttribute('data-disabled', '');
  });

  it('describes one item without describing the whole set', () => {
    render(
      <RadioGroup aria-label="Plano">
        <Radio description="Cobrado todo dia 5." value="monthly">
          Mensal
        </Radio>
      </RadioGroup>,
    );

    expect(item(0)).toHaveAccessibleName('Mensal');
    expect(item(0)).toHaveAccessibleDescription('Cobrado todo dia 5.');
  });

  it('says which way it flows only where it owns the role', () => {
    const { rerender } = render(<Shipping orientation="horizontal" />);
    expect(group()).toHaveAttribute('aria-orientation', 'horizontal');

    rerender(<Shipping orientation="vertical" />);
    expect(group()).not.toHaveAttribute('aria-orientation');
  });

  it('withdraws its role where a field group already grouped the set', () => {
    render(
      <FieldGroup>
        <FieldGroupLegend>Envio</FieldGroupLegend>
        <RadioGroup>
          <Radio value="standard">standard</Radio>
        </RadioGroup>
      </FieldGroup>,
    );

    const root = item(0).closest('[data-ui="radio-group"]');
    expect(root).not.toHaveAttribute('role');
    expect(contract.roleWithdrawnInside).toBe('field-group');
  });

  it('takes disabled and read-only from the field group around it', () => {
    const onValueChange = vi.fn();
    const { unmount } = render(
      <FieldGroup readOnly>
        <FieldGroupLegend>Envio</FieldGroupLegend>
        <RadioGroup defaultValue="standard" onValueChange={onValueChange}>
          <Radio value="standard">standard</Radio>
          <Radio value="express">express</Radio>
        </RadioGroup>
      </FieldGroup>,
    );

    fireEvent.click(item(1));
    const root = item(0).closest('[data-ui="radio-group"]');
    expect(root).toHaveAttribute('data-readonly', '');
    expect(root).toHaveAttribute('aria-readonly', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(item(0).checked).toBe(true);
    unmount();

    render(
      <FieldGroup disabled>
        <FieldGroupLegend>Envio</FieldGroupLegend>
        <RadioGroup>
          <Radio value="standard">standard</Radio>
          <Radio value="express">express</Radio>
        </RadioGroup>
      </FieldGroup>,
    );

    expect(item(0).closest('[data-ui="radio-group"]')).toHaveAttribute('data-disabled', '');
    expect(items().every((input) => input.disabled)).toBe(true);
  });

  /** An unset state defers to the group (2026-09-02 field design), `invalid` as `required` does. */
  it('takes invalid and required from the field group around it', () => {
    render(
      <FieldGroup invalid required>
        <FieldGroupLegend>Envio</FieldGroupLegend>
        <RadioGroup>
          <Radio value="standard">standard</Radio>
        </RadioGroup>
      </FieldGroup>,
    );

    const root = item(0).closest('[data-ui="radio-group"]');
    expect(root).toHaveAttribute('data-invalid', '');
    expect(root).toHaveAttribute('aria-invalid', 'true');
    expect(root).toHaveAttribute('aria-required', 'true');
  });

  it('takes its state from the field around it and never its identifier', () => {
    render(
      <Field invalid required>
        <FieldLabel>Envio</FieldLabel>
        <Shipping />
      </Field>,
    );

    const root = item(0).closest('[data-ui="radio-group"]') as HTMLElement;
    expect(root).toHaveAttribute('aria-invalid', 'true');
    expect(root).toHaveAttribute('aria-required', 'true');
    expect(item(0).getAttribute('id')).toMatch(/^slotted-radio-/);
    expect(contract.wiring.id).toBe('never');
  });

  it('takes its name from the label of the field around it', () => {
    render(
      <Field id="shipping">
        <FieldLabel>Envio</FieldLabel>
        <Shipping aria-label={undefined} />
      </Field>,
    );

    expect(group()).toHaveAttribute('aria-labelledby', 'shipping-label');
    expect(group()).toHaveAccessibleName('Envio');
  });

  it('keeps a name the consumer wrote over the field’s label', () => {
    render(
      <Field id="shipping">
        <FieldLabel>Envio</FieldLabel>
        <Shipping aria-label="Forma de envio" />
      </Field>,
    );

    expect(group()).not.toHaveAttribute('aria-labelledby');
    expect(group()).toHaveAccessibleName('Forma de envio');
  });

  it('lets an application decide once how its sets of choices flow', () => {
    render(
      <RadioGroupDefaultsProvider labelPlacement="start" orientation="horizontal" size="lg">
        <Shipping />
      </RadioGroupDefaultsProvider>,
    );

    expect(group()).toHaveAttribute('data-orientation', 'horizontal');
    expect(group()).toHaveAttribute('data-size', 'lg');
    expect(group()).toHaveAttribute('data-label-placement', 'start');
  });

  it('runs the consumer’s own handlers as well as its own', () => {
    const onClick = vi.fn();
    const onChange = vi.fn();
    render(
      <RadioGroup aria-label="Envio">
        <Radio onChange={onChange} onClick={onClick} value="standard">
          standard
        </Radio>
      </RadioGroup>,
    );

    fireEvent.click(item(0), { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reaches the native element of one item', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <RadioGroup aria-label="Envio">
        <Radio ref={ref} value="standard">
          standard
        </Radio>
      </RadioGroup>,
    );

    expect(ref.current).toBe(item(0));
  });

  it('renders both roots into another element when a consumer substitutes them', () => {
    render(
      <RadioGroup aria-label="Envio" render={(props) => <ul {...props} />}>
        <Radio render={(props) => <li {...props} />} value="standard">
          standard
        </Radio>
      </RadioGroup>,
    );

    expect(item(0).closest('[data-ui="radio-group"]')?.tagName).toBe('UL');
    expect(item(0).parentElement?.tagName).toBe('LI');
  });

  /** A radio outside a group has no set to belong to and no name to be grouped by. */
  it('refuses to render an item outside a group', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Radio value="standard">standard</Radio>)).toThrow(/inside a RadioGroup/);
    error.mockRestore();
  });

  it('answers a controlled consumer that moves the value from outside', () => {
    function Controlled() {
      const [value, setValue] = useState('standard');
      return (
        <>
          <Shipping onValueChange={setValue} value={value} />
          <button onClick={() => setValue('pickup')} type="button">
            retirar
          </button>
        </>
      );
    }

    render(<Controlled />);
    fireEvent.click(screen.getByRole('button'));
    expect(item(2)).toBeChecked();
  });
});
