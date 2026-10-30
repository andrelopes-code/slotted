import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/otp-input/contract.json';
import { Field, FieldError, FieldLabel } from '../field';
import { OtpInput } from './otp-input';
import { OtpInputDefaultsProvider } from './otp-input-defaults';

const input = () => screen.getByTestId('input') as HTMLInputElement;
const root = () => input().parentElement as HTMLElement;
const slots = () => [...root().querySelectorAll<HTMLElement>('[data-part="slot"]')];
const painted = () => slots().map((slot) => slot.textContent);

function type(text: string) {
  const element = input();
  fireEvent.change(element, { target: { value: element.value + text } });
}

describe('OtpInput', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is selected in public by the family identifier and its parts', () => {
    render(<OtpInput data-testid="input" defaultValue="48" groups={[3, 3]} className="code" />);

    expect(root().tagName).toBe('DIV');
    expect(root()).toHaveAttribute('data-ui', 'otp-input');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('code');
    expect(input()).toHaveAttribute('data-part', 'input');
    expect(root().querySelectorAll('[data-part="group"]')).toHaveLength(2);
    expect(root().querySelectorAll('[data-part="separator"]')).toHaveLength(1);
    expect(slots()).toHaveLength(6);
    expect(slots().map((slot) => slot.dataset['index'])).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(painted()).toEqual(['4', '8', '', '', '', '']);
  });

  /**
   * One control, one tab stop, one accessible name. The boxes are paint and
   * are hidden from assistive technology; the root carries no role.
   */
  it('exposes one textbox and hides the boxes', () => {
    render(<OtpInput data-testid="input" aria-label="Code" />);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(root()).not.toHaveAttribute('role');
    expect(contract.rootRole).toBeNull();
    for (const group of root().querySelectorAll('[data-part="group"]')) {
      expect(group).toHaveAttribute('aria-hidden', 'true');
    }
    expect(root().querySelector('[tabindex]')).toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    render(<OtpInput data-testid="input" />);
    const defaults = contract.members.otpInput.defaults;
    expect(root()).toHaveAttribute('data-size', defaults.size);
    expect(root()).toHaveAttribute('data-variant', defaults.variant);
    expect(root()).not.toHaveAttribute('data-attached');
    expect(root()).not.toHaveAttribute('data-mask');
    expect(slots()).toHaveLength(defaults.length);
    expect(input()).toHaveAttribute('maxlength', String(defaults.length));
    expect(input()).toHaveAttribute('autocomplete', contract.autocomplete);
    expect(input()).toHaveAttribute('inputmode', contract.inputMode.numeric);
    expect(input()).toHaveAttribute('type', 'text');
    expect(input()).toHaveAttribute('spellcheck', 'false');
  });

  it('passes every native attribute to the element that owns it', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <OtpInput
        autoComplete="off"
        data-testid="input"
        form="verify"
        inputMode="tel"
        name="code"
        ref={ref}
        type="alphanumeric"
      />,
    );
    expect(input()).toHaveAttribute('name', 'code');
    expect(input()).toHaveAttribute('form', 'verify');
    expect(input()).toHaveAttribute('autocomplete', 'off');
    expect(input()).toHaveAttribute('inputmode', 'tel');
    expect(ref.current).toBe(input());
  });

  it('derives the keyboard from the type', () => {
    render(<OtpInput data-testid="input" type="alphanumeric" />);
    expect(input()).toHaveAttribute('inputmode', contract.inputMode.alphanumeric);
  });

  describe('value', () => {
    it('holds its own value uncontrolled and asks with reason keyboard', () => {
      const onValueChange = vi.fn();
      render(<OtpInput data-testid="input" onValueChange={onValueChange} />);
      type('4');
      expect(input().value).toBe('4');
      expect(painted()).toEqual(['4', '', '', '', '', '']);
      expect(onValueChange).toHaveBeenCalledWith(
        '4',
        expect.objectContaining({ previous: '', reason: 'keyboard' }),
      );
    });

    it('waits for the consumer when controlled', () => {
      const onValueChange = vi.fn();
      render(<OtpInput data-testid="input" onValueChange={onValueChange} value="12" />);
      type('3');
      expect(onValueChange).toHaveBeenCalledWith('123', expect.anything());
      expect(input().value).toBe('12');
      expect(painted()).toEqual(['1', '2', '', '', '', '']);
    });

    it('moves when the consumer accepts', () => {
      function Owner() {
        const [code, setCode] = useState('');
        return <OtpInput data-testid="input" onValueChange={setCode} value={code} />;
      }
      render(<Owner />);
      type('9');
      type('1');
      expect(input().value).toBe('91');
      expect(painted()).toEqual(['9', '1', '', '', '', '']);
    });

    it('lets the request be cancelled', () => {
      render(<OtpInput data-testid="input" onValueChange={(_, request) => request.cancel()} />);
      type('4');
      expect(painted()).toEqual(['', '', '', '', '', '']);
    });

    it('reads defaultValue once, cut to the code, and restores it on reset', () => {
      render(
        <form>
          <OtpInput data-testid="input" defaultValue="12-3456789" />
        </form>,
      );
      expect(input().value).toBe('123456');
      expect(painted()).toEqual(['1', '2', '3', '4', '5', '6']);
      fireEvent.change(input(), { target: { value: '' } });
      expect(painted()).toEqual(['', '', '', '', '', '']);
      fireEvent.reset(input().form as HTMLFormElement);
      expect(painted()).toEqual(['1', '2', '3', '4', '5', '6']);
    });
  });

  describe('filter', () => {
    it('drops what the type refuses, reports it, and keeps the rest', () => {
      const onRejected = vi.fn();
      const onValueChange = vi.fn();
      render(
        <OtpInput data-testid="input" onRejected={onRejected} onValueChange={onValueChange} />,
      );
      fireEvent.change(input(), { target: { value: '48-29 15' } });
      expect(input().value).toBe('482915');
      expect(onRejected).toHaveBeenCalledWith('- ', expect.anything());
      expect(onValueChange).toHaveBeenCalledWith('482915', expect.anything());
    });

    it('takes letters for an alphanumeric code and a pattern over the type', () => {
      render(<OtpInput data-testid="input" type="alphanumeric" pattern={/[A-Z]/} length={4} />);
      fireEvent.change(input(), { target: { value: 'aB1C' } });
      expect(input().value).toBe('BC');
    });

    it('runs the transform before the filter, on every edit', () => {
      render(
        <OtpInput
          data-testid="input"
          length={4}
          transform={(text) => text.replace(/^g-/i, '').toUpperCase()}
          type="alphanumeric"
        />,
      );
      fireEvent.change(input(), { target: { value: 'g-x7kq' } });
      expect(input().value).toBe('X7KQ');
      expect(painted()).toEqual(['X', '7', 'K', 'Q']);
    });

    it('says nothing when an edit lost nothing', () => {
      const onRejected = vi.fn();
      render(<OtpInput data-testid="input" onRejected={onRejected} />);
      type('4');
      expect(onRejected).not.toHaveBeenCalled();
    });
  });

  describe('completion', () => {
    it('marks the root and reports the value once it is whole', () => {
      const onComplete = vi.fn();
      render(<OtpInput data-testid="input" length={4} onComplete={onComplete} />);
      expect(root()).not.toHaveAttribute('data-complete');
      fireEvent.change(input(), { target: { value: '123' } });
      expect(onComplete).not.toHaveBeenCalled();
      fireEvent.change(input(), { target: { value: '1234' } });
      expect(root()).toHaveAttribute('data-complete');
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith('1234');
    });

    it('reports a full code edited into another, and one emptied and retyped', () => {
      const onComplete = vi.fn();
      render(<OtpInput data-testid="input" length={2} onComplete={onComplete} />);
      fireEvent.change(input(), { target: { value: '12' } });
      fireEvent.change(input(), { target: { value: '13' } });
      fireEvent.change(input(), { target: { value: '' } });
      fireEvent.change(input(), { target: { value: '12' } });
      expect(onComplete.mock.calls.map(([value]) => value)).toEqual(['12', '13', '12']);
    });

    it('submits the owning form when asked', () => {
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <OtpInput autoSubmit data-testid="input" length={2} />
        </form>,
      );
      /* jsdom has no `requestSubmit`; the call is what is asserted. */
      const form = input().form as HTMLFormElement;
      form.requestSubmit = vi.fn(() =>
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
      );
      fireEvent.change(input(), { target: { value: '12' } });
      expect(form.requestSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('paint', () => {
    it('spreads the placeholder over the empty boxes only', () => {
      render(<OtpInput data-testid="input" defaultValue="4" placeholder="○" />);
      expect(slots().map((slot) => slot.dataset['placeholder'])).toEqual([
        undefined,
        '○',
        '○',
        '○',
        '○',
        '○',
      ]);
    });

    it('masks through the platform and paints a bullet per character', () => {
      render(<OtpInput data-testid="input" defaultValue="5391" mask />);
      expect(input()).toHaveAttribute('type', contract.maskType);
      expect(root()).toHaveAttribute('data-mask');
      expect(painted()).toEqual(['•', '•', '•', '•', '', '']);
      expect(root().textContent).not.toContain('5');
    });

    it('draws one group when the partition does not add up', () => {
      render(<OtpInput data-testid="input" groups={[2, 2]} />);
      expect(root().querySelectorAll('[data-part="group"]')).toHaveLength(1);
      expect(slots()).toHaveLength(6);
    });

    it('joins the boxes when attached', () => {
      render(<OtpInput attached data-testid="input" />);
      expect(root()).toHaveAttribute('data-attached');
    });
  });

  describe('selection', () => {
    it('marks the box the cursor is in while the control has focus, and none after', () => {
      render(<OtpInput data-testid="input" defaultValue="48" />);
      expect(root().querySelector('[data-current]')).toBeNull();
      act(() => input().focus());
      expect(slots()[2]).toHaveAttribute('data-current');
      expect(root().querySelectorAll('[data-current]')).toHaveLength(1);
      act(() => input().blur());
      expect(root().querySelector('[data-current]')).toBeNull();
    });

    it('selects the last character of a full code on focus, so typing replaces it', () => {
      render(<OtpInput data-testid="input" defaultValue="482915" />);
      act(() => input().focus());
      expect([input().selectionStart, input().selectionEnd]).toEqual([5, 6]);
      expect(slots()[5]).toHaveAttribute('data-current');
    });

    it('selects the character in front of a cursor placed inside the value', () => {
      render(<OtpInput data-testid="input" defaultValue="4829" />);
      act(() => input().focus());
      act(() => {
        input().setSelectionRange(1, 1);
        document.dispatchEvent(new Event('selectionchange'));
      });
      expect([input().selectionStart, input().selectionEnd]).toEqual([1, 2]);
      expect(slots()[1]).toHaveAttribute('data-current');
    });

    it('marks every box inside a range the reader made', () => {
      render(<OtpInput data-testid="input" defaultValue="4829" />);
      act(() => input().focus());
      act(() => {
        input().setSelectionRange(0, 3);
        document.dispatchEvent(new Event('selectionchange'));
      });
      expect(slots().map((slot) => slot.hasAttribute('data-current'))).toEqual([
        true,
        true,
        true,
        false,
        false,
        false,
      ]);
    });

    it('puts the cursor in the box under the pointer', () => {
      render(<OtpInput data-testid="input" defaultValue="4829" />);
      const target = slots()[1] as HTMLElement;
      document.elementsFromPoint = vi.fn(() => [input(), target, root()]);
      fireEvent.pointerDown(root(), { clientX: 10, clientY: 10 });
      expect(document.activeElement).toBe(input());
      expect([input().selectionStart, input().selectionEnd]).toEqual([1, 2]);
      expect(target).toHaveAttribute('data-current');
    });

    /**
     * A press on a selected character starts a native drag of that text, with
     * a ghost of the character floating under the pointer — and in a full code
     * a character is selected at every press.
     */
    it('refuses to drag the selected character, and still runs the consumer’s handler', () => {
      const onDragStart = vi.fn();
      render(<OtpInput data-testid="input" defaultValue="482915" onDragStart={onDragStart} />);
      const event = new Event('dragstart', { bubbles: true, cancelable: true });
      input().dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(onDragStart).toHaveBeenCalledTimes(1);
    });

    it('clamps a press past the value to the first empty box', () => {
      render(<OtpInput data-testid="input" defaultValue="48" />);
      const target = slots()[4] as HTMLElement;
      document.elementsFromPoint = vi.fn(() => [input(), target, root()]);
      fireEvent.pointerDown(root(), { clientX: 10, clientY: 10 });
      expect([input().selectionStart, input().selectionEnd]).toEqual([2, 2]);
      expect(slots()[2]).toHaveAttribute('data-current');
    });
  });

  describe('field', () => {
    it('takes its identity, its description and its state from the field', () => {
      render(
        <Field invalid size="sm" required>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput data-testid="input" />
          <FieldError>Incorrect code.</FieldError>
        </Field>,
      );
      expect(screen.getByLabelText(/Verification code/)).toBe(input());
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      expect(input()).toHaveAttribute('aria-required', 'true');
      expect(input()).not.toHaveAttribute('required');
      expect(input()).toHaveAccessibleDescription(/Incorrect code./);
      expect(root()).toHaveAttribute('data-invalid');
      expect(root()).toHaveAttribute('data-size', 'sm');
    });

    it('mirrors disabled and readonly, stated or inherited', () => {
      const { rerender } = render(
        <Field disabled readOnly>
          <OtpInput data-testid="input" />
        </Field>,
      );
      expect(input()).toBeDisabled();
      expect(input()).toHaveAttribute('readonly');
      expect(root()).toHaveAttribute('data-disabled');
      expect(root()).toHaveAttribute('data-readonly');

      rerender(
        <Field disabled>
          <OtpInput data-testid="input" disabled={false} />
        </Field>,
      );
      expect(input()).not.toBeDisabled();
      expect(root()).not.toHaveAttribute('data-disabled');
    });
  });

  it('lets an application decide once, and an instance still win', () => {
    render(
      <OtpInputDefaultsProvider
        attached
        length={4}
        placeholder="○"
        size="lg"
        type="alphanumeric"
        variant="subtle"
      >
        <OtpInput data-testid="input" />
        <OtpInput data-testid="own" length={8} size="sm" />
      </OtpInputDefaultsProvider>,
    );
    expect(root()).toHaveAttribute('data-size', 'lg');
    expect(root()).toHaveAttribute('data-variant', 'subtle');
    expect(root()).toHaveAttribute('data-attached');
    expect(slots()).toHaveLength(4);
    expect(input()).toHaveAttribute('inputmode', 'text');
    expect(slots()[0]).toHaveAttribute('data-placeholder', '○');

    const own = screen.getByTestId('own').parentElement as HTMLElement;
    expect(own).toHaveAttribute('data-size', 'sm');
    expect(own.querySelectorAll('[data-part="slot"]')).toHaveLength(8);
  });

  it('renders the root into another element and composes the consumer’s handlers', () => {
    const onChange = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <OtpInput
        data-testid="input"
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        render={(props) => <section {...props} data-testid="frame" />}
      />,
    );
    const frame = screen.getByTestId('frame');
    expect(frame.tagName).toBe('SECTION');
    expect(frame).toHaveAttribute('data-ui', 'otp-input');
    act(() => input().focus());
    type('4');
    act(() => input().blur());
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  describe('WebOTP', () => {
    it('asks the platform for the code, fills it with reason programmatic, and lets go on unmount', async () => {
      const abort = vi.fn();
      const get = vi.fn(({ signal }: { signal: AbortSignal }) => {
        signal.addEventListener('abort', abort);
        return Promise.resolve({ code: '48-2915' });
      });
      Object.defineProperty(window, 'OTPCredential', { configurable: true, value: class {} });
      Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get } });
      const onValueChange = vi.fn();
      const { unmount } = render(
        <OtpInput data-testid="input" onValueChange={onValueChange} webOtp />,
      );
      expect(get).toHaveBeenCalledWith(expect.objectContaining({ otp: { transport: ['sms'] } }));
      await act(async () => undefined);
      expect(input().value).toBe('482915');
      expect(onValueChange).toHaveBeenCalledWith(
        '482915',
        expect.objectContaining({ reason: 'programmatic' }),
      );
      unmount();
      expect(abort).toHaveBeenCalled();
      delete (window as { OTPCredential?: unknown }).OTPCredential;
    });

    it('asks nothing where the API does not exist', () => {
      const get = vi.fn();
      Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get } });
      render(<OtpInput data-testid="input" webOtp />);
      expect(get).not.toHaveBeenCalled();
    });
  });
});
