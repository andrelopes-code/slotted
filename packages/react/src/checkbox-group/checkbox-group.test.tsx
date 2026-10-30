import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/checkbox-group/contract.json';
import { Checkbox } from '../checkbox';
import { Field, FieldLabel } from '../field';
import { FieldGroup, FieldGroupLegend } from '../field-group';
import { CheckboxGroup } from './checkbox-group';
import type { CheckboxGroupProps } from './checkbox-group.types';
import { CheckboxGroupDefaultsProvider } from './checkbox-group-defaults';

const DAYS = ['mon', 'tue', 'wed'];

const boxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];
const box = (index: number) => boxes()[index] as HTMLInputElement;
const group = () => screen.getByRole('group');

function Days(props: Partial<CheckboxGroupProps>) {
  return (
    <CheckboxGroup allValues={DAYS} {...props}>
      {DAYS.map((day) => (
        <Checkbox key={day} value={day}>
          {day}
        </Checkbox>
      ))}
    </CheckboxGroup>
  );
}

describe('CheckboxGroup', () => {
  it('is selected in public by the family identifier and its one part', () => {
    render(<Days className="page-set" />);

    expect(group().tagName).toBe('DIV');
    expect(group()).toHaveAttribute('data-ui', 'checkbox-group');
    expect(group()).toHaveAttribute('data-part', 'root');
    expect(group()).toHaveClass('page-set');
    expect(contract.members.checkboxGroup.parts).toEqual(['root']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<Days />);
    expect(group()).toHaveAttribute('data-size', contract.members.checkboxGroup.defaults.size);
    expect(group()).toHaveAttribute(
      'data-orientation',
      contract.members.checkboxGroup.defaults.orientation,
    );
  });

  it('holds the selection as an array and asks before it moves', () => {
    const onValueChange = vi.fn();
    render(<Days defaultValue={['tue']} onValueChange={onValueChange} />);

    expect(box(1)).toBeChecked();

    fireEvent.click(box(0), { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(
      ['mon', 'tue'],
      expect.objectContaining({ previous: ['tue'], reason: 'pointer' }),
    );
    expect(box(0)).toBeChecked();
  });

  /**
   * A selection that grew in click order would submit in click order, so two
   * readers who chose the same three options would send two different arrays.
   */
  it('keeps the selection in the order the set was declared', () => {
    const onValueChange = vi.fn();
    render(<Days defaultValue={['wed']} onValueChange={onValueChange} />);

    fireEvent.click(box(0), { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(['mon', 'wed'], expect.anything());
  });

  it('keeps the selection a controlled group was given until the consumer moves it', () => {
    const onValueChange = vi.fn();
    render(<Days onValueChange={onValueChange} value={[]} />);

    fireEvent.click(box(0), { detail: 1 });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(box(0)).not.toBeChecked();
  });

  it('commits nothing when the request is cancelled', () => {
    render(<Days onValueChange={(_value, request) => request.cancel()} />);

    fireEvent.click(box(0), { detail: 1 });
    expect(box(0)).not.toBeChecked();
  });

  /**
   * The parent is derived and never entered: it is ticked when the whole set
   * is, mixed between, and its request replaces the selection rather than
   * toggling one value.
   */
  it('derives the parent box from the set it commands', () => {
    const onValueChange = vi.fn();
    render(
      <CheckboxGroup allValues={DAYS} defaultValue={['mon']} onValueChange={onValueChange}>
        <Checkbox parent>Todos</Checkbox>
        {DAYS.map((day) => (
          <Checkbox key={day} value={day}>
            {day}
          </Checkbox>
        ))}
      </CheckboxGroup>,
    );

    const [parent, ...children] = boxes() as HTMLInputElement[];
    expect(parent?.indeterminate).toBe(true);
    expect(parent).not.toBeChecked();

    fireEvent.click(parent as HTMLInputElement, { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(DAYS, expect.anything());
    expect(children.every((child) => child.checked)).toBe(true);
    expect(box(0).indeterminate).toBe(false);
    expect(box(0)).toBeChecked();

    fireEvent.click(box(0), { detail: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith([], expect.anything());
  });

  it('hands its state to every box in the set', () => {
    render(<Days disabled invalid readOnly />);

    expect(group()).toHaveAttribute('data-disabled', '');
    expect(group()).toHaveAttribute('data-invalid', '');
    expect(group()).toHaveAttribute('data-readonly', '');
    for (const box of boxes()) {
      expect(box).toBeDisabled();
      expect(box).toHaveAttribute('aria-invalid', 'true');
      expect(box).toHaveAttribute('aria-readonly', 'true');
    }
  });

  it('hands its submission name to every box in the set', () => {
    render(<Days name="days" />);
    for (const box of boxes()) expect(box).toHaveAttribute('name', 'days');
  });

  /**
   * A `field-group` is a `fieldset` with a `legend`, which is already a named
   * group; a second one named by the same legend is the same group announced
   * twice.
   */
  it('withdraws its role where a field group already grouped the set', () => {
    render(
      <FieldGroup>
        <FieldGroupLegend>Dias</FieldGroupLegend>
        <Days />
      </FieldGroup>,
    );

    const root = box(0).closest('[data-ui="checkbox-group"]');
    expect(root).not.toHaveAttribute('role');
    expect(contract.roleWithdrawnInside).toBe('field-group');
  });

  it('takes invalid and required from the field group around it', () => {
    render(
      <FieldGroup invalid required>
        <FieldGroupLegend>Dias</FieldGroupLegend>
        <Days />
      </FieldGroup>,
    );

    const root = box(0).closest('[data-ui="checkbox-group"]');
    expect(root).toHaveAttribute('data-invalid', '');
    expect(root).toHaveAttribute('aria-invalid', 'true');
    expect(root).toHaveAttribute('aria-required', 'true');
    for (const box of boxes()) expect(box).toHaveAttribute('aria-invalid', 'true');
  });

  it('keeps a role the consumer wrote themselves', () => {
    render(<Days role="presentation" />);
    expect(box(0).closest('[data-ui="checkbox-group"]')).toHaveAttribute('role', 'presentation');
  });

  /**
   * The differentiator: the number selected reaches the field's label row
   * through the channel a text field opened for characters.
   */
  it('publishes how many are selected where the field already draws a count', () => {
    render(
      <Field>
        <FieldLabel>Dias</FieldLabel>
        <Days defaultValue={['mon', 'tue']} showCount />
      </Field>,
    );

    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(contract.counter.placedBy).toBe('field');
  });

  it('takes its name from the label of the field around it', () => {
    render(
      <Field id="days">
        <FieldLabel>Dias</FieldLabel>
        <Days />
      </Field>,
    );

    expect(group()).toHaveAttribute('aria-labelledby', 'days-label');
    expect(group()).toHaveAccessibleName('Dias');
  });

  it('keeps a name the consumer wrote over the field’s label', () => {
    render(
      <Field id="days">
        <FieldLabel>Dias</FieldLabel>
        <Days aria-label="Dias de coleta" />
      </Field>,
    );

    expect(group()).not.toHaveAttribute('aria-labelledby');
    expect(group()).toHaveAccessibleName('Dias de coleta');
  });

  it('lets an application decide once how its sets of choices flow', () => {
    render(
      <CheckboxGroupDefaultsProvider orientation="horizontal" size="lg">
        <Days />
      </CheckboxGroupDefaultsProvider>,
    );

    expect(group()).toHaveAttribute('data-orientation', 'horizontal');
    expect(group()).toHaveAttribute('data-size', 'lg');
  });

  it('renders the root into another element when a consumer substitutes it', () => {
    render(<Days render={(props) => <ul {...props} />} />);
    const root = box(0).closest('[data-ui="checkbox-group"]');
    expect(root?.tagName).toBe('UL');
  });

  it('answers a controlled consumer that moves the selection from outside', () => {
    function Controlled() {
      const [value, setValue] = useState<readonly string[]>([]);
      return (
        <>
          <Days onValueChange={setValue} value={value} />
          <button onClick={() => setValue(DAYS)} type="button">
            todos
          </button>
        </>
      );
    }

    render(<Controlled />);
    fireEvent.click(screen.getByRole('button'));
    for (const box of boxes()) expect(box).toBeChecked();
  });
});

/**
 * The server renders once and runs no effect, so a count published in an
 * effect is missing from its markup, and hydration then disagrees with it.
 * The field reads the count from the group's props written among its children.
 */
describe('CheckboxGroup on the server', () => {
  const tree = (
    <Field id="days">
      <FieldLabel>Dias</FieldLabel>
      <CheckboxGroup allValues={DAYS} defaultValue={['mon']} showCount>
        <Checkbox value="mon">mon</Checkbox>
        <Checkbox value="tue">tue</Checkbox>
        <Checkbox value="wed">wed</Checkbox>
      </CheckboxGroup>
    </Field>
  );

  it('draws the count it publishes in the field, and is described by it', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToString(tree);

    expect(host.querySelector('[data-part="counter"]')).toHaveTextContent('1/3');
    expect(host.querySelector('[data-ui="checkbox-group"]')).toHaveAttribute(
      'aria-describedby',
      'days-counter',
    );
  });

  it('hydrates without a mismatch and keeps the markup it was served', async () => {
    const html = renderToString(tree);
    const host = document.createElement('div');
    host.innerHTML = html;
    const served = host.innerHTML;
    document.body.append(host);
    const onRecoverableError = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await act(async () => {
        hydrateRoot(host, tree, { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(host.innerHTML).toBe(served);
    } finally {
      error.mockRestore();
      host.remove();
    }
  });
});
