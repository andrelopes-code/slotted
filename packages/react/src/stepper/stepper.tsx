import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/stepper/stepper.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { stepperMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { stepPercent, stepReachable, stepStatus } from '@slotted/core/steps';
import { createContext, useContext, useId, useState } from 'react';

import { useLocale, useMessages } from '../i18n';
import { useStepperDefaults } from './stepper-defaults';
import type {
  StepperContextValue,
  StepperProps,
  StepperRootProps,
  StepperStepContextValue,
  StepperStepReason,
} from './stepper.types';

const StepperContext = createContext<StepperContextValue | undefined>(undefined);
const StepperStepContext = createContext<StepperStepContextValue | undefined>(undefined);

/**
 * What the stepper around this part says, and the imperative surface a consumer
 * cannot express as a prop.
 *
 * It is also how a flow advances: moving one step is a handler on the
 * consumer's own button, not a button this family paints. Angular Material
 * reaches the same conclusion with `matStepperNext`, a directive placed on a
 * `mat-button` — a family that shipped its own advance button would ship a
 * second button nobody could theme with the first.
 */
export function useStepper(): StepperContextValue {
  const context = useContext(StepperContext);
  if (context === undefined) {
    throw new Error('Stepper parts must be rendered inside a Stepper.');
  }
  return context;
}

export function useStepperStep(): StepperStepContextValue | undefined {
  return useContext(StepperStepContext);
}

export const StepperStepProvider = StepperStepContext.Provider;

/** The registry each `Stepper.Step` writes itself into, so the root can count. */
export interface StepperRegistration {
  complete: boolean | undefined;
  disabled: boolean | undefined;
}

/**
 * Where the reader is in a sequence of steps, which steps they may reach, and
 * the panel belonging to the step they are on.
 *
 * **It refuses the tab role.** Angular Material gives a horizontal stepper
 * `role="tablist"`; section 7 of the feature guide forbids it in the Tabs entry
 * itself — tabs are for peer views in one context, not for the steps of a
 * process. What replaces it is `ol` and `li` for the sequence,
 * `aria-current="step"` for where the reader is, and a visually hidden status
 * inside each header so a reader hears "Step 2 of 5, completed" rather than
 * "2".
 *
 * **It validates nothing.** A consumer refuses a move by cancelling the change
 * request, which every mutable value in this library already carries. Zag ships
 * `isStepValid` and `onStepInvalid` for that job; this family needs neither,
 * because `request.cancel()` says the same thing at the same moment.
 *
 * **It never claims completion.** `complete` is the consumer's fact about a
 * step; `autoComplete` is the shorthand for the flow where reaching step three
 * does mean the first two are done, and it is off.
 */
export function Stepper({
  autoComplete,
  children,
  defaultStep,
  labelPlacement,
  linear,
  messages,
  navigation,
  onStepChange,
  orientation,
  render,
  step,
  ...nativeProps
}: StepperProps) {
  const defaults = useStepperDefaults();
  const t = useMessages(stepperMessages, messages);
  const locale = useLocale();
  const generatedId = useId();

  const [own, setOwn] = useState(defaultStep ?? 0);
  const [steps, setSteps] = useState<readonly StepperRegistration[]>([]);
  const current = step ?? own;
  const count = steps.length;

  const resolvedLinear = linear ?? defaults.linear ?? false;

  const statusOf = (index: number) =>
    stepStatus({
      autoComplete: autoComplete ?? false,
      complete: steps[index]?.complete,
      index,
      step: current,
    });

  const reachable = (index: number) =>
    stepReachable({
      autoComplete: autoComplete ?? false,
      complete: steps[index]?.complete,
      count,
      disabled: steps[index]?.disabled,
      index,
      isComplete: (candidate) => statusOf(candidate) === 'complete',
      linear: resolvedLinear,
      step: current,
    });

  const goToStep = (next: number, reason: StepperStepReason = 'pointer', source?: unknown) => {
    if (next < 0 || (count > 0 && next >= count)) return;
    const state = createControllable<number>({
      controlled: step,
      initial: current,
      onRequest: (request) => onStepChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setOwn(next);
  };

  const context: StepperContextValue = {
    canGoNext: count > 0 && current < count - 1 && reachable(current + 1),
    canGoPrevious: current > 0,
    count,
    goToStep,
    ids: {
      panel: (index) => `slotted-stepper-${generatedId}-panel-${index}`,
      trigger: (index) => `slotted-stepper-${generatedId}-trigger-${index}`,
    },
    labelPlacement: labelPlacement ?? defaults.labelPlacement ?? 'end',
    linear: resolvedLinear,
    locale,
    navigation: navigation ?? defaults.navigation ?? 'button',
    next: (reason, source) => goToStep(current + 1, reason, source),
    orientation: orientation ?? defaults.orientation ?? 'horizontal',
    percent: stepPercent({ count, step: current }),
    previous: (reason, source) => goToStep(current - 1, reason, source),
    reachable,
    reset: (source) => goToStep(defaultStep ?? 0, 'programmatic', source),
    statusOf,
    step: current,
    t,
  };

  const rootProps: StepperRootProps = keyedProps({
    ...nativeProps,
    children: <StepperRegistry.Provider value={setSteps}>{children}</StepperRegistry.Provider>,
    'data-label-placement': context.labelPlacement,
    'data-navigation': context.navigation,
    'data-orientation': context.orientation,
    'data-part': 'root',
    'data-ui': 'stepper',
  });

  return (
    <StepperContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </StepperContext.Provider>
  );
}

/**
 * What the list hands back to the root. The registry is a setter rather than a
 * context value, because the list is what actually sees the steps and the root
 * is what has to count them.
 */
export const StepperRegistry = createContext<
  ((steps: readonly StepperRegistration[]) => void) | undefined
>(undefined);
