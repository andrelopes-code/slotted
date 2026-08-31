import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { FieldDescription } from '../field/field-description';
import { FieldError } from '../field/field-error';
import { FieldLabel } from '../field/field-label';
import { Textarea } from './textarea';
import type { TextareaProps } from './textarea.types';

const inField = (props: TextareaProps = {}, fieldProps: Record<string, unknown> = {}) => {
  render(
    <Field id="notes" {...fieldProps}>
      <FieldLabel>Notes</FieldLabel>
      <Textarea {...props} />
      <FieldDescription>Anything the team should know.</FieldDescription>
      <FieldError>Notes cannot be empty.</FieldError>
    </Field>,
  );
  return screen.getByRole('textbox');
};

describe('Textarea', () => {
  it('is the native control, with the defaults the contract names', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('data-size', 'md');
    expect(textarea).toHaveAttribute('rows', '3');
    expect(textarea).not.toHaveAttribute('data-auto-size');
  });

  it('marks itself when asked to grow, and leaves rows as the floor', () => {
    render(<Textarea autoSize rows={2} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('data-auto-size', '');
    expect(textarea).toHaveAttribute('rows', '2');
  });

  it('works outside a field, which is what mirroring the state is for', () => {
    render(<Textarea disabled invalid readOnly required />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('data-disabled', '');
    expect(textarea).toHaveAttribute('data-invalid', '');
    expect(textarea).toHaveAttribute('data-readonly', '');
    expect(textarea).toHaveAttribute('aria-required', 'true');
    expect(textarea).toBeDisabled();
  });

  it('takes the field’s identifier and description, in the field’s order', () => {
    const textarea = inField();
    expect(textarea).toHaveAttribute('id', 'notes-control');
    expect(screen.getByText('Notes')).toHaveAttribute('for', 'notes-control');
    expect(textarea).toHaveAttribute('aria-describedby', 'notes-description notes-error');
  });

  it('takes every shared state from the field when it sets none itself', () => {
    const textarea = inField({}, { disabled: true, invalid: true, readOnly: true, required: true });
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute('data-invalid', '');
    expect(textarea).toHaveAttribute('data-readonly', '');
    expect(textarea).toHaveAttribute('aria-required', 'true');
  });

  it('lets its own value win over the field’s, in both directions', () => {
    const textarea = inField({ disabled: false }, { disabled: true });
    expect(textarea).not.toBeDisabled();
    expect(textarea).not.toHaveAttribute('data-disabled');
  });

  it('describes itself as required with aria, never with the native attribute', () => {
    const textarea = inField({}, { required: true });
    expect(textarea).toHaveAttribute('aria-required', 'true');
    expect(textarea).not.toHaveAttribute('required');
  });

  it('registers with the field, so the missing-control warning stays true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field>
        <FieldLabel>Notes</FieldLabel>
        <Textarea />
      </Field>,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('carries the size it was given, and the class the consumer added', () => {
    render(<Textarea className="app-notes" size="lg" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('data-size', 'lg');
    expect(textarea).toHaveClass('slotted-textarea', 'app-notes');
  });

  it('passes the native attributes it does not own straight through', () => {
    render(<Textarea maxLength={280} placeholder="Say something" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxlength', '280');
    expect(textarea).toHaveAttribute('placeholder', 'Say something');
  });
});
