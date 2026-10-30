import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/text-field/contract.json';
import { Field, FieldCounter, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { TextField, TextFieldAction } from './text-field';
import { TextFieldDefaultsProvider } from './text-field-defaults';

const frame = () => screen.getByTestId('frame');

describe('TextField', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <TextField
        clearable
        data-testid="input"
        defaultValue="nota"
        end="BRL"
        start="R$"
        className="page-field"
      />,
    );

    const input = screen.getByTestId('input');
    const root = input.parentElement as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-ui', 'text-field');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root).toHaveClass('page-field');
    expect(input).toHaveAttribute('data-part', 'input');
    expect(root.querySelector('[data-part="start"]')).toHaveTextContent('R$');
    expect(root.querySelector('[data-part="end"]')).toHaveTextContent('BRL');
    expect(root.querySelector('[data-part="clear"] svg[data-glyph="x"]')).not.toBeNull();
  });

  /**
   * The frame carries no role. A `textbox` may hold only non-interactive,
   * presentational children, so the two buttons are the control's siblings and
   * the box around them is a `div` with nothing to announce.
   */
  it('leaves the frame out of the accessibility tree', () => {
    render(<TextField clearable defaultValue="x" data-testid="input" />);
    const root = screen.getByTestId('input').parentElement as HTMLElement;
    expect(root).not.toHaveAttribute('role');
    expect(contract.rootRole).toBeNull();
    expect(screen.getByRole('textbox')).toBe(screen.getByTestId('input'));
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(
      <TextField data-testid="input" render={(props) => <div {...props} data-testid="frame" />} />,
    );

    expect(frame()).toHaveAttribute('data-size', contract.members.textField.defaults.size);
    expect(frame()).toHaveAttribute('data-variant', contract.members.textField.defaults.variant);
    expect(frame()).not.toHaveAttribute('data-mono');
  });

  it('passes every native attribute to the element that owns it', () => {
    render(
      <TextField
        autoComplete="email"
        data-testid="input"
        enterKeyHint="send"
        inputMode="email"
        maxLength={64}
        name="email"
        placeholder="you@company.example"
        required
        spellCheck={false}
        type="email"
      />,
    );

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('inputmode', 'email');
    expect(input).toHaveAttribute('enterkeyhint', 'send');
    expect(input).toHaveAttribute('maxlength', '64');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toBeRequired();
  });

  it('reaches the native element through the ref rather than through a handle', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField defaultValue="Ada" ref={ref} />);

    ref.current?.focus();
    ref.current?.select();
    expect(ref.current?.tagName).toBe('INPUT');
    expect(ref.current?.selectionEnd).toBe(3);
  });

  /* ------------------------------------------------------------- value - */

  it('asks to move rather than announcing that it moved, with a reason', async () => {
    const onValueChange = vi.fn();
    render(<TextField data-testid="input" onValueChange={onValueChange} />);

    const input = screen.getByTestId('input');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });

    expect(onValueChange).toHaveBeenCalledTimes(2);
    const [value, request] = onValueChange.mock.calls[1] ?? [];
    expect(value).toBe('ab');
    expect(request.reason).toBe('keyboard');
    expect(request.previous).toBe('a');
  });

  it('leaves an uncontrolled value on the element, so a native reset restores it', async () => {
    render(
      <form>
        <TextField clearable data-testid="input" defaultValue="Ada" />
        <button type="reset">reset</button>
      </form>,
    );

    const input = screen.getByTestId<HTMLInputElement>('input');
    fireEvent.change(input, { target: { value: 'Ada Lovelace' } });
    expect(input.value).toBe('Ada Lovelace');

    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(input.value).toBe('Ada');
    /* And the mirror followed, so the clear button still knows what is there. */
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('never moves a controlled value on its own', async () => {
    const onValueChange = vi.fn();
    render(<TextField data-testid="input" onValueChange={onValueChange} value="fixo" />);

    fireEvent.change(screen.getByTestId('input'), { target: { value: 'fixox' } });
    expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('fixo');
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('lets a consumer refuse the change before anything commits', async () => {
    render(
      <TextField
        data-testid="input"
        defaultValue="a"
        onValueChange={(_value, request) => request.cancel()}
      />,
    );

    fireEvent.change(screen.getByTestId('input'), { target: { value: 'ab' } });
    /* The element still holds what was typed — the family does not fight the
       browser for an uncontrolled value — but nothing the family owns moved. */
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('runs the consumer’s own handler as well as its own', async () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<TextField data-testid="input" onChange={onChange} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByTestId('input'), { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  /* ------------------------------------------------------------- clear - */

  it('clears the value, says why, and returns focus to the control', async () => {
    const onValueChange = vi.fn();
    render(
      <TextField clearable data-testid="input" defaultValue="Ada" onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('');
    expect(onValueChange.mock.calls[0]?.[1].reason).toBe('clear');
    expect(screen.getByTestId('input')).toHaveFocus();
  });

  it('draws no clear button for an empty, disabled or read-only control', () => {
    const { rerender } = render(<TextField clearable />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();

    rerender(<TextField clearable defaultValue="Ada" disabled />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();

    rerender(<TextField clearable defaultValue="Ada" readOnly />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  /* ------------------------------------------------------------ reveal - */

  it('turns a password into characters without changing what the button is called', async () => {
    render(<TextField data-testid="input" defaultValue="segredo" revealable type="password" />);

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'eye');

    fireEvent.click(toggle);

    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    /* A revealed value is one a press will hide: the glyph is the crossed eye. */
    expect(toggle.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'eye-off');
  });

  it('holds the caret where it was when the type swaps', async () => {
    render(<TextField data-testid="input" defaultValue="segredo" revealable type="password" />);

    const input = screen.getByTestId<HTMLInputElement>('input');
    input.focus();
    input.setSelectionRange(3, 3);

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(3);
  });

  it('reports the reveal as a request carrying its reason', async () => {
    const onRevealedChange = vi.fn();
    render(<TextField onRevealedChange={onRevealedChange} revealable type="password" />);

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }), { detail: 1 });
    expect(onRevealedChange.mock.calls[0]?.[0]).toBe(true);
    expect(onRevealedChange.mock.calls[0]?.[1].reason).toBe('pointer');
  });

  it('offers no reveal toggle on a control that is not a password', () => {
    render(<TextField revealable type="text" />);
    expect(screen.queryByRole('button', { name: 'Show password' })).toBeNull();
  });

  /* -------------------------------------------------------------- field - */

  it('takes its identifier, description and state from the field around it', () => {
    render(
      <Field invalid readOnly required>
        <FieldLabel>EIN</FieldLabel>
        <TextField data-testid="input" />
        <FieldError>Three digits missing.</FieldError>
      </Field>,
    );

    const input = screen.getByTestId('input');
    expect(screen.getByText('EIN')).toHaveAttribute('for', input.id);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('readonly');
    /* `aria-required` and never the native attribute, which would engage
       browser constraint validation and change submit behaviour. */
    expect(input).not.toHaveAttribute('required');
    expect(input.getAttribute('aria-describedby')).toContain('-error');
    expect(input.parentElement).toHaveAttribute('data-invalid');
    expect(input.parentElement).toHaveAttribute('data-readonly');
  });

  it('lets an explicit value on the control win over the field', () => {
    render(
      <Field disabled>
        <TextField data-testid="input" disabled={false} />
      </Field>,
    );
    expect(screen.getByTestId('input')).not.toBeDisabled();
  });

  it('takes its step from the field rather than from the provider', () => {
    render(
      <TextFieldDefaultsProvider size="lg">
        <Field size="sm">
          <TextField data-testid="input" />
        </Field>
        <TextField data-testid="loose" />
      </TextFieldDefaultsProvider>,
    );

    expect(screen.getByTestId('input').parentElement).toHaveAttribute('data-size', 'sm');
    expect(screen.getByTestId('loose').parentElement).toHaveAttribute('data-size', 'lg');
  });

  /* -------------------------------------------------------------- count - */

  it('publishes its count and lets the field draw it', async () => {
    render(
      <Field data-testid="field">
        <FieldLabel>Assunto</FieldLabel>
        <TextField data-testid="input" defaultValue="ab" maxLength={5} showCount />
      </Field>,
    );

    const counter = () => screen.getByTestId('field').querySelector('[data-part="counter"]');
    expect(counter()).toHaveTextContent('2/5');

    fireEvent.change(screen.getByTestId('input'), { target: { value: 'abc' } });
    expect(counter()).toHaveTextContent('3/5');
  });

  it('marks a count that has passed a soft limit the browser does not enforce', () => {
    render(
      <Field data-testid="field">
        <TextField countMax={2} defaultValue="abcd" showCount />
      </Field>,
    );

    const counter = screen.getByTestId('field').querySelector('[data-part="counter"]');
    expect(counter).toHaveTextContent('4/2');
    expect(counter).toHaveAttribute('data-invalid');
  });

  it('leaves a counter the page wrote alone', () => {
    render(
      <Field data-testid="field">
        <FieldCounter>3 palavras</FieldCounter>
        <TextField defaultValue="a b c" showCount />
      </Field>,
    );

    const counters = screen.getByTestId('field').querySelectorAll('[data-part="counter"]');
    expect(counters).toHaveLength(1);
    expect(counters[0]).toHaveTextContent('3 palavras');
  });

  /* ------------------------------------------------------- defaults once - */

  it('lets an application decide the appearance once', () => {
    render(
      <TextFieldDefaultsProvider variant="subtle">
        <TextField clearable data-testid="input" defaultValue="x" />
      </TextFieldDefaultsProvider>,
    );

    expect(screen.getByTestId('input').parentElement).toHaveAttribute('data-variant', 'subtle');
  });

  it('names its buttons in the language in force, and lays its own messages over it', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <TextField clearable defaultValue="x" messages={{ clear: 'Apagar' }} />
        <TextField revealable type="password" />
      </SlottedProvider>,
    );

    expect(screen.getByRole('button', { name: 'Apagar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toBeInTheDocument();
  });

  it('lets a controlled consumer own both values at once', async () => {
    function Controlled() {
      const [value, setValue] = useState('a');
      const [revealed, setRevealed] = useState(false);
      return (
        <TextField
          data-testid="input"
          onRevealedChange={setRevealed}
          onValueChange={setValue}
          revealable
          revealed={revealed}
          type="password"
          value={value}
        />
      );
    }

    render(<Controlled />);
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'ab' } });
    expect(screen.getByTestId<HTMLInputElement>('input').value).toBe('ab');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
  });

  it('copies the value, shows a check and reports whether the clipboard took it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    const onValueCopy = vi.fn();
    try {
      render(
        <TextField
          copyable
          defaultValue="https://slotted.dev/x"
          onValueCopy={onValueCopy}
          readOnly
        />,
      );
      const button = screen.getByRole('button', { name: 'Copy' });
      expect(button.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'copy');
      fireEvent.click(button, { detail: 1 });
      await waitFor(() => expect(onValueCopy).toHaveBeenCalled());
      expect(writeText).toHaveBeenCalledWith('https://slotted.dev/x');
      expect(onValueCopy.mock.calls[0]![0]).toMatchObject({
        copied: true,
        reason: 'pointer',
        value: 'https://slotted.dev/x',
      });
      expect(button).toHaveAttribute('data-complete');
      expect(button.querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'check');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('hides the copy button while there is nothing to copy', () => {
    render(<TextField copyable data-testid="input" />);
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'a' } });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeVisible();
  });

  it('marks the control busy and keeps it editable while loading', () => {
    const { rerender } = render(<TextField data-testid="input" loading />);
    const input = screen.getByTestId('input');
    const root = input.closest('[data-ui="text-field"]')!;
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(input).not.toBeDisabled();
    expect(root).toHaveAttribute('data-loading');
    expect(root.querySelector('[data-part="busy"][data-ui="spinner"]')).not.toHaveAttribute(
      'hidden',
    );

    rerender(<TextField data-testid="input" loading={false} />);
    expect(input).not.toHaveAttribute('aria-busy');
    expect(root).not.toHaveAttribute('data-loading');
    expect(root.querySelector('[data-part="busy"]')).toHaveAttribute('hidden');

    rerender(<TextField data-testid="input" />);
    expect(root.querySelector('[data-part="busy"]')).toBeNull();
  });

  it('warns about Caps Lock in a focused password, once, and forgets it on blur', () => {
    const onKeyDown = vi.fn();
    render(<TextField data-testid="input" onKeyDown={onKeyDown} type="password" />);
    const input = screen.getByTestId('input');
    const mark = () => input.parentElement!.querySelector('[data-part="caps-lock"]')!;
    expect(mark()).toHaveAttribute('hidden');

    fireEvent.keyDown(input, { key: 'a', modifierCapsLock: true });
    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(mark()).not.toHaveAttribute('hidden');
    expect(mark().querySelector('svg[data-glyph]')).toHaveAttribute('data-glyph', 'caps-lock');

    fireEvent.blur(input);
    expect(mark()).toHaveAttribute('hidden');
  });

  it('draws no Caps Lock mark outside a password', () => {
    render(<TextField data-testid="input" />);
    expect(
      screen.getByTestId('input').parentElement!.querySelector('[data-part="caps-lock"]'),
    ).toBeNull();
  });

  it('puts the consumer’s own button inside the frame as a real button', () => {
    const onClick = vi.fn();
    render(
      <TextField
        end={
          <TextFieldAction aria-label="More" onClick={onClick}>
            …
          </TextFieldAction>
        }
      />,
    );
    const action = screen.getByRole('button', { name: 'More' });
    expect(action).toHaveAttribute('data-part', 'action');
    expect(action).toHaveAttribute('type', 'button');
    expect(action.parentElement).toHaveAttribute('data-part', 'end');
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('lets an action render into another element and keep its part', () => {
    render(
      <TextField
        start={<TextFieldAction render={(props) => <button {...props} data-testid="custom" />} />}
      />,
    );
    expect(screen.getByTestId('custom')).toHaveAttribute('data-part', 'action');
  });

  it('keeps the frame’s buttons in the order the stylesheet insets', () => {
    render(
      <TextField
        clearable
        copyable
        data-testid="input"
        defaultValue="a"
        loading
        revealable
        type="password"
      />,
    );
    const parts = [...screen.getByTestId('input').parentElement!.children].map((child) =>
      child.getAttribute('data-part'),
    );
    expect(parts).toEqual(['input', 'busy', 'caps-lock', 'clear', 'copy', 'reveal']);
  });
});
