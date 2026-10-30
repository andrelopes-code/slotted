import { selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/button/button.css';

import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { useEffect, useState } from 'react';
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';
import type { ComponentPropsWithRef } from 'react';

import { useButtonDefaults } from './button-defaults';
import type {
  ButtonAppearanceProps,
  ButtonDisabledProps,
  ButtonJustify,
  ButtonLoadingProps,
  ButtonPressedProps,
  ButtonShape,
  ButtonSize,
  ButtonTone,
  ButtonVariant,
} from './button.types';

interface RootDataOptions {
  disabled?: boolean;
  fullWidth?: boolean;
  justify?: ButtonJustify;
  loading?: boolean;
  pressed?: boolean | undefined;
  shape?: ButtonShape;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

/**
 * The public identity of every member: one family identifier, one root part,
 * and the axes and states a consumer may select on. Class names and the shape
 * of the tree below this element are not contract.
 */
export function rootData(options: RootDataOptions) {
  return {
    'data-ui': 'button',
    ...selectorKeyProps('ui', 'button'),
    'data-part': 'root',
    ...selectorKeyProps('part', 'root'),
    'data-tone': options.tone,
    'data-variant': options.variant,
    'data-size': options.size,
    'data-shape': options.shape,
    'data-full-width': options.fullWidth ? '' : undefined,
    'data-justify': options.justify,
    'data-disabled': options.disabled ? '' : undefined,
    'data-loading': options.loading ? '' : undefined,
    'data-pressed': options.pressed ? '' : undefined,
  } as const;
}

/**
 * An explicit value wins over the provider, and the provider over the member's
 * own default. The three are read in that order rather than merged, so an
 * application that sets only `size` leaves each member the tone and the paint
 * it was designed with.
 */
export function useAppearance<
  Defaults extends { tone: ButtonTone; variant: ButtonVariant; size: ButtonSize },
>(props: ButtonAppearanceProps, fallback: Defaults) {
  const provided = useButtonDefaults();

  return {
    tone: props.tone ?? provided.tone ?? fallback.tone,
    variant: props.variant ?? provided.variant ?? fallback.variant,
    size: props.size ?? provided.size ?? fallback.size,
  };
}

export function blockActivation(event: SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation?.();
}

type LinkActivationProps = Pick<
  ComponentPropsWithRef<'a'>,
  | 'onAuxClick'
  | 'onAuxClickCapture'
  | 'onClick'
  | 'onClickCapture'
  | 'onKeyDown'
  | 'onKeyDownCapture'
  | 'tabIndex'
>;

/**
 * What a disabled link is, for every member drawn on an anchor: no `href`, so
 * no click, middle click or modified click navigates; `role="link"` and
 * `aria-disabled`, and a stated `tabIndex`, so it stays reachable and says why
 * nothing happens. Enter is refused with the clicks.
 */
export function linkInertness(
  disabled: boolean,
  href: string | undefined,
  rendered: boolean,
  props: LinkActivationProps,
) {
  const block = (event: SyntheticEvent) => {
    if (!disabled) return false;
    blockActivation(event);
    return true;
  };

  return {
    'aria-disabled': disabled || undefined,
    role: disabled ? 'link' : undefined,
    tabIndex: disabled ? (props.tabIndex ?? 0) : props.tabIndex,
    ...(!rendered && !disabled ? { href } : {}),
    onAuxClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (block(event)) return;
      props.onAuxClick?.(event);
    },
    onAuxClickCapture: (event: MouseEvent<HTMLAnchorElement>) => {
      if (block(event)) return;
      props.onAuxClickCapture?.(event);
    },
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (block(event)) return;
      props.onClick?.(event);
    },
    onClickCapture: (event: MouseEvent<HTMLAnchorElement>) => {
      if (block(event)) return;
      props.onClickCapture?.(event);
    },
    onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === 'Enter' && block(event)) return;
      props.onKeyDown?.(event);
    },
    onKeyDownCapture: (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === 'Enter' && block(event)) return;
      props.onKeyDownCapture?.(event);
    },
  };
}

/**
 * Being unavailable and being unreachable are two decisions the platform only
 * offers together. `disabled` takes the control out of the tab sequence, which
 * takes its tooltip and its explanation with it; `aria-disabled` announces the
 * same thing and leaves it reachable, at the price of a refusal the family has
 * to enforce itself.
 *
 * A waiting control is always the second kind. React Aria's pending button and
 * Primer's loading button agree: focus must survive an action the person just
 * started, or the keyboard lands somewhere else mid-task.
 */
export function inertness({
  disabled = false,
  focusableWhenDisabled = false,
  loading = false,
}: ButtonDisabledProps & { loading?: boolean }) {
  return {
    /** Refuse the activation: both states do, and the capture phase is where. */
    refuses: disabled || loading,
    nativelyDisabled: disabled && !focusableWhenDisabled,
    ariaDisabled: (disabled && focusableWhenDisabled) || loading || undefined,
  };
}

/**
 * A native button fires the same `click` for a pointer, for Space and for
 * Enter, which is exactly why the family uses one — and why the reason a
 * toggle moved has to be recovered from the event. A click synthesised by the
 * keyboard reports no detail; a real one reports the click count.
 */
export function activationReason(event: MouseEvent): ChangeReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * Whether the ring is drawn yet. The wait itself starts at once — the
 * activation is refused from the first millisecond — but a spinner shown for
 * ninety of them is a flash rather than a status, so the picture can lag the
 * state by as long as the consumer says.
 *
 * The first render answers without a timer, so the server and the client agree
 * on what they drew.
 */
export function useLoadingIndicator({ loading = false, loadingDelay = 0 }: ButtonLoadingProps) {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    if (!loading || loadingDelay <= 0) {
      setElapsed(false);
      return undefined;
    }
    const timer = setTimeout(() => setElapsed(true), loadingDelay);
    return () => clearTimeout(timer);
  }, [loading, loadingDelay]);

  return loading && (loadingDelay <= 0 || elapsed);
}

/**
 * The controlled and uncontrolled pair, decided once by whether `pressed` was
 * passed. `@slotted/core/state` owns that decision so the two bindings cannot
 * disagree about who holds the value; the controllable is rebuilt each render
 * over React's own state rather than kept as a mutable object across renders.
 */
export function usePressed({
  defaultPressed = false,
  onPressedChange,
  pressed,
}: ButtonPressedProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultPressed);
  const state = createControllable<boolean>({
    controlled: pressed,
    initial: uncontrolled,
    onRequest: (request) => onPressedChange?.(request.value, request),
  });

  return {
    pressed: state.value,
    requestToggle(event: MouseEvent) {
      const next = !state.value;
      if (state.request(next, activationReason(event), event)) setUncontrolled(next);
    },
  };
}

/**
 * Whether the consumer opted into the toggle capability at all. Passing either
 * half of the state model is the opt-in, and a handler alone is not: an icon
 * button that announced `aria-pressed` without a value would be announcing a
 * state it does not have, and Angular cannot see whether an output was
 * subscribed, so a rule that counted the handler could not hold in both
 * bindings.
 */
export function holdsPressedState({ defaultPressed, pressed }: ButtonPressedProps) {
  return pressed !== undefined || defaultPressed !== undefined;
}
