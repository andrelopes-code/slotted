import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { FieldDescription } from '../field/field-description';
import { FieldError } from '../field/field-error';
import { FieldLabel } from '../field/field-label';
import { Input } from './input';
import type { InputProps } from './input.types';

const inField = (props: InputProps = {}, fieldProps: Record<string, unknown> = {}) => {
  render(
    <Field id="account" {...fieldProps}>
      <FieldLabel>Email</FieldLabel>
      <Input {...props} />
      <FieldDescription>We only use it to sign you in.</FieldDescription>
      <FieldError>That address is not valid.</FieldError>
    </Field>,
  );
  return screen.getByRole('textbox');
};

describe('Input', () => {
  it('is the native control, with the size the contract defaults to', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('data-size', 'md');
    expect(input).toHaveClass('slotted-input');
  });

  it('works outside a field, which is what mirroring the state is for', () => {
    render(<Input disabled invalid readOnly required />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-disabled', '');
    expect(input).toHaveAttribute('data-invalid', '');
    expect(input).toHaveAttribute('data-readonly', '');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toBeDisabled();
  });

  it('takes the field’s identifier, so the label resolves to it', () => {
    const input = inField();
    expect(input).toHaveAttribute('id', 'account-control');
    expect(screen.getByText('Email')).toHaveAttribute('for', 'account-control');
  });

  it('is described by the field’s description and error, in that order', () => {
    const input = inField();
    expect(input).toHaveAttribute('aria-describedby', 'account-description account-error');
  });

  it('keeps a description the consumer set, and adds the field’s after it', () => {
    const input = inField({ 'aria-describedby': 'app-hint' });
    expect(input).toHaveAttribute('aria-describedby', 'app-hint account-description account-error');
  });

  it('takes every shared state from the field when it sets none itself', () => {
    const input = inField({}, { disabled: true, invalid: true, readOnly: true, required: true });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('data-disabled', '');
    expect(input).toHaveAttribute('data-invalid', '');
    expect(input).toHaveAttribute('data-readonly', '');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('lets its own value win over the field’s, in both directions', () => {
    const enabled = inField({ disabled: false, invalid: false }, { disabled: true, invalid: true });
    expect(enabled).not.toBeDisabled();
    expect(enabled).not.toHaveAttribute('data-disabled');
    expect(enabled).not.toHaveAttribute('aria-invalid');
  });

  it('describes itself as required with aria, never with the native attribute', () => {
    const input = inField({}, { required: true });
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).not.toHaveAttribute('required');
  });

  it('says nothing about required when neither it nor the field asks', () => {
    render(<Input required={false} />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
  });

  it('registers with the field, so the missing-control warning stays true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input />
      </Field>,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('carries the size it was given, and the class the consumer added', () => {
    render(<Input className="app-input" size="lg" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-size', 'lg');
    expect(input).toHaveClass('slotted-input', 'app-input');
  });

  it('passes the native attributes it does not own straight through', () => {
    render(<Input placeholder="you@example.com" type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
  });
});
