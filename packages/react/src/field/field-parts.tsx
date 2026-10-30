import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import { fieldMessages } from '@slotted/core/i18n';
import { useEffect, useId, useRef } from 'react';
import type { FocusEvent, MouseEvent, PointerEvent } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { InlineMessage } from '../inline-message';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
  useTooltip,
} from '../tooltip';
import {
  formatFieldCount,
  hasFieldContent,
  isFieldCountOver,
  necessityMark,
  useField,
} from './field-context';
import type {
  FieldActionProps,
  FieldActionRootProps,
  FieldControlProps,
  FieldControlRootProps,
  FieldCounterProps,
  FieldCounterRootProps,
  FieldDescribedSlot,
  FieldHeaderProps,
  FieldHeaderRootProps,
  FieldHelpProps,
  FieldIndicatorProps,
  FieldIndicatorRootProps,
  FieldLabelProps,
  FieldLabelRootProps,
  FieldMessageProps,
} from './field.types';

/** The consumer's handler first, and the family's unless the consumer prevented it. */
function compose<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

/** A part that joins the field's `aria-describedby`, registered while it has something to say. */
function useRegisterMessage(slot: FieldDescribedSlot, present: boolean) {
  const field = useField();
  const register = field?.registerMessage;

  useEffect(() => {
    if (register === undefined) return;
    register(slot, present);
    return () => register(slot, false);
  }, [present, register, slot]);
}

/**
 * Names the control, and says whether it has to be answered.
 *
 * The association is explicit — `for` pointing at the control's identifier —
 * because the APG's naming practice records that some combinations of assistive
 * technology and browser fail to treat the implicit form, wrapping the control
 * in the label, as having an accessible name at all.
 *
 * The necessity marker is drawn here rather than written by the page. The glyph
 * is `aria-hidden`, because `aria-required` on the control already carries the
 * semantics and a reader working a form of twenty required fields does not need
 * to hear "asterisk" twenty times; the two word forms are not hidden, because
 * `(optional)` is information rather than decoration.
 */
export function FieldLabel({
  children,
  htmlFor,
  id,
  ref,
  render,
  ...nativeProps
}: FieldLabelProps) {
  const field = useField();
  const own = useMessages(fieldMessages);
  const mark = necessityMark(field?.necessity ?? 'mark', field?.required === true, field?.t ?? own);

  const rootProps: FieldLabelRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {children}
        {mark === null ? null : (
          <>
            {/* Text rather than a margin, so the accessible name reads `Note (optional)`. */}{' '}
            <span {...withSelectorKey(mark.hidden ? { 'aria-hidden': true } : {}, 'part', 'mark')}>
              {mark.text}
            </span>
          </>
        )}
      </>
    ),
    'data-part': 'label',
    htmlFor: htmlFor ?? field?.ids.control,
    id: id ?? field?.ids.label,
  });

  return render === undefined ? <label {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * Applies the field's wiring to a control the library does not own — a plain
 * `input`, or a consumer's own component through `render`.
 *
 * Controls this library ships read the field themselves and need no wrapper, so
 * this part exists for the two cases that cannot: a native element, which
 * cannot read React context, and a component written before this library.
 *
 * Every value the consumer states wins. The field fills what is unset and
 * overwrites nothing, which is what keeps composition from removing capability.
 */
export function FieldControl({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  disabled,
  id,
  readOnly,
  ref,
  render,
  ...nativeProps
}: FieldControlProps) {
  const field = useField();
  const register = field?.registerControl;

  useEffect(() => register?.(), [register]);

  const merged = [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined;

  const rootProps: FieldControlRootProps = keyedProps({
    ...nativeProps,
    'aria-describedby': merged,
    'aria-invalid': ariaInvalid ?? (field?.invalid === true ? true : undefined),
    'aria-required': ariaRequired ?? (field?.required === true ? true : undefined),
    'data-part': 'control',
    disabled: disabled ?? field?.disabled,
    id: id ?? field?.ids.control,
    readOnly: readOnly ?? field?.readOnly,
  });

  return render === undefined ? <input {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * Help about the field, in the field's own message family.
 *
 * It renders an `inline-message`, so it arrives with a tone, a mark, a clipped
 * severity word an application translates once, and a `reserve` that holds its
 * line open — none of which the field reimplements. `docs/process/build-order.md`
 * states that as the reason `inline-message` was built in wave 2.
 */
export function FieldDescription({ children, mark, tone, ...rest }: FieldMessageProps) {
  const field = useField();
  useRegisterMessage('description', hasFieldContent(children));

  return (
    <InlineMessage
      {...rest}
      disabled={field?.disabled}
      id={field?.ids.description}
      mark={mark ?? 'none'}
      size={field?.messageSize}
      tone={tone ?? 'secondary'}
    >
      {children}
    </InlineMessage>
  );
}

/**
 * What is wrong with the value, in words — which is what WCAG 2.2 SC 3.3.1
 * requires and what colour and a mark alone do not satisfy.
 *
 * `tone` defaults to `danger` and accepts the other four, so a warning that
 * does not block submission is the same part in another tone rather than a
 * member of its own. Fluent spends a `validationState` axis on that distinction
 * and Carbon a second component.
 *
 * `live` defaults to `off`, because a message already on the page when it loads
 * is announced by nothing whatever role it carries. A form that raises the error
 * after submit sets `live="polite"` and the reader hears it once.
 */
export function FieldError({ children, mark, tone, ...rest }: FieldMessageProps) {
  const field = useField();
  useRegisterMessage('error', hasFieldContent(children));

  return (
    <InlineMessage
      {...rest}
      disabled={field?.disabled}
      id={field?.ids.error}
      mark={mark ?? 'none'}
      size={field?.messageSize}
      tone={tone ?? 'danger'}
    >
      {children}
    </InlineMessage>
  );
}

/**
 * A count at the end of the label row — which is where Carbon puts it. Angular
 * Material puts it in the subscript beside the error, where a count that
 * appears on the first keystroke shares a row with the message and pushes it.
 *
 * Written with no children, it reads the count the control published: the
 * control owns the number and the field owns the place. Written with children,
 * they win and nothing is read — a count over words, bytes or line items is one
 * only the page can compute, and it is why this part still takes content.
 *
 * A field whose control publishes a count and whose page writes no counter gets
 * one anyway, drawn by the field. This part exists for the page that wants to
 * put it somewhere else, say it differently, or count something else.
 */
export function FieldCounter({
  children,
  invalid,
  ref,
  render,
  ...nativeProps
}: FieldCounterProps) {
  const field = useField();
  const register = field?.registerCounter;
  const count = field?.count;

  useEffect(() => {
    if (register === undefined) return;
    register(true);
    return () => register(false);
  }, [register]);

  const own = children === undefined && count !== undefined;
  const over = invalid ?? (own && count !== undefined ? isFieldCountOver(count) : false);

  const rootProps: FieldCounterRootProps = keyedProps({
    ...nativeProps,
    children: own && count !== undefined ? formatFieldCount(count) : children,
    ...(over ? { 'data-invalid': '' } : {}),
    'data-part': 'counter',
    id: nativeProps.id ?? field?.ids.counter,
  });

  return render === undefined ? <span {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * The label row, when the label has company: the help, an indicator, an action
 * and the counter beside it. ReUI writes the same row by hand in four of its
 * examples; here it is a part, so its alignment, its gap and its place in a
 * side layout are the family's.
 *
 * It draws the count the control published at its own end when the page wrote
 * no counter, which is where a field without a header puts it too.
 */
export function FieldHeader({ children, ref, render, ...nativeProps }: FieldHeaderProps) {
  const field = useField();
  const register = field?.registerHeader;

  useEffect(() => {
    if (register === undefined) return;
    register(true);
    return () => register(false);
  }, [register]);

  const count = field?.count;
  const drawn =
    count === undefined || field?.hasCounter === true ? null : (
      <span
        {...(isFieldCountOver(count) ? { 'data-invalid': '' } : {})}
        data-part="counter"
        data-part-counter=""
        id={field?.ids.counter}
      >
        {formatFieldCount(count)}
      </span>
    );

  const rootProps: FieldHeaderRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {children}
        {drawn}
      </>
    ),
    'data-part': 'header',
  });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * What qualifies the field — `Beta`, `Pro`, `New` — as one or more `Badge`s
 * after the label. It stands outside the `label`, so the necessity mark stays
 * against the label's last word, and it joins the control's description, so a
 * reader on the control hears it.
 */
export function FieldIndicator({ children, id, ref, render, ...nativeProps }: FieldIndicatorProps) {
  const field = useField();
  useRegisterMessage('indicator', hasFieldContent(children));

  const rootProps: FieldIndicatorRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'indicator',
    id: id ?? field?.ids.indicator,
  });

  return render === undefined ? <span {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * A link or a button at the end of the label row — `Forgot password?`,
 * `Generate`. A `button type="button"` by default, so it never submits the form
 * it sits in; a link through `render`, which receives the props without `type`.
 * The field does not disable it with the control: what it does is the page's.
 */
export function FieldAction({ ref, render, type, ...nativeProps }: FieldActionProps) {
  const rootProps: FieldActionRootProps = keyedProps({ ...nativeProps, 'data-part': 'action' });

  return render === undefined ? (
    <button {...rootProps} ref={ref} type={type ?? 'button'} />
  ) : (
    render(rootProps)
  );
}

/**
 * The help beside the label: a button drawing `circle-question`, and the hint in
 * a `Tooltip`.
 *
 * **A press is the hint.** A tooltip opens on a coarse pointer only by a long
 * press, because a tap is the trigger's own action; this button has no other
 * action, so the family runs the tooltip by hand (`openOn="manual"`) and a press
 * pins the hint open, a second press closes it. Hover and keyboard focus still
 * open it the way every tooltip opens, and a hint opened by hover closes when
 * the pointer leaves, unless a press pinned it. It is Carbon's toggletip.
 *
 * **The words are written once and heard in two places.** The tooltip's layer
 * exists only while it is open, so the button and the control are described by
 * a `hidden` node inside the button carrying the same text — a directly referenced hidden element
 * still enters the description (accname 1.2, step 2A) — and the tooltip is asked
 * to describe nothing, so the hint is not read twice.
 *
 * **It stays operable on a disabled field.** The help is often where the reason
 * the field is off is written.
 */
export function FieldHelp({
  children,
  defaultOpen,
  onOpenChange,
  open,
  side,
  ...buttonProps
}: FieldHelpProps) {
  const field = useField();
  const own = useMessages(fieldMessages);
  const fallbackId = useId();
  const textId = field?.ids.help ?? `slotted-field-help-${fallbackId}`;
  useRegisterMessage('help', hasFieldContent(children));

  return (
    <>
      <Tooltip
        closeOnPress={false}
        defaultOpen={defaultOpen}
        describes="none"
        onOpenChange={onOpenChange}
        open={open}
        openOn="manual"
        side={side}
      >
        <FieldHelpTrigger
          {...buttonProps}
          aria-describedby={buttonProps['aria-describedby'] ?? textId}
          aria-label={buttonProps['aria-label'] ?? (field?.t ?? own)('help')}
        >
          <span data-part="help-text" data-part-help-text="" hidden id={textId}>
            {children}
          </span>
        </FieldHelpTrigger>
        <TooltipLayer>
          <TooltipContent>{children}</TooltipContent>
          <TooltipArrow />
        </TooltipLayer>
      </Tooltip>
    </>
  );
}

type FieldHelpTriggerProps = Omit<FieldHelpProps, 'defaultOpen' | 'onOpenChange' | 'open' | 'side'>;

function FieldHelpTrigger({
  children,
  onBlur,
  onClick,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...nativeProps
}: FieldHelpTriggerProps) {
  const tooltip = useTooltip();
  const pinned = useRef(false);

  /* A hint closed from anywhere — Escape, a press outside, the consumer — is
     no longer pinned by the press that opened it. */
  useEffect(() => {
    if (!tooltip.open) pinned.current = false;
  }, [tooltip.open]);

  const enter = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'touch') return;
    if (!tooltip.open) tooltip.openAfterDelay(event.nativeEvent);
  };

  const leave = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'touch' || pinned.current) return;
    tooltip.closeAfterDelay(event.nativeEvent);
  };

  /** `:focus-visible` rather than every focus: a press focuses the button too. */
  const focus = (event: FocusEvent<HTMLButtonElement>) => {
    if (!event.target.matches(':focus-visible')) return;
    tooltip.toggle(true, 'keyboard', event.nativeEvent);
  };

  const blur = (event: FocusEvent<HTMLButtonElement>) => {
    tooltip.toggle(false, 'blur', event.nativeEvent);
  };

  /**
   * A click synthesised by the keyboard reports no detail; a real one reports
   * the click count, which is how `Enter` and `Space` are told from a press.
   */
  const press = (event: MouseEvent<HTMLButtonElement>) => {
    const reason = event.detail === 0 ? 'keyboard' : 'pointer';
    if (tooltip.open && pinned.current) {
      pinned.current = false;
      tooltip.toggle(false, reason, event.nativeEvent);
      return;
    }
    pinned.current = true;
    tooltip.toggle(true, reason, event.nativeEvent);
  };

  return (
    <TooltipTrigger
      {...withSelectorKey(nativeProps, 'part', 'help')}

      onBlur={compose(onBlur, blur)}
      onClick={compose(onClick, press)}
      onFocus={compose(onFocus, focus)}
      onPointerEnter={compose(onPointerEnter, enter)}
      onPointerLeave={compose(onPointerLeave, leave)}
      ref={ref}
    >
      <Icon>
        <Glyph name="circle-question" />
      </Icon>
      {children}
    </TooltipTrigger>
  );
}
