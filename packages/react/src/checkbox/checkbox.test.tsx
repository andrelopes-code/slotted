import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/checkbox/contract.json';
import { CheckboxGroup } from '../checkbox-group';
import { Field, FieldLabel } from '../field';
import { FieldGroup, FieldGroupLegend } from '../field-group';
import { VisuallyHidden } from '../visually-hidden';
import { Checkbox } from './checkbox';
import { CheckboxDefaultsProvider } from './checkbox-defaults';

const control = () => screen.getByRole('checkbox');
const root = () => control().parentElement as HTMLElement;

describe('Checkbox', () => {
  /**
   * A box with no words beside it still carries the 24-pixel target and the
   * wash, which are the label's: the label is rendered empty, and the name
   * comes from aria-label.
   */
  it('keeps the target and the wash on a box named by aria-label', () => {
    render(<Checkbox aria-label="Select Acme Logistics" />);
    const label = root().querySelector('[data-part="label"]');
    expect(label).not.toBeNull();
    expect(label).toBeEmptyDOMElement();
    expect(label).toHaveAttribute('for', control().id);
    expect(control()).toHaveAccessibleName('Select Acme Logistics');
  });

  /** Hidden words are as wide as none, and the wash closes around the box. */
  it('marks a label whose only content is hidden text', () => {
    render(
      <Checkbox>
        <VisuallyHidden>Select Acme Logistics</VisuallyHidden>
      </Checkbox>,
    );
    expect(root()).toHaveAttribute('data-label-hidden');
    expect(control()).toHaveAccessibleName('Select Acme Logistics');
  });

  it('leaves a label with visible words beside hidden ones unmarked', () => {
    render(
      <Checkbox>
        Delete <VisuallyHidden>invoice 42</VisuallyHidden>
      </Checkbox>,
    );
    expect(root()).not.toHaveAttribute('data-label-hidden');
  });

  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Checkbox className="page-box" description="One summary per day.">
        Receive notices
      </Checkbox>,
    );

    expect(root().tagName).toBe('DIV');
    expect(root()).toHaveAttribute('data-ui', 'checkbox');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('page-box');
    expect(control()).toHaveAttribute('data-part', 'control');
    expect(root().querySelector('[data-part="indicator"] svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'check',
    );
    expect(root().querySelector('[data-part="label"]')).toHaveTextContent('Receive notices');
    expect(root().querySelector('[data-part="description"]')).toHaveTextContent(
      'One summary per day.',
    );
  });

  /** The root has no role; the native control is the only thing announced. */
  it('leaves the root out of the accessibility tree', () => {
    render(<Checkbox>Aceito</Checkbox>);
    expect(root()).not.toHaveAttribute('role');
    expect(contract.rootRole).toBeNull();
    expect(control().tagName).toBe('INPUT');
    expect(control()).toHaveAttribute('type', 'checkbox');
  });

  /**
   * The label names the control through `for`, and the description is outside
   * it: inside, it would join the accessible name and a paragraph of help text
   * would toggle the value when it was clicked.
   */
  it('names the control from the label and describes it from the description', () => {
    render(<Checkbox description="We send the receipt by email.">Send receipt</Checkbox>);

    expect(control()).toHaveAccessibleName('Send receipt');
    expect(control()).toHaveAccessibleDescription('We send the receipt by email.');
    expect(contract.labelAssociation).toBe('for');
  });

  it('generates the identifier the label points at, and lets a consumer state it', () => {
    const { rerender } = render(<Checkbox>Aceito</Checkbox>);
    const generated = control().getAttribute('id');
    expect(generated).not.toBeNull();
    expect(root().querySelector('label')).toHaveAttribute('for', generated as string);

    rerender(<Checkbox id="terms">Aceito</Checkbox>);
    expect(control()).toHaveAttribute('id', 'terms');
    expect(root().querySelector('label')).toHaveAttribute('for', 'terms');
    expect(contract.generatesControlId).toBe(true);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<Checkbox>Aceito</Checkbox>);
    expect(root()).toHaveAttribute('data-size', contract.members.checkbox.defaults.size);
    expect(root()).toHaveAttribute(
      'data-label-placement',
      contract.members.checkbox.defaults.labelPlacement,
    );
  });

  /** `Space` and a pointer arrive as the same `click`; the reason tells them apart. */
  it('asks before it moves, and says whether the pointer or the keyboard asked', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange}>Aceito</Checkbox>);

    fireEvent.click(control(), { detail: 1 });
    expect(onCheckedChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ previous: false, reason: 'pointer', value: true }),
    );

    fireEvent.click(control(), { detail: 0 });
    expect(onCheckedChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ previous: true, reason: 'keyboard', value: false }),
    );
  });

  it('keeps the state a controlled box was given until the consumer moves it', () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox checked={false} onCheckedChange={onCheckedChange}>
        Aceito
      </Checkbox>,
    );

    fireEvent.click(control(), { detail: 1 });
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(control()).not.toBeChecked();
    expect(root()).not.toHaveAttribute('data-checked');
  });

  it('moves its own state when nobody owns it, and mirrors it onto the root', () => {
    render(<Checkbox defaultChecked>Aceito</Checkbox>);
    expect(root()).toHaveAttribute('data-checked', '');

    fireEvent.click(control(), { detail: 1 });
    expect(control()).not.toBeChecked();
    expect(root()).not.toHaveAttribute('data-checked');
  });

  it('commits nothing when the request is cancelled', () => {
    render(<Checkbox onCheckedChange={(_, request) => request.cancel()}>Aceito</Checkbox>);

    fireEvent.click(control(), { detail: 1 });
    expect(control()).not.toBeChecked();
    expect(root()).not.toHaveAttribute('data-checked');
  });

  /**
   * The mixed state is an IDL property, not an attribute, and it is never a
   * third value of `checked`: the submitted value stays boolean.
   */
  it('draws the mixed state without changing what the form submits', () => {
    render(
      <Checkbox indeterminate name="days" value="all">
        Every day
      </Checkbox>,
    );

    /* The property, and not an attribute: `indeterminate` has none, which is
       why every implementation writes it from script and why the stylesheet
       reads `:indeterminate` rather than a mirrored value. */
    expect((control() as HTMLInputElement).indeterminate).toBe(true);
    expect(control()).not.toHaveAttribute('indeterminate');
    expect(root()).toHaveAttribute('data-indeterminate', '');
    /* Mixed is the dash, in place of the check. */
    expect(root().querySelector('[data-part="indicator"] svg[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'minus',
    );
    expect(control()).not.toBeChecked();
    expect(control()).toHaveAttribute('value', 'all');
  });

  /**
   * The platform has no `readonly` for a checkbox, so the state is enforced on
   * the one event a pointer and `Space` share — and the control keeps its tab
   * stop, which is what tells it apart from `disabled`.
   */
  it('refuses every change while it is read-only, and stays reachable', () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox onCheckedChange={onCheckedChange} readOnly>
        Contratado
      </Checkbox>,
    );

    fireEvent.click(control(), { detail: 1 });
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control()).not.toBeChecked();
    expect(control()).toHaveAttribute('aria-readonly', 'true');
    expect(control()).not.toBeDisabled();
    expect(root()).toHaveAttribute('data-readonly', '');
  });

  it('disables through the platform rather than through an attribute of its own', () => {
    render(<Checkbox disabled>Aceito</Checkbox>);
    expect(control()).toBeDisabled();
    expect(root()).toHaveAttribute('data-disabled', '');
    expect(contract.disabledAttribute).toBe('disabled');
  });

  /**
   * The mechanism the field-aware controls design states, with the one
   * departure this family records: the box owns its own label, so a field's
   * identifier would give it a second one.
   */
  it('takes its state from the field around it and never its identifier', () => {
    render(
      <Field disabled invalid required>
        <FieldLabel>Termos</FieldLabel>
        <Checkbox>Aceito</Checkbox>
      </Field>,
    );

    expect(control()).toBeDisabled();
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(control()).toHaveAttribute('aria-required', 'true');
    expect(control().getAttribute('id')).toMatch(/^slotted-checkbox-/);
    expect(contract.wiring.id).toBe('never');
  });

  /** `aria-required`, never the native attribute, which would change submission. */
  it('describes necessity without engaging constraint validation', () => {
    render(
      <Field required>
        <FieldLabel>Termos</FieldLabel>
        <Checkbox>Aceito</Checkbox>
      </Field>,
    );

    expect(control()).toHaveAttribute('aria-required', 'true');
    expect(control()).not.toHaveAttribute('required');
    expect(contract.requiredAttribute).toBe('aria-required');
  });

  it('lets a consumer state the native required when they want the platform’s validation', () => {
    render(<Checkbox required>Aceito</Checkbox>);
    expect(control()).toBeRequired();
  });

  it('takes size and placement from the group before the provider', () => {
    render(
      <CheckboxDefaultsProvider labelPlacement="start" size="lg">
        <CheckboxGroup labelPlacement="end" size="sm">
          <Checkbox value="a">A</Checkbox>
        </CheckboxGroup>
      </CheckboxDefaultsProvider>,
    );

    expect(root()).toHaveAttribute('data-size', 'sm');
    expect(root()).toHaveAttribute('data-label-placement', 'end');
  });

  it('lets an application decide once what its checkboxes look like', () => {
    render(
      <CheckboxDefaultsProvider labelPlacement="start" size="lg" variant="tile">
        <Checkbox>Aceito</Checkbox>
      </CheckboxDefaultsProvider>,
    );

    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(root()).toHaveAttribute('data-label-placement', 'start');
    expect(root()).toHaveAttribute('data-variant', 'tile');
    expect(contract.provides.checkboxDefaults).toEqual(['size', 'variant', 'labelPlacement']);
  });

  /**
   * The framed choice resolves the way `size` does, one step shorter: a box
   * states it, else the group around it, else the provider, else `plain`. It
   * never comes from the field — a field decides how its own row is laid out,
   * and a checkbox drawn as a tile is a decision about the choice.
   */
  it('resolves the framed presentation from the prop, then the group, then the provider', () => {
    const { rerender } = render(<Checkbox>Sozinho</Checkbox>);
    expect(root()).toHaveAttribute('data-variant', 'plain');

    rerender(
      <CheckboxDefaultsProvider variant="tile">
        <Checkbox>Do provider</Checkbox>
      </CheckboxDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-variant', 'tile');

    rerender(
      <CheckboxDefaultsProvider variant="plain">
        <CheckboxGroup variant="tile">
          <Checkbox value="a">Do grupo</Checkbox>
        </CheckboxGroup>
      </CheckboxDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-variant', 'tile');

    rerender(
      <CheckboxGroup variant="tile">
        <Checkbox value="a" variant="plain">
          From its own prop
        </Checkbox>
      </CheckboxGroup>,
    );
    expect(root()).toHaveAttribute('data-variant', 'plain');
    expect(contract.resolution.variant).toEqual(['prop', 'group', 'defaults', 'plain']);
  });

  it('runs the consumer’s own handlers as well as its own', () => {
    const onChange = vi.fn();
    const onClick = vi.fn();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox onChange={onChange} onCheckedChange={onCheckedChange} onClick={onClick}>
        Aceito
      </Checkbox>,
    );

    fireEvent.click(control(), { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it('reaches the native element, and the actions the platform already ships', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref}>Aceito</Checkbox>);

    expect(ref.current).toBe(control());
    ref.current?.focus();
    expect(control()).toHaveFocus();
  });

  it('renders the root into another element when a consumer substitutes it', () => {
    render(
      <Checkbox render={(props) => <li {...props} />} defaultChecked>
        Aceito
      </Checkbox>,
    );

    const item = control().parentElement as HTMLElement;
    expect(item.tagName).toBe('LI');
    expect(item).toHaveAttribute('data-ui', 'checkbox');
  });

  it('restores what an uncontrolled box started from when the form resets', async () => {
    render(
      <form>
        <Checkbox defaultChecked name="terms">
          Aceito
        </Checkbox>
      </form>,
    );

    fireEvent.click(control(), { detail: 1 });
    expect(root()).not.toHaveAttribute('data-checked');

    ((control() as HTMLInputElement).form as HTMLFormElement).reset();
    await waitFor(() => expect(root()).toHaveAttribute('data-checked', ''));
    expect(control()).toBeChecked();
  });

  it('takes its step from a field group when there is no field between them', () => {
    render(
      <FieldGroup size="sm">
        <FieldGroupLegend>Avisos</FieldGroupLegend>
        <Checkbox>Aceito</Checkbox>
      </FieldGroup>,
    );

    expect(root()).toHaveAttribute('data-size', 'sm');
  });

  it('answers a controlled consumer that moves the value from outside', () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <Checkbox checked={checked} onCheckedChange={setChecked}>
            Aceito
          </Checkbox>
          <button onClick={() => setChecked(true)} type="button">
            marcar
          </button>
        </>
      );
    }

    render(<Controlled />);
    fireEvent.click(screen.getByRole('button'));
    expect(control()).toBeChecked();
    expect(root()).toHaveAttribute('data-checked', '');
  });
});
