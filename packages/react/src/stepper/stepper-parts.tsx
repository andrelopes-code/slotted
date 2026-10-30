import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import { stepFocusIndex } from '@slotted/core/steps';
import { Children, isValidElement, useContext, useEffect, useRef, type ReactNode } from 'react';

import { Glyph, Icon } from '../icon';
import {
  StepperRegistry,
  StepperStepProvider,
  useStepper,
  useStepperStep,
  type StepperRegistration,
} from './stepper';
import type {
  StepperListProps,
  StepperListRootProps,
  StepperPanelProps,
  StepperPanelRootProps,
  StepperStepProps,
  StepperStepRootProps,
} from './stepper.types';

/** What a step declares about itself, read from the element the consumer wrote. */
function registrationOf(child: unknown): StepperRegistration {
  const props =
    typeof child === 'object' && child !== null
      ? (Reflect.get(child, 'props') as unknown)
      : undefined;
  const read = (name: string) =>
    typeof props === 'object' && props !== null
      ? (Reflect.get(props, name) as boolean | undefined)
      : undefined;
  return { complete: read('complete'), disabled: read('disabled') };
}

/**
 * The ordered list, and the one part that knows how many steps there are.
 *
 * It maps its children for two facts a step cannot know about itself: its own
 * index, and whether it is the last — the last draws no connector, because
 * there is nothing after it.
 *
 * The keyboard is handled here rather than on each header, because the
 * destination of an arrow is another header and only the list knows them all.
 * Every header stays in the tab sequence: the arrows are added on top of it
 * rather than replacing it with a roving tab stop, which is the model a
 * `tablist` has and the model this family declined.
 */
export function StepperList({
  children,
  ref,
  render,
  onKeyDown,
  ...nativeProps
}: StepperListProps) {
  const stepper = useStepper();
  const register = useContext(StepperRegistry);
  const items = Children.toArray(children).filter((child) => isValidElement(child));

  const registrations = items.map(registrationOf);
  const key = JSON.stringify(registrations);
  const lastKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    register?.(registrations);
    /* The serialized registrations are the dependency; the array itself is new
       every render. */
  }, [key, register]);

  const rootProps: StepperListRootProps = keyedProps({
    'aria-label': stepper.t('label'),
    ...nativeProps,
    children: items.map((child, index) => (
      <StepperStepProvider
        key={child.key ?? index}
        value={{ index, last: index === items.length - 1, travelled: index < stepper.step }}
      >
        {child}
      </StepperStepProvider>
    )),
    'data-part': 'list',
    onKeyDown: (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      const trigger = (event.target as HTMLElement | null)?.closest?.('[data-part="trigger"]');
      const from = Number(trigger?.getAttribute('data-index') ?? -1);
      if (!Number.isInteger(from) || from < 0) return;

      const direction =
        event.currentTarget.ownerDocument.defaultView?.getComputedStyle(event.currentTarget)
          .direction === 'rtl'
          ? 'rtl'
          : 'ltr';
      /**
       * Every header, reachable or not. The arrows move focus exactly where
       * Tab moves it, because that is the whole reason they were added on top
       * of the tab sequence rather than replacing it: a step a linear flow has
       * not opened is still one a reader is allowed to find.
       */
      const next = stepFocusIndex({
        count: stepper.count,
        direction,
        from,
        key: event.key,
        orientation: stepper.orientation,
      });
      if (next === -1) return;

      event.preventDefault();
      event.currentTarget.ownerDocument.getElementById(stepper.ids.trigger(next))?.focus();
    },
  });

  return render === undefined ? <ol {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * One step: its marker, its name, the second line under it, and the connector
 * that runs to the next one.
 *
 * The header is a `button`, an `a` or a `span`, depending on what the flow lets
 * the reader do — and `none` is the read-only progress indicator the field
 * ships as a component of its own.
 *
 * A step a linear flow has not reached carries `aria-disabled` rather than
 * `disabled`, so it stays in the tab sequence: a reader can find out the step
 * exists and that it is not yet available.
 */
export function StepperStep({
  children,
  complete,
  description,
  disabled,
  href,
  invalid,
  label,
  loading,
  marker,
  ref,
  render,
  ...nativeProps
}: StepperStepProps) {
  /**
   * `complete` is the consumer's fact about this step, and `StepperList` reads
   * it from the element itself rather than from here. It is destructured only
   * to keep it off the DOM: without that, it lands on the rendered element as
   * an attribute the platform does not know.
   */
  void complete;

  const stepper = useStepper();
  const step = useStepperStep();
  const index = step?.index ?? 0;

  const status = stepper.statusOf(index);
  const current = index === stepper.step;
  const unreachable = disabled === true || !stepper.reachable(index);
  /**
   * The glyph drawn over the number: a cross for a step in error, a check for
   * a finished one the reader has left. The current step keeps its number
   * even when it is also complete, because the number is what says where the
   * reader is.
   */
  const mark = invalid === true ? 'x' : status === 'complete' && !current ? 'check' : undefined;

  /* A list of descriptors, written the way the locale in force lists them. */
  const announced = new Intl.ListFormat(stepper.locale, { type: 'unit' }).format(
    [
      stepper.t('position', { index: index + 1, count: stepper.count }),
      invalid === true
        ? stepper.t('invalid')
        : current
          ? stepper.t('current')
          : status === 'complete'
            ? stepper.t('complete')
            : undefined,
      loading === true ? stepper.t('loading') : undefined,
      unreachable && !current ? stepper.t('unavailable') : undefined,
    ].filter((part): part is string => part !== undefined),
  );

  const triggerProps = {
    'aria-controls': nativeProps['aria-controls'],
    'aria-current': current ? ('step' as const) : undefined,
    'data-index': index,
    'data-part': 'trigger',
    ...selectorKeyProps('part', 'trigger'),
    id: stepper.ids.trigger(index),
    children: (
      <>
        <span aria-hidden="true" data-part="marker" data-part-marker="">
          {marker ?? index + 1}
          {mark === undefined ? null : (
            <Icon>
              <Glyph name={mark} />
            </Icon>
          )}
        </span>
        <span data-part="label" data-part-label="">
          {label}
          {description === undefined ? null : (
            <span data-part="description" data-part-description="">
              {description}
            </span>
          )}
        </span>
        {/* The visible name and this run concatenate into one accessible
            name, and nothing separates two elements' text: without the comma a
            reader hears "CartStep 1 of 4". */}
        <span
          data-part="status"
          data-part-status=""
          data-ui="visually-hidden"
          data-ui-visually-hidden=""
        >
          {`, ${announced}`}
        </span>
      </>
    ),
  };

  const move = (event: { defaultPrevented: boolean }) => {
    if (event.defaultPrevented || unreachable || loading === true) return;
    stepper.goToStep(index, 'pointer', event);
  };

  const trigger =
    stepper.navigation === 'none' ? (
      <span {...triggerProps} />
    ) : stepper.navigation === 'link' ? (
      <a
        {...triggerProps}
        aria-disabled={unreachable ? true : undefined}
        {...(unreachable || href === undefined ? {} : { href })}
        onClick={move}
      />
    ) : (
      <button
        {...triggerProps}
        aria-disabled={unreachable ? true : undefined}
        onClick={move}
        type="button"
      />
    );

  const rootProps: StepperStepRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {trigger}
        {children}
        {step?.last === true ? null : (
          <span
            aria-hidden="true"
            data-complete={step?.travelled === true ? '' : undefined}
            data-part="separator"
            data-part-separator=""
          />
        )}
      </>
    ),
    'data-complete': status === 'complete' ? '' : undefined,
    'data-current': current ? '' : undefined,
    'data-disabled': unreachable ? '' : undefined,
    'data-invalid': invalid === true ? '' : undefined,
    'data-loading': loading === true ? '' : undefined,
    'data-part': 'item',
  });

  return render === undefined ? <li {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * The content of the step it is written inside. It is a `group` labelled by its
 * own header rather than a `tabpanel`, for the reason the root refuses the tab
 * role, and it is focusable so a consumer moving focus after a step change has
 * somewhere to put it.
 */
export function StepperPanel({ children, ref, render, ...nativeProps }: StepperPanelProps) {
  const stepper = useStepper();
  const step = useStepperStep();
  const index = step?.index ?? 0;

  if (index !== stepper.step) return null;

  const rootProps: StepperPanelRootProps = keyedProps({
    'aria-labelledby': stepper.ids.trigger(index),
    ...nativeProps,
    children,
    'data-part': 'panel',
    id: nativeProps.id ?? stepper.ids.panel(index),
    role: 'group',
    tabIndex: nativeProps.tabIndex ?? -1,
  });

  return render === undefined ? <div {...rootProps} ref={ref} /> : render(rootProps);
}

/** Composes a consumer's handler with the move, never replacing it. */
function advance(run: () => void, own: ((event: never) => void) | undefined) {
  return (event: never) => {
    (own as ((value: unknown) => void) | undefined)?.(event);
    if ((event as { defaultPrevented?: boolean }).defaultPrevented === true) return;
    run();
  };
}

export type StepperAdvanceProps = {
  children?: ReactNode;
  disabled?: boolean;
  onClick?: ((event: never) => void) | undefined;
  render: (props: { disabled: boolean; onClick: (event: never) => void }) => ReactNode;
};

/**
 * The one shape in which this family will hand a consumer an advance handler
 * without also handing them a button. `render` receives the handler and whether
 * the move is available; the element, its variant and its label stay the
 * consumer's, and `useStepper()` is the shorter way to the same thing.
 */
export function StepperNext({ disabled, onClick, render }: StepperAdvanceProps) {
  const stepper = useStepper();
  return render({
    disabled: disabled ?? !stepper.canGoNext,
    onClick: advance(() => stepper.next('pointer'), onClick),
  });
}

export function StepperPrevious({ disabled, onClick, render }: StepperAdvanceProps) {
  const stepper = useStepper();
  return render({
    disabled: disabled ?? !stepper.canGoPrevious,
    onClick: advance(() => stepper.previous('pointer'), onClick),
  });
}
