import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/textarea/contract.json';
import { Field, FieldLabel } from '../field';
import { Textarea } from './textarea';
import { TextareaDefaultsProvider } from './textarea-defaults';

const control = () => screen.getByTestId<HTMLTextAreaElement>('control');

describe('Textarea', () => {
  it('is the control itself, with no frame around it', () => {
    render(<Textarea data-testid="control" />);

    expect(control().tagName).toBe('TEXTAREA');
    expect(control()).toHaveAttribute('data-ui', 'textarea');
    expect(control()).toHaveAttribute('data-part', 'root');
    expect(contract.members.textarea.parts).toEqual(['root']);
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<Textarea data-testid="control" />);
    const defaults = contract.members.textarea.defaults;

    expect(control()).toHaveAttribute('data-size', defaults.size);
    expect(control()).toHaveAttribute('data-variant', defaults.variant);
    expect(control()).toHaveAttribute('data-resize', defaults.resize);
    expect(control()).toHaveAttribute('rows', String(defaults.rows));
    expect(control()).not.toHaveAttribute('data-auto-size');
    expect(control()).not.toHaveAttribute('data-mono');
  });

  it('passes every native attribute to the element that owns it', () => {
    render(
      <Textarea
        autoCapitalize="sentences"
        data-testid="control"
        maxLength={280}
        name="notes"
        placeholder="Descreva o ocorrido"
        spellCheck
        wrap="soft"
      />,
    );

    expect(control()).toHaveAttribute('maxlength', '280');
    expect(control()).toHaveAttribute('name', 'notes');
    expect(control()).toHaveAttribute('wrap', 'soft');
    expect(control()).toHaveAttribute('autocapitalize', 'sentences');
    expect(control()).toHaveAttribute('spellcheck', 'true');
  });

  it('reaches the native element through the ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea defaultValue="Ada" ref={ref} />);

    ref.current?.focus();
    ref.current?.select();
    expect(ref.current?.tagName).toBe('TEXTAREA');
    expect(ref.current?.selectionEnd).toBe(3);
  });

  /* --------------------------------------------------------- auto-size - */

  /**
   * `field-sizing: content` shrinkwraps, so `rows` stops being the floor. CSS
   * cannot read an HTML attribute, so the two row counts reach the stylesheet
   * as custom properties and it states both bounds in line boxes.
   */
  it('hands the stylesheet the two row counts it cannot read from the attribute', () => {
    render(<Textarea autoSize data-testid="control" maxRows={6} rows={2} />);

    expect(control()).toHaveAttribute('data-auto-size', '');
    expect(control().style.getPropertyValue('--slotted-textarea-rows')).toBe('2');
    expect(control().style.getPropertyValue('--slotted-textarea-max-rows')).toBe('6');
    /* And `rows` stays, because it is what the platform uses while
       `field-sizing` is off or unsupported. */
    expect(control()).toHaveAttribute('rows', '2');
  });

  it('withdraws the manual handle from a control that sizes itself', () => {
    const { rerender } = render(<Textarea data-testid="control" resize="both" />);
    expect(control()).toHaveAttribute('data-resize', 'both');

    rerender(<Textarea autoSize data-testid="control" resize="both" />);
    expect(control()).toHaveAttribute('data-resize', 'none');
  });

  it('ships a ceiling that cannot be forgotten', () => {
    render(<Textarea autoSize data-testid="control" />);
    expect(control().style.getPropertyValue('--slotted-textarea-max-rows')).toBe(
      String(contract.members.textarea.defaults.maxRows),
    );
  });

  /* ------------------------------------------------------------- value - */

  it('asks to move rather than announcing that it moved, with a reason', () => {
    const onValueChange = vi.fn();
    render(<Textarea data-testid="control" onValueChange={onValueChange} />);

    fireEvent.change(control(), { target: { value: 'a note' } });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    const [value, request] = onValueChange.mock.calls[0] ?? [];
    expect(value).toBe('a note');
    expect(request.reason).toBe('keyboard');
    expect(contract.stateModel.value.reasons).toEqual(['keyboard']);
  });

  it('never moves a controlled value on its own', () => {
    render(<Textarea data-testid="control" value="fixo" />);
    fireEvent.change(control(), { target: { value: 'outro' } });
    expect(control().value).toBe('fixo');
  });

  it('runs the consumer’s own handler as well as its own', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<Textarea data-testid="control" onChange={onChange} onValueChange={onValueChange} />);

    fireEvent.change(control(), { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  /* -------------------------------------------------------------- field - */

  it('takes its identifier and its state from the field around it', () => {
    render(
      <Field disabled invalid required>
        <FieldLabel>Notes</FieldLabel>
        <Textarea data-testid="control" />
      </Field>,
    );

    expect(screen.getByText('Notes')).toHaveAttribute('for', control().id);
    expect(control()).toBeDisabled();
    expect(control()).toHaveAttribute('aria-invalid', 'true');
    expect(control()).toHaveAttribute('aria-required', 'true');
    expect(control()).not.toHaveAttribute('required');
    expect(control()).toHaveAttribute('data-invalid');
  });

  it('takes its step from the field rather than from the provider', () => {
    render(
      <TextareaDefaultsProvider size="lg" variant="subtle">
        <Field size="sm">
          <Textarea data-testid="control" />
        </Field>
      </TextareaDefaultsProvider>,
    );

    expect(control()).toHaveAttribute('data-size', 'sm');
    expect(control()).toHaveAttribute('data-variant', 'subtle');
  });

  /* -------------------------------------------------------------- count - */

  it('publishes its count and lets the field draw it', () => {
    render(
      <Field data-testid="field">
        <Textarea data-testid="control" defaultValue="oi" maxLength={280} showCount />
      </Field>,
    );

    const counter = () => screen.getByTestId('field').querySelector('[data-part="counter"]');
    expect(counter()).toHaveTextContent('2/280');

    fireEvent.change(control(), { target: { value: 'oi tudo bem' } });
    expect(counter()).toHaveTextContent('11/280');
  });

  it('counts without a limit when there is none to count against', () => {
    render(
      <Field data-testid="field">
        <Textarea defaultValue="abc" showCount />
      </Field>,
    );

    expect(screen.getByTestId('field').querySelector('[data-part="counter"]')).toHaveTextContent(
      '3',
    );
  });
});
