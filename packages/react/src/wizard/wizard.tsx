import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/wizard/wizard.css';
import '@slotted/styles/field/field.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { hasErrors, isDirty, normalizeErrors } from '@slotted/core/form';
import type { FormErrorInput } from '@slotted/core/form';
import { wizardMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  assertUniqueSteps,
  clampStep,
  createSnapshot,
  firstIncomplete,
  formValues,
  includedValues,
  nextDestination,
  previousStep,
  reachableStep,
  replacementStep,
  stepComplete,
  stepPosition,
} from '@slotted/core/wizard';
import type {
  StepValues,
  WizardSnapshot,
  WizardStepEntry,
  WizardValue,
} from '@slotted/core/wizard';
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, ReactElement } from 'react';

import { Alert, AlertContent, AlertDescription, AlertTitle } from '../alert';
import { Form } from '../form';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Skeleton } from '../skeleton';
import { Stepper, StepperList, StepperStep } from '../stepper';
import { Tag } from '../tag';
import { WizardContext, WizardStepContext } from './wizard-context';
import { useWizardDefaults } from './wizard-defaults';
import { WizardActions, WizardComplete, WizardStep } from './wizard-parts';
import type {
  WizardCompleteProps,
  WizardContextValue,
  WizardDraftReason,
  WizardFailure,
  WizardProps,
  WizardRootProps,
  WizardStepContextValue,
  WizardStepProps,
  WizardStepReason,
} from './wizard.types';

type StepElement = ReactElement<WizardStepProps>;

const EMPTY: WizardValue = {};

function without(map: WizardValue, name: string): WizardValue {
  if (!Object.hasOwn(map, name)) return map;
  const next: Record<string, StepValues> = { ...map };
  delete next[name];
  return next;
}

/**
 * Asks a controllable value to move and reports how the request ended: moved
 * here, reported to a consumer who owns the value, or refused.
 */
function ask<T>(
  controlled: T | undefined,
  current: T,
  next: T,
  reason: ChangeReason,
  source: unknown,
  handler: ((value: T, request: ChangeRequest<T>) => void) | undefined,
  equals?: (a: T, b: T) => boolean,
): 'moved' | 'reported' | 'refused' {
  let cancelled = false;
  const state = createControllable<T>({
    controlled,
    initial: current,
    onRequest: (request) => {
      handler?.(request.value, request);
      cancelled = request.cancelled;
    },
    ...(equals === undefined ? {} : { equals }),
  });
  if (state.request(next, reason, source)) return 'moved';
  if (cancelled || (equals ?? Object.is)(next, current)) return 'refused';
  return 'reported';
}

const isPromise = (candidate: unknown): candidate is Promise<unknown> =>
  typeof candidate === 'object' && candidate !== null && 'then' in candidate;

/**
 * A flow of steps that accumulates answers.
 *
 * **The steps are the ones the consumer renders.** A branch is a condition in
 * JSX, `{business && <WizardStep name="company" … />}`, and the family reacts
 * to the list changing under the reader by the eight rules of the design
 * (§5.6): the current step is never moved because a step appeared before it,
 * a current step that left the list gives way to the next one still present,
 * and an absent step keeps its answers without submitting them.
 *
 * **Each step is a `form` of the form family.** `Enter` in a field submits
 * it by the platform's implicit submission, constraint validation and the
 * error summary are `form`'s, and the step's own `validate` runs after them.
 * The next button stands outside the form and submits it through the
 * platform's `form` attribute.
 *
 * **It holds accepted answers, not typed ones.** A step is complete exactly
 * when its name is in `value`; what was typed and not accepted — going back,
 * saving a draft — is kept per step and shown again, and never submitted.
 */
export function Wizard({
  actions,
  autosave,
  children,
  defaultProgressOpen,
  defaultStep,
  defaultValue,
  delay,
  disabled = false,
  error,
  guardUnsaved = false,
  handle,
  level,
  linear,
  messages,
  minDuration,
  onCancel,
  onProgressOpenChange,
  onSaveDraft,
  onStepChange,
  onSubmit,
  onValueChange,
  persistence,
  progress,
  progressOpen,
  render,
  scroll,
  step,
  value,
  version,
  ...nativeProps
}: WizardProps) {
  const defaults = useWizardDefaults();
  const t = useMessages(wizardMessages, messages);
  const resolvedLinear = linear ?? defaults.linear;
  const resolvedProgress = progress ?? defaults.progress;
  const resolvedScroll = scroll ?? defaults.scroll;
  const resolvedLevel = level ?? defaults.level;
  const resolvedAutosave = autosave ?? (persistence === undefined ? 'none' : 'step');
  const resolvedDelay = delay ?? defaults.delay;
  const resolvedMinDuration = minDuration ?? defaults.minDuration;

  const id = useId();
  const formId = `slotted-wizard-${id}-form`;
  const titleId = `slotted-wizard-${id}-title`;
  const listId = `slotted-wizard-${id}-list`;

  const elements = Children.toArray(children).filter(isValidElement);
  const stepElements = elements.filter((element) => element.type === WizardStep) as StepElement[];
  const completeElement = elements.find((element) => element.type === WizardComplete) as
    ReactElement<WizardCompleteProps> | undefined;
  const entries: WizardStepEntry[] = stepElements.map((element) => ({
    disabled: element.props.disabled === true,
    name: element.props.name,
  }));
  assertUniqueSteps(entries);

  /**
   * A synchronous store is read before the first render, so a reload paints
   * the restored step at once. A promise is waited for in an effect.
   */
  const [initial] = useState(() => {
    const loaded = persistence?.load();
    const snapshot = isPromise(loaded) ? undefined : loaded;
    const startValue = snapshot?.value ?? defaultValue ?? EMPTY;
    return {
      drafts: snapshot?.drafts ?? EMPTY,
      pendingLoad: isPromise(loaded) ? (loaded as Promise<WizardSnapshot | undefined>) : undefined,
      snapshot,
      step: clampStep({
        linear: resolvedLinear,
        requested: snapshot?.step ?? defaultStep,
        steps: entries,
        value: value ?? startValue,
      }),
      value: startValue,
    };
  });

  const [ownStep, setOwnStep] = useState<string | undefined>(initial.step);
  const [ownValue, setOwnValue] = useState<WizardValue>(initial.value);
  const [ownOpen, setOwnOpen] = useState(defaultProgressOpen ?? false);
  const [drafts, setDrafts] = useState<WizardValue>(initial.drafts);
  const [stepErrors, setStepErrors] = useState<Record<string, FormErrorInput>>({});
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set());
  const [pending, setPending] = useState<string | undefined>(undefined);
  const [phase, setPhase] = useState<'editing' | 'submitting' | 'complete'>('editing');
  const [failure, setFailure] = useState<WizardFailure | undefined>(undefined);
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [savedAt, setSavedAt] = useState<Date | undefined>(undefined);
  const [restoring, setRestoring] = useState(initial.pendingLoad !== undefined);
  const [skeleton, setSkeleton] = useState(false);
  /** Remounts the step's form, so errors a submission sent back for it show. */
  const [formEpoch, setFormEpoch] = useState(0);

  const currentValue = value ?? ownValue;
  const requested = step ?? ownStep;
  const open = progressOpen ?? ownOpen;

  /* ── Which step is shown ─────────────────────────────────────────────── */

  const previousEntries = useRef<readonly WizardStepEntry[]>(entries);
  const lastStepProp = useRef<string | undefined | null>(null);
  const ownRequest = useRef<string | undefined>(undefined);

  const usable = (name: string | undefined) =>
    entries.some((entry) => entry.name === name && entry.disabled !== true);

  /**
   * Only a *requested* step is clamped — the first render, or a controlled
   * step the consumer changed on its own. The step the reader is on is never
   * moved because a step appeared before it (decision 1); a step that left
   * the list gives way to the next one still present (decision 2 renders
   * that one at once, while the request goes out).
   */
  const external =
    lastStepProp.current === null ||
    (step !== undefined && step !== lastStepProp.current && step !== ownRequest.current);
  let current: string | undefined = external
    ? clampStep({ linear: resolvedLinear, requested, steps: entries, value: currentValue })
    : usable(requested)
      ? requested
      : requested === undefined
        ? clampStep({ linear: resolvedLinear, requested, steps: entries, value: currentValue })
        : (replacementStep({
            after: entries,
            before: previousEntries.current,
            current: requested,
          }) ??
          clampStep({ linear: resolvedLinear, requested, steps: entries, value: currentValue }));

  /**
   * A controlled step the consumer has not followed yet keeps showing the step
   * the family asked for (decision 2), the way `pagination` shows the clamped
   * page while the request is out.
   */
  const override = useRef<{ from: string | undefined; to: string } | undefined>(undefined);
  if (override.current !== undefined && override.current.from !== requested) {
    override.current = undefined;
  }
  if (!external && override.current !== undefined && usable(override.current.to)) {
    current = override.current.to;
  }

  const currentElement = stepElements.find((element) => element.props.name === current);
  const position = stepPosition(entries, current);

  /* The latest of everything, for work that finishes after a render. */
  const latest = useRef({
    current,
    drafts,
    entries,
    elements: stepElements,
    returnTo: undefined as string | undefined,
    value: currentValue,
  });
  latest.current.current = current;
  latest.current.drafts = drafts;
  latest.current.entries = entries;
  latest.current.elements = stepElements;
  latest.current.value = currentValue;

  const formRef = useRef<HTMLFormElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const alertRef = useRef<HTMLElement | null>(null);
  const completeRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const validation = useRef<AbortController | undefined>(undefined);
  const jumpTarget = useRef<string | undefined>(undefined);
  const focusNext = useRef<'title' | 'alert' | 'complete' | undefined>(undefined);
  const [returnTo, setReturnTo] = useState<string | undefined>(undefined);
  latest.current.returnTo = returnTo;

  const requestStep = (next: string, reason: WizardStepReason, source?: unknown) => {
    const from = latest.current.current;
    if (next === from) return false;
    const outcome = ask(step, from ?? next, next, reason, source, onStepChange);
    if (outcome === 'refused') return false;
    if (outcome === 'moved') setOwnStep(next);
    ownRequest.current = next;
    focusNext.current = 'title';
    return true;
  };

  const requestValue = (
    next: WizardValue,
    reason: 'submit' | 'clear' | 'programmatic',
    source?: unknown,
  ) => {
    const outcome = ask(value, latest.current.value, next, reason, source, onValueChange);
    if (outcome === 'refused') return false;
    if (outcome === 'moved') setOwnValue(next);
    latest.current.value = next;
    return true;
  };

  const requestOpen = (next: boolean, reason: ChangeReason, source?: unknown) => {
    if (ask(progressOpen, open, next, reason, source, onProgressOpenChange) === 'moved') {
      setOwnOpen(next);
    }
  };

  /** A resolved step that differs from the requested one is asked for, once. */
  const announced = useRef<string | undefined>(undefined);
  useEffect(() => {
    lastStepProp.current = step;
    previousEntries.current = entries;
    if (current === requested || current === undefined) return;
    const key = `${String(requested)}→${current}`;
    if (announced.current === key) return;
    announced.current = key;
    override.current = { from: requested, to: current };
    /* The step it replaces may have had a validate pending (decision 4). */
    leave();
    if (step === undefined) {
      setOwnStep(current);
      if (requested !== undefined) onStepChange?.(current, requestOf(current, requested));
    } else {
      ownRequest.current = current;
      onStepChange?.(current, requestOf(current, requested ?? current));
    }
  });

  /* ── Focus ───────────────────────────────────────────────────────────── */

  const shown = useRef(current);
  useEffect(() => {
    const target = focusNext.current;
    if (target === 'alert' && alertRef.current !== null) {
      focusNext.current = undefined;
      alertRef.current.focus();
      return;
    }
    if (target === 'complete' && completeRef.current !== null) {
      focusNext.current = undefined;
      completeRef.current.focus();
      return;
    }
    if (shown.current === current) return;
    shown.current = current;
    if (target === 'title' || target === undefined) {
      focusNext.current = undefined;
      titleRef.current?.focus();
    }
  });

  /* ── Drafts ──────────────────────────────────────────────────────────── */

  /** What was typed on this step and not accepted, kept for when it returns. */
  const stash = (): WizardValue => {
    const form = formRef.current;
    const name = latest.current.current;
    if (form === null || name === undefined || !isDirty(form)) return latest.current.drafts;
    const next = { ...latest.current.drafts, [name]: formValues(new FormData(form)) };
    latest.current.drafts = next;
    setDrafts(next);
    return next;
  };

  const write = async (
    snapshotValue: WizardValue,
    snapshotDrafts: WizardValue,
    snapshotStep: string,
    reason: WizardDraftReason,
    source: unknown,
  ) => {
    if (onSaveDraft === undefined && persistence === undefined) return;
    const snapshot = createSnapshot({
      drafts: snapshotDrafts,
      step: snapshotStep,
      value: snapshotValue,
      version,
    });
    setDraftState('saving');
    try {
      await onSaveDraft?.(snapshot, { reason, source });
      await persistence?.save(snapshot);
      setSavedAt(new Date(snapshot.savedAt));
      setDraftState('saved');
    } catch {
      setDraftState('failed');
    }
  };

  /* ── The cycle of a step ─────────────────────────────────────────────── */

  const fail = (reported: WizardFailure, source: unknown) => {
    setPhase('editing');
    setFailure(reported);
    focusNext.current = 'alert';
    const target = reported.step;
    if (target !== undefined && latest.current.entries.some((entry) => entry.name === target)) {
      if (reported.errors !== undefined) {
        setStepErrors((errors) => ({ ...errors, [target]: reported.errors as FormErrorInput }));
        setInvalid((names) => new Set([...names, target]));
        if (target === latest.current.current) setFormEpoch((epoch) => epoch + 1);
      }
      requestStep(target, 'programmatic', source);
      focusNext.current = 'alert';
    }
  };

  const submitFlow = (accepted: WizardValue, source: unknown) => {
    const open = firstIncomplete({ steps: latest.current.entries, value: accepted });
    if (open !== undefined) {
      requestStep(open, 'submit', source);
      setFailure({ message: t('incomplete') });
      focusNext.current = 'alert';
      return;
    }
    setFailure(undefined);
    setPhase('submitting');
    const settle = (answer: unknown) => {
      if (typeof answer === 'object' && answer !== null) {
        fail(answer as WizardFailure, source);
        return;
      }
      setPhase('complete');
      setDrafts(EMPTY);
      void persistence?.clear();
      focusNext.current = 'complete';
    };
    let answer: unknown;
    try {
      answer = onSubmit?.(includedValues(accepted, latest.current.entries), {
        reason: 'submit',
        source,
        value: accepted,
      });
    } catch {
      fail({}, source);
      return;
    }
    if (isPromise(answer)) {
      answer.then(settle, () => fail({}, source));
      return;
    }
    settle(answer);
  };

  const route = (accepted: WizardValue, name: string, source: unknown) => {
    const steps = latest.current.entries;
    const jump = jumpTarget.current;
    jumpTarget.current = undefined;
    if (
      jump !== undefined &&
      reachableStep({ current: name, linear: resolvedLinear, steps, target: jump, value: accepted })
    ) {
      requestStep(jump, 'pointer', source);
      return;
    }

    const back = latest.current.returnTo;
    const destination = nextDestination({ current: name, returnTo: back, steps, value: accepted });
    if (back !== undefined && (destination.kind === 'submit' || destination.name === back)) {
      setReturnTo(undefined);
    }
    if (back !== undefined && !steps.some((entry) => entry.name === back)) setReturnTo(undefined);

    if (destination.kind === 'step') requestStep(destination.name, 'submit', source);
    else submitFlow(accepted, source);
  };

  const accept = (name: string, answers: StepValues, source: unknown) => {
    const accepted = { ...latest.current.value, [name]: answers };
    if (!requestValue(accepted, 'submit', source)) return;
    const nextDrafts = without(latest.current.drafts, name);
    latest.current.drafts = nextDrafts;
    setDrafts(nextDrafts);
    setStepErrors((errors) => {
      if (!(name in errors)) return errors;
      const next = { ...errors };
      delete next[name];
      return next;
    });
    setInvalid((names) => {
      if (!names.has(name)) return names;
      const next = new Set(names);
      next.delete(name);
      return next;
    });
    /**
     * Where the flow goes is decided after the consumer has rendered the list
     * the new answer produces, not now. A step the answer opens — Company
     * after Business — exists only once the consumer renders again with the
     * new value; decided here, the destination skipped it and went to the
     * step after.
     */
    pendingRoute.current = { accepted, drafts: nextDrafts, name, source };
    setRouteTick((tick) => tick + 1);
  };

  const pendingRoute = useRef<
    { accepted: WizardValue; drafts: WizardValue; name: string; source: unknown } | undefined
  >(undefined);
  const [routeTick, setRouteTick] = useState(0);
  /**
   * The step a restored draft was saved on, resolved after the consumer has
   * seen the restored value, for the reason a route waits: the step may be
   * one that value opens.
   */
  const pendingRestore = useRef<string | undefined>(undefined);

  useEffect(() => {
    const restoreTo = pendingRestore.current;
    if (restoreTo !== undefined) {
      pendingRestore.current = undefined;
      const target = clampStep({
        linear: resolvedLinear,
        requested: restoreTo,
        steps: latest.current.entries,
        value: latest.current.value,
      });
      if (target !== undefined && target !== latest.current.current) {
        requestStep(target, 'programmatic');
        focusNext.current = undefined;
        shown.current = target;
      }
    }
    const job = pendingRoute.current;
    if (job === undefined) return;
    pendingRoute.current = undefined;
    if (resolvedAutosave === 'step') {
      const destination = nextDestination({
        current: job.name,
        returnTo: latest.current.returnTo,
        steps: latest.current.entries,
        value: job.accepted,
      });
      void write(
        job.accepted,
        job.drafts,
        destination.kind === 'step' ? destination.name : job.name,
        'submit',
        job.source,
      );
    }
    route(job.accepted, job.name, job.source);
    /* The tick is the whole trigger: one accepted step, one route. */
  }, [routeTick]);

  /**
   * The step's form passed the platform's own validation. The step's
   * `validate` runs next; a promise holds the next button in its loading
   * state and is aborted when the reader leaves (decision 4).
   */
  const commit = (typed: StepValues, source: unknown) => {
    const name = latest.current.current;
    if (name === undefined || pending !== undefined || phase !== 'editing') return undefined;
    const element = latest.current.elements.find((candidate) => candidate.props.name === name);
    const answers = element?.props.values ?? typed;
    const check = element?.props.validate;
    if (check === undefined) {
      accept(name, answers, source);
      return undefined;
    }

    validation.current?.abort();
    const controller = new AbortController();
    validation.current = controller;
    const found = (errors: FormErrorInput | void) => {
      if (controller.signal.aborted) return undefined;
      if (validation.current === controller) validation.current = undefined;
      setPending(undefined);
      if (errors !== undefined && hasErrors(normalizeErrors(errors))) {
        setInvalid((names) => new Set([...names, name]));
        jumpTarget.current = undefined;
        return errors;
      }
      if (latest.current.current !== name) return undefined;
      accept(name, answers, source);
      return undefined;
    };

    const result = check(answers, { signal: controller.signal, value: latest.current.value });
    if (!isPromise(result)) return found(result);
    setPending(name);
    return result.then(found, () => {
      if (!controller.signal.aborted) setPending(undefined);
      return undefined;
    });
  };

  const leave = () => {
    validation.current?.abort();
    validation.current = undefined;
    setPending(undefined);
  };

  const previous = (source?: unknown) => {
    const name = latest.current.current;
    if (name === undefined || pending !== undefined || phase !== 'editing' || disabled) return;
    const target = previousStep({ current: name, steps: latest.current.entries });
    if (target === undefined) return;
    stash();
    leave();
    requestStep(target, 'pointer', source);
  };

  const goTo = (name: string, reason: WizardStepReason = 'pointer', source?: unknown) => {
    const from = latest.current.current;
    const steps = latest.current.entries;
    if (from === undefined || name === from || phase !== 'editing' || disabled) return;
    const target = steps.findIndex((entry) => entry.name === name);
    const here = steps.findIndex((entry) => entry.name === from);
    if (target === -1) return;
    if (target < here) {
      stash();
      leave();
      requestStep(name, reason, source);
      return;
    }
    if (pending !== undefined) return;
    if (
      !reachableStep({
        current: from,
        linear: resolvedLinear,
        steps,
        target: name,
        value: { ...latest.current.value, [from]: {} },
      })
    ) {
      return;
    }
    jumpTarget.current = name;
    formRef.current?.requestSubmit();
    if (validation.current === undefined && jumpTarget.current === name) {
      jumpTarget.current = undefined;
    }
  };

  const edit = (name: string, source?: unknown) => {
    const from = latest.current.current;
    if (from === undefined || phase !== 'editing' || disabled) return;
    setReturnTo(from);
    latest.current.returnTo = from;
    stash();
    leave();
    requestStep(name, 'pointer', source);
  };

  const skip = (source?: unknown) => {
    const name = latest.current.current;
    const element = latest.current.elements.find((candidate) => candidate.props.name === name);
    if (name === undefined || element?.props.optional !== true || pending !== undefined) return;
    if (phase !== 'editing' || disabled) return;
    leave();
    accept(name, {}, source);
  };

  const dirty = () => {
    const form = formRef.current;
    return (
      phase !== 'complete' &&
      ((form !== null && isDirty(form)) ||
        Object.keys(latest.current.drafts).length > 0 ||
        Object.keys(latest.current.value).length > 0)
    );
  };

  const cancel = (source?: unknown) => {
    if (phase === 'submitting') return;
    onCancel?.({ dirty: dirty(), source });
  };

  const saveDraft = (reason: WizardDraftReason = 'programmatic', source?: unknown) => {
    const name = latest.current.current;
    if (name === undefined || phase !== 'editing') return;
    const nextDrafts = stash();
    void write(latest.current.value, nextDrafts, name, reason, source);
  };

  const reset = () => {
    leave();
    jumpTarget.current = undefined;
    setReturnTo(undefined);
    setFailure(undefined);
    setPhase('editing');
    setDrafts(EMPTY);
    latest.current.drafts = EMPTY;
    setStepErrors({});
    setInvalid(new Set());
    setDraftState('idle');
    setSavedAt(undefined);
    requestValue(EMPTY, 'clear');
    const first = clampStep({
      linear: resolvedLinear,
      requested: undefined,
      steps: entries,
      value: EMPTY,
    });
    if (first !== undefined) requestStep(first, 'programmatic');
    void persistence?.clear();
  };

  useImperativeHandle(handle, () => ({
    clearDraft: () => {
      setDraftState('idle');
      setSavedAt(undefined);
      void persistence?.clear();
    },
    edit: (name) => edit(name),
    focus: () => titleRef.current?.focus(),
    goTo: (name) => goTo(name, 'programmatic'),
    next: () => formRef.current?.requestSubmit(),
    previous: () => previous(),
    reset,
    saveDraft: () => saveDraft('programmatic'),
    skip: () => skip(),
    submit: () => formRef.current?.requestSubmit(),
  }));

  /* ── An asynchronous restore ─────────────────────────────────────────── */

  useEffect(() => {
    const load = initial.pendingLoad;
    if (load === undefined) {
      const snapshot = initial.snapshot;
      if (snapshot === undefined) return;
      /* The consumer hears the restored value in either mode: a branch it
         derives from the value has to open before the step is resolved. An
         uncontrolled wizard already started from it, so it is announced
         rather than requested. */
      if (value !== undefined) requestValue(snapshot.value, 'programmatic');
      else onValueChange?.(snapshot.value, requestOf<WizardValue>(snapshot.value, EMPTY));
      pendingRestore.current = snapshot.step;
      setRouteTick((tick) => tick + 1);
      return;
    }
    let live = true;
    let shownAt: number | undefined;
    const timer = window.setTimeout(() => {
      shownAt = Date.now();
      setSkeleton(true);
    }, resolvedDelay);
    const finish = (snapshot: WizardSnapshot | undefined) => {
      if (!live) return;
      window.clearTimeout(timer);
      const apply = () => {
        if (!live) return;
        setSkeleton(false);
        setRestoring(false);
        if (snapshot === undefined) return;
        requestValue(snapshot.value, 'programmatic');
        latest.current.drafts = snapshot.drafts;
        setDrafts(snapshot.drafts);
        pendingRestore.current = snapshot.step;
        setRouteTick((tick) => tick + 1);
      };
      const remaining = shownAt === undefined ? 0 : resolvedMinDuration - (Date.now() - shownAt);
      if (remaining > 0) window.setTimeout(apply, remaining);
      else apply();
    };
    load.then(finish, () => finish(undefined));
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
    /* Read once, on mount: a restore is the start of the flow. */
  }, []);

  /* ── Leaving the page ────────────────────────────────────────────────── */

  useEffect(() => {
    if (!guardUnsaved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty()) event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  });

  useEffect(() => () => validation.current?.abort(), []);

  /* ── What the parts are told ─────────────────────────────────────────── */

  const optional = currentElement?.props.optional === true;
  const returning = returnTo !== undefined && entries.some((entry) => entry.name === returnTo);
  const isFinal =
    current !== undefined &&
    nextDestination({
      current,
      returnTo,
      steps: entries,
      value: { ...currentValue, [current]: {} },
    }).kind === 'submit';

  const context: WizardContextValue = {
    busy: pending !== undefined || phase === 'submitting',
    canCancel: onCancel !== undefined,
    canSaveDraft: onSaveDraft !== undefined || persistence !== undefined,
    cancel,
    disabled,
    draftState,
    edit,
    formId,
    goTo,
    isFinal,
    isFirst: current === undefined || previousStep({ current, steps: entries }) === undefined,
    next: () => formRef.current?.requestSubmit(),
    optional,
    phase,
    position,
    previous,
    reset,
    returning,
    saveDraft,
    savedAt,
    skip,
    step: current,
    t,
    steps: stepElements.map((element) => ({
      disabled: element.props.disabled === true,
      label: element.props.label,
      name: element.props.name,
      optional: element.props.optional === true,
    })),
    value: currentValue,
  };

  const stepContext: WizardStepContextValue | undefined =
    current === undefined
      ? undefined
      : {
          complete: stepComplete(currentValue, current),
          name: current,
          optional,
          values: drafts[current] ?? currentValue[current] ?? {},
        };

  /* ── The DOM ─────────────────────────────────────────────────────────── */

  const Heading = `h${resolvedLevel}` as 'h2';
  /**
   * After an accepted submission the flow has no current step: the stepper is
   * given the index past the last, so every header reads complete. Left on the
   * last step, that header kept its number, because a current step outranks a
   * complete one.
   */
  const finished = phase === 'complete';
  const currentIndex = entries.findIndex((entry) => entry.name === current);
  const shownError = error ?? failure;
  const errorTitle = error ?? t('submitFailed');
  const errorDescription = error === undefined ? (failure?.message ?? undefined) : undefined;

  const progressPart =
    resolvedProgress === 'none' ? null : (
      <div
        data-open={open ? '' : undefined}
        data-part="progress"
        data-part-progress=""
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== 'Escape' || !open) return;
          event.preventDefault();
          requestOpen(false, 'escape', event);
          toggleRef.current?.focus();
        }}
      >
        <button
          aria-controls={listId}
          aria-expanded={open}
          data-part="progress-toggle"
          data-part-progress-toggle=""
          onClick={(event) =>
            requestOpen(!open, event.detail === 0 ? 'keyboard' : 'pointer', event)
          }
          ref={toggleRef}
          type="button"
        >
          <span data-part="progress-position" data-part-progress-position="">
            {t('position', { index: position.index, count: position.count })}
          </span>
          <span aria-hidden="true" data-part="progress-track" data-part-progress-track="">
            {entries.map((entry) => (
              <span
                data-complete={
                  finished || (entry.name !== current && stepComplete(currentValue, entry.name))
                    ? ''
                    : undefined
                }
                data-current={!finished && entry.name === current ? '' : undefined}
                data-invalid={invalid.has(entry.name) ? '' : undefined}
                data-part="progress-segment"
                data-part-progress-segment=""
                key={entry.name}
              />
            ))}
          </span>
          <Icon>
            <Glyph name="chevron-down" />
          </Icon>
        </button>
        <Stepper
          linear={false}
          navigation={phase === 'complete' ? 'none' : 'button'}
          onStepChange={(index, request) => {
            const target = entries[index]?.name;
            if (target === undefined) return;
            if (open) requestOpen(false, 'select', request.source);
            goTo(target, request.reason === 'keyboard' ? 'keyboard' : 'pointer', request.source);
          }}
          orientation={resolvedProgress === 'top' ? 'horizontal' : 'vertical'}
          step={finished ? entries.length : Math.max(0, currentIndex)}
        >
          <StepperList aria-label={t('progress')} id={listId}>
            {stepElements.map((element) => {
              const name = element.props.name;
              const reachable =
                phase === 'complete' ||
                reachableStep({
                  current,
                  linear: resolvedLinear,
                  steps: entries,
                  target: name,
                  value: currentValue,
                });
              return (
                <StepperStep
                  aria-controls={formId}
                  complete={phase === 'complete' || stepComplete(currentValue, name)}
                  description={element.props.optional === true ? t('optional') : undefined}
                  disabled={disabled || element.props.disabled === true || !reachable}
                  invalid={invalid.has(name)}
                  key={name}
                  label={element.props.label}
                  loading={pending === name}
                />
              );
            })}
          </StepperList>
        </Stepper>
      </div>
    );

  const skeletonPart = (
    <>
      <div aria-hidden="true" data-part="step-header" data-part-step-header="">
        <div data-part="step-title" data-part-step-title="">
          <span data-part="position" data-part-position="">
            <Skeleton inlineSize="5.5rem" />
          </span>
          <Skeleton inlineSize="13rem" />
        </div>
      </div>
      <div aria-hidden="true" data-part="skeleton" data-part-skeleton="">
        <div
          data-label-placement="top"
          data-part="root"
          data-part-root=""
          data-size="md"
          data-ui="field"
          data-ui-field=""
        >
          <span data-part="label" data-part-label="">
            <Skeleton inlineSize="7rem" />
          </span>
          <div data-part="control" data-part-control="">
            <Skeleton blockSize="var(--slotted-control-height-md)" shape="block" />
          </div>
        </div>
      </div>
    </>
  );

  const stepPart =
    currentElement === undefined ? null : (
      <>
        <div data-part="step-header" data-part-step-header="">
          <Heading
            data-part="step-title"
            data-part-step-title=""
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
          >
            <span data-part="position" data-part-position="">
              {t('position', { index: position.index, count: position.count })}
            </span>{' '}
            {currentElement.props.label}
            {optional ? (
              <span data-part="optional" data-part-optional="">
                {' '}
                <Tag shape="pill" size="sm" tone="secondary" variant="soft">
                  {t('optional')}
                </Tag>
              </span>
            ) : null}
          </Heading>
          {currentElement.props.description === undefined ? null : (
            <p data-part="step-description" data-part-step-description="">
              {currentElement.props.description}
            </p>
          )}
        </div>
        <Form
          aria-labelledby={titleId}
          defaultErrors={stepErrors[current as string]}
          disabled={disabled}
          id={formId}
          key={`${current}-${formEpoch}`}
          onErrorsChange={(errors) => {
            const name = latest.current.current;
            if (name === undefined) return;
            setInvalid((names) => {
              const has = hasErrors(errors);
              if (has === names.has(name)) return names;
              const next = new Set(names);
              if (has) next.add(name);
              else next.delete(name);
              return next;
            });
          }}
          onSubmit={(typed, request) => commit(typed, request.event)}
          ref={formRef}
        >
          <WizardStepContext.Provider value={stepContext}>
            {currentElement}
          </WizardStepContext.Provider>
        </Form>
      </>
    );

  const completeProps = completeElement?.props ?? {};
  const main = (
    <div data-part="main" data-part-main="">
      {shownError === undefined ? null : (
        <div data-part="error" data-part-error="">
          <Alert live="off" ref={alertRef} reach="section" tone="danger">
            <AlertContent>
              <AlertTitle>{errorTitle}</AlertTitle>
              {errorDescription === undefined ? null : (
                <AlertDescription>{errorDescription}</AlertDescription>
              )}
            </AlertContent>
          </Alert>
        </div>
      )}
      {phase === 'complete' ? (
        <div
          {...withSelectorKey(completeProps, 'part', 'complete')}

          ref={(element: HTMLDivElement | null) => {
            completeRef.current = element;
            const own = completeProps.ref;
            if (typeof own === 'function') own(element);
            else if (own !== null && own !== undefined) own.current = element;
          }}
          tabIndex={completeProps.tabIndex ?? -1}
        >
          {completeProps.children}
        </div>
      ) : (
        <>
          <div aria-busy={restoring ? true : undefined} data-part="step" data-part-step="">
            {restoring ? (skeleton ? skeletonPart : null) : stepPart}
          </div>
          {restoring ? null : (actions ?? <WizardActions />)}
        </>
      )}
    </div>
  );

  const rootProps: WizardRootProps = keyedProps({
    ...nativeProps,
    children: (
      <WizardContext.Provider value={context}>
        <div data-part="layout" data-part-layout="">
          {progressPart}
          {main}
        </div>
      </WizardContext.Provider>
    ),
    'data-complete': phase === 'complete' ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'data-invalid': shownError === undefined ? undefined : '',
    'data-loading': phase === 'submitting' || restoring ? '' : undefined,
    'data-part': 'root',
    'data-progress': resolvedProgress,
    'data-scroll': resolvedScroll,
    'data-ui': 'wizard',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

function requestOf<T>(value: T, previous: T): ChangeRequest<T> {
  let cancelled = false;
  return {
    cancel() {
      cancelled = true;
    },
    get cancelled() {
      return cancelled;
    },
    previous,
    reason: 'programmatic',
    source: undefined,
    value,
  };
}
