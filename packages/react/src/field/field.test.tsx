import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from './index';

describe('Field', () => {
  it('derives every identifier from one base', () => {
    render(
      <Field id="email">
        <FieldLabel>Email</FieldLabel>
        <FieldControl />
        <FieldDescription>Used for sign-in</FieldDescription>
      </Field>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-control');
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-control');
    expect(screen.getByText('Used for sign-in')).toHaveAttribute('id', 'email-description');
  });

  it('composes aria-describedby as description then error', () => {
    render(
      <Field id="email" invalid>
        <FieldControl />
        <FieldDescription>Used for sign-in</FieldDescription>
        <FieldError>Email is not valid</FieldError>
      </Field>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'email-description email-error',
    );
  });

  it('omits an absent part from aria-describedby', () => {
    render(
      <Field id="email">
        <FieldControl />
        <FieldDescription>Used for sign-in</FieldDescription>
      </Field>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'email-description');
  });

  it('keeps a consumer value ahead of the field value', () => {
    render(
      <Field id="email">
        <FieldControl aria-describedby="external" />
        <FieldDescription>Used for sign-in</FieldDescription>
      </Field>,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'external email-description',
    );
  });

  it('never overwrites an explicit attribute', () => {
    render(
      <Field id="email" required>
        <FieldControl aria-required="false" id="mine" />
      </Field>,
    );

    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('aria-required', 'false');
    expect(control).toHaveAttribute('id', 'mine');
  });

  it('marks state on the root and on the control', () => {
    render(
      <Field disabled id="email" invalid readOnly required>
        <FieldControl />
      </Field>,
    );

    const control = screen.getByRole('textbox');
    const root = control.closest('.slotted-field');
    for (const attribute of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(root).toHaveAttribute(attribute, '');
    }

    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute('aria-required', 'true');
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute('readonly');
    expect(control).not.toHaveAttribute('required');
  });

  it('leaves state attributes off when the field is neutral', () => {
    render(
      <Field id="email">
        <FieldControl />
      </Field>,
    );

    const control = screen.getByRole('textbox');
    const root = control.closest('.slotted-field');
    for (const attribute of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(root).not.toHaveAttribute(attribute);
    }
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(control).not.toHaveAttribute('aria-required');
  });

  it('applies the wiring through render to a consumer control', () => {
    render(
      <Field id="email">
        <FieldControl render={(props) => <textarea {...props} />} />
        <FieldDescription>Used for sign-in</FieldDescription>
      </Field>,
    );

    const control = screen.getByRole('textbox');
    expect(control.tagName).toBe('TEXTAREA');
    expect(control).toHaveAttribute('aria-describedby', 'email-description');
    expect(control).toHaveAttribute('id', 'email-control');
  });

  it('generates an identifier when none is given', () => {
    render(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldControl />
      </Field>,
    );

    const control = screen.getByRole('textbox');
    expect(control.id).toMatch(/-control$/);
    expect(screen.getByText('Email')).toHaveAttribute('for', control.id);
  });

  it('renders every part as plain markup outside a field', () => {
    render(
      <>
        <FieldLabel>Email</FieldLabel>
        <FieldDescription>Used for sign-in</FieldDescription>
      </>,
    );

    expect(screen.getByText('Email')).not.toHaveAttribute('for');
    expect(screen.getByText('Used for sign-in')).not.toHaveAttribute('id');
  });

  it('warns once in development when a field has no control', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <Field id="email">
        <FieldLabel>Email</FieldLabel>
      </Field>,
    );

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/Field/);
    warn.mockRestore();
  });

  it('accepts a different root element through render', () => {
    render(
      <Field id="email" render={(props) => <fieldset {...props} />}>
        <FieldControl />
      </Field>,
    );

    expect(screen.getByRole('group')).toHaveClass('slotted-field');
  });
});
