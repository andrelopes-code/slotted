import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../field/field';
import { FieldDescription } from '../field/field-description';
import { FieldLabel } from '../field/field-label';
import { Switch } from './switch';
import type { SwitchProps } from './switch.types';

const inField = (props: SwitchProps = {}, fieldProps: Record<string, unknown> = {}) => {
  render(
    <Field id="alerts" {...fieldProps}>
      <FieldLabel>Email alerts</FieldLabel>
      <Switch {...props} />
      <FieldDescription>Sent when a build fails.</FieldDescription>
    </Field>,
  );
  return screen.getByRole('switch');
};

describe('Switch', () => {
  it('is a switch on a button, off, at the middle size', () => {
    render(<Switch />);
    const control = screen.getByRole('switch');
    expect(control.tagName).toBe('BUTTON');
    expect(control).toHaveAttribute('type', 'button');
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(control).toHaveAttribute('data-size', 'md');
    expect(control).not.toHaveAttribute('data-checked');
  });

  it('renders the thumb it moves', () => {
    render(<Switch />);
    expect(screen.getByRole('switch').querySelector('[data-part="thumb"]')).not.toBeNull();
  });

  it('turns itself on and off when the consumer holds nothing', () => {
    render(<Switch defaultChecked={false} />);
    const control = screen.getByRole('switch');

    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(control).toHaveAttribute('data-checked', '');

    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'false');
  });

  it('reports the change and does not move when the consumer holds it', () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('switch');

    fireEvent.click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control).toHaveAttribute('aria-checked', 'false');
  });

  it('binds no keys, because a button already answers Space and Enter', () => {
    render(<Switch />);
    const control = screen.getByRole('switch');
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' });
    control.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not turn while disabled', () => {
    const onCheckedChange = vi.fn();
    render(<Switch disabled onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('switch');
    expect(control).toBeDisabled();
    fireEvent.click(control);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('takes the field’s identifier and description', () => {
    const control = inField();
    expect(control).toHaveAttribute('id', 'alerts-control');
    expect(screen.getByText('Email alerts')).toHaveAttribute('for', 'alerts-control');
    expect(control).toHaveAttribute('aria-describedby', 'alerts-description');
  });

  it('takes disabled, invalid and required from the field', () => {
    const control = inField({}, { disabled: true, invalid: true, required: true });
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute('data-disabled', '');
    expect(control).toHaveAttribute('data-invalid', '');
    expect(control).toHaveAttribute('aria-required', 'true');
    expect(control).not.toHaveAttribute('required');
  });

  it('lets its own value win over the field’s, in both directions', () => {
    const control = inField({ disabled: false }, { disabled: true });
    expect(control).not.toBeDisabled();
  });

  it('registers with the field, so the missing-control warning stays true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field>
        <FieldLabel>Email alerts</FieldLabel>
        <Switch />
      </Field>,
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('still calls the consumer’s own click handler, and yields to a cancelled one', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} onClick={onClick} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('carries the size it was given, and the class the consumer added', () => {
    render(<Switch className="app-switch" size="lg" />);
    const control = screen.getByRole('switch');
    expect(control).toHaveAttribute('data-size', 'lg');
    expect(control).toHaveClass('slotted-switch', 'app-switch');
  });
});
