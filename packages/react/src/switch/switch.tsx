import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/switch/switch.css';

import { switchMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent, ReactNode } from 'react';

import { useField } from '../field';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { VisuallyHidden } from '../visually-hidden';
import { SWITCH_LOADING_ANNOUNCE_DELAY, useSwitchDefaults } from './switch-defaults';
import type { SwitchProps, SwitchRootProps } from './switch.types';

/**
 * Why the switch moved, read from the event rather than guessed. A pointer
 * press reports a click count; Space on a checkbox reports none but is
 * trusted; `element.click()` reports neither, and calling that `keyboard`
 * would tell a consumer a person pressed a key nobody pressed.
 *
 * It takes the two facts rather than the event, and it is exported for the
 * test: `isTrusted` is a read-only property no test can forge, so the trusted
 * half of the rule is unreachable through a dispatched event.
 */
export function activationReason(activation: { detail: number; isTrusted: boolean }): ChangeReason {
  if (activation.detail > 0) return 'pointer';
  return activation.isTrusted ? 'keyboard' : 'programmatic';
}

/**
 * A binary setting that takes effect immediately.
 *
 * **The control is a checkbox with the switch role.** Space toggles it, a
 * `<label for>` names it and doubles the target, `name` and `value` are
 * submitted, `form.reset()` restores it, and a disabled `fieldset` disables it
 * — none of which a `button` gives, and all of which the family that shipped
 * before this one had to do without. ARIA 1.2 declares the `switch` role
 * Children Presentational, so the role goes on the void `input` and never on
 * the root: a root carrying it would fold the label and the description beside
 * it into the control's own accessible name.
 *
 * **The label is the control's own.** It points at the control through `for`,
 * so it names the switch and doubles its target, and the description under it
 * sits outside the label — inside, it would join the accessible name. The
 * anatomy is `checkbox`'s, down to the metrics, because two binary controls in
 * one list have to line up.
 *
 * **The click is the request.** It is the one event that fires for a pointer,
 * for Space and for `click()`, and the one that can be refused before the
 * element moves. A consumer who owns the value, a cancelled request, a
 * read-only control and a pending one all refuse it the same way, so the DOM
 * never shows a state nobody asked for.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default
 * to `undefined` rather than `false`, which is what makes "not disabled" and
 * "said nothing" different answers.
 */
export function Switch({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-readonly': ariaReadOnly,
  'aria-required': ariaRequired,
  checked,
  children,
  className,
  defaultChecked = false,
  description,
  disabled,
  id,
  indicator,
  invalid,
  labelPlacement,
  loading = false,
  messages,
  onChange,
  onCheckedChange,
  onClick,
  readOnly,
  ref,
  render,
  size,
  style,
  ...nativeProps
}: SwitchProps) {
  const field = useField();
  const defaults = useSwitchDefaults();
  const t = useMessages(switchMessages, messages);
  const controlRef = useRef<HTMLInputElement | null>(null);
  const generatedId = useId();
  const pendingId = `${generatedId}-pending`;
  const descriptionId = `${generatedId}-description`;
  /**
   * The field's identifier when there is a field, and its own otherwise. A
   * field writes `for` at its label whether or not the control it holds draws
   * one, so a switch that kept its own identifier inside a field would leave
   * that label pointing at nothing — an orphaned label, which is the worse of
   * the two failures. With both labels present the control is named by both,
   * which is a name said at two scales rather than a name missing.
   */
  const controlId = id ?? field?.ids.control ?? `slotted-switch-${generatedId}`;

  /**
   * What the family knows about the state, which is not the state itself. In
   * controlled mode the consumer's boolean is the truth; in uncontrolled mode
   * the element's is, and this only mirrors it so the track and the mark have
   * something to read.
   */
  const [mirrored, setMirrored] = useState(defaultChecked);
  const [announced, setAnnounced] = useState(false);
  const current = checked ?? mirrored;

  /**
   * The state as of the last render, for the restore below. The click handler
   * closes over the value it was created with, and by the time the restore
   * runs the consumer may already have accepted the move and re-rendered —
   * writing the captured value then would undo their own answer.
   */
  const latest = useRef(current);
  latest.current = current;

  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedIndicator = indicator ?? defaults.indicator;
  const resolvedPlacement = labelPlacement ?? defaults.labelPlacement;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  /**
   * A native reset restores the element's own state and tells nothing, so the
   * mirror would keep the last thing toggled and the track would disagree with
   * the control inside it. The form is reached through the element rather than
   * through a prop, because `form` may name a form anywhere in the document.
   */
  useEffect(() => {
    const form = controlRef.current?.form;
    if (form === null || form === undefined) return;
    const onReset = () => setMirrored(defaultChecked);
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [defaultChecked]);

  /** Silence first, and the pending label only if the write is slow enough to notice. */
  useEffect(() => {
    if (!loading) {
      setAnnounced(false);
      return;
    }
    const timer = setTimeout(() => setAnnounced(true), SWITCH_LOADING_ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    /* The consumer's handler first, and it always runs: the family composes
       with it rather than replacing it. A consumer who called
       preventDefault() has already refused the move. */
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (resolvedDisabled === true || resolvedReadOnly === true || loading) {
      event.preventDefault();
      return;
    }

    const next = !current;
    const state = createControllable<boolean>({
      controlled: checked,
      initial: current,
      onRequest: (request) => onCheckedChange?.(request.value, request),
    });

    /* `request` commits only when the family owns the state and nothing
       cancelled. Anything else — a controlled switch, a refused request —
       leaves the element where it is rather than letting it move and snap
       back on the next render. */
    const reason = activationReason({
      detail: event.detail,
      isTrusted: event.nativeEvent.isTrusted,
    });

    if (state.request(next, reason, event)) {
      setMirrored(next);
      return;
    }

    /**
     * Refused, by a consumer who owns the value or by a cancelled request.
     * Cancelling the click is what the platform offers — a checkbox reverts
     * its own checkedness when its activation is cancelled — and the element
     * is put back beside it, because that revert is the one part of the
     * mechanism an environment can get wrong. jsdom performs it for
     * `element.click()` and not for a dispatched one, and a switch showing a
     * state nobody committed is the whole defect this path exists to prevent.
     *
     * It is a task rather than a line here or a microtask: the revert happens
     * after the dispatch returns, and for a trusted press the browser drains
     * the microtasks queued by the listeners before it reverts. A microtask
     * would write the consumer's answer and the revert would then overwrite
     * it. `latest` rather than `current`, so a consumer who accepted the move
     * keeps their answer. The painted state reads the root, so the one task
     * the element spends reverted is never drawn.
     */
    event.preventDefault();
    setTimeout(() => {
      const element = controlRef.current;
      if (element !== null && element.checked !== latest.current) {
        element.checked = latest.current;
      }
    });
  };

  const parts: ReactNode = (
    <>
      <input
        {...nativeProps}
        aria-busy={loading ? true : undefined}
        aria-describedby={
          [
            describedBy,
            description === undefined ? undefined : descriptionId,
            field?.describedBy,
            loading ? pendingId : undefined,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-invalid={ariaInvalid ?? (resolvedInvalid === true ? true : undefined)}
        aria-readonly={ariaReadOnly ?? (resolvedReadOnly === true ? true : undefined)}
        aria-required={ariaRequired ?? (field?.required === true ? true : undefined)}
        data-part="control"
        data-part-control=""
        disabled={resolvedDisabled}
        id={controlId}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event)}
        onClick={handleClick}
        ref={(element: HTMLInputElement | null) => {
          controlRef.current = element;
          if (typeof ref === 'function') ref(element);
          else if (ref !== null && ref !== undefined) ref.current = element;
        }}
        role="switch"
        type="checkbox"
        {...(checked === undefined ? { defaultChecked } : { checked })}
      />
      <span data-part="track" data-part-track="">
        {/* The check is always in the DOM while there is a mark at all, and the
            stylesheet fades it in with the checked state. */}
        <span data-part="thumb" data-part-thumb="">
          {resolvedIndicator === 'mark' ? (
            <Icon>
              <Glyph name="check" />
            </Icon>
          ) : null}
        </span>
      </span>
      {children === undefined ? null : (
        <label data-part="label" data-part-label="" htmlFor={controlId}>
          {children}
        </label>
      )}
      {description === undefined ? null : (
        <p data-part="description" data-part-description="" id={descriptionId}>
          {description}
        </p>
      )}
      <VisuallyHidden id={pendingId} role="status">
        {loading && announced ? t('loading') : ''}
      </VisuallyHidden>
    </>
  );

  const rootProps: SwitchRootProps = keyedProps({
    children: parts,
    className,
    style,
    ...(current ? { 'data-checked': '' } : {}),
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    'data-indicator': resolvedIndicator,
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(loading ? { 'data-loading': '' } : {}),
    'data-label-placement': resolvedPlacement,
    'data-part': 'root',
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-size': resolvedSize,
    'data-ui': 'switch',
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
