import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/form/form.css';

import {
  collectValidity,
  hasErrors,
  isDirty,
  mergeErrors,
  namedControls,
  normalizeErrors,
  orderErrors,
  withoutError,
} from '@slotted/core/form';
import type { FormErrorEntry, FormErrors } from '@slotted/core/form';
import { formMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FormEvent, ReactNode } from 'react';

import { useMessages } from '../i18n';
import { FormContext, useFormDefaults } from './form-context';
import { FormSummary } from './form-parts';
import type { FormErrorInput, FormProps, FormRootProps } from './form.types';

const sameErrors = (a: FormErrors, b: FormErrors) => {
  const names = Object.keys(a);
  if (names.length !== Object.keys(b).length) return false;
  return names.every(
    (name) =>
      b[name] !== undefined &&
      a[name]!.length === b[name]!.length &&
      a[name]!.every((message, index) => message === b[name]![index]),
  );
};

/**
 * A form, its errors and its row of actions.
 *
 * **It owns the errors and nothing else.** `docs/component-features.md` § 6 puts
 * the boundary there: the family coordinates submission, validation, global
 * messages and focus "without owning the state of each framework". Values come from
 * `FormData`, validity from `checkValidity()`, dirtiness from the controls' own
 * `input` events, and the values themselves stay with the consumer.
 *
 * **`novalidate` is written, and constraint validation still runs.** The
 * attribute stops the browser drawing its own bubble beside a control whose
 * error the `field` is already showing; `checkValidity()` is called explicitly
 * and each control's `validationMessage` is the platform's localized string.
 *
 * **Three sources feed one map**, latest last: the `errors` prop, the platform's
 * own messages, and whatever `onSubmit` returns. The merged map is ordered by
 * `form.elements`, which is document order, so the summary lists the fields in
 * the order the reader will fix them.
 *
 * **A submit while one is pending is refused**, which is the defect a
 * double-clicked button produces in a bare `form`.
 */
export function Form({
  align,
  children,
  className,
  defaultErrors,
  disabled,
  errorFocus,
  errors,
  guardUnsaved = false,
  handle,
  loading = false,
  messages,
  nativeValidation,
  onErrorsChange,
  onSubmit,
  ref,
  style,
  summary,
  summaryDescription,
  summaryTitle,
  validate,
  ...nativeProps
}: FormProps) {
  const defaults = useFormDefaults();
  const t = useMessages(formMessages, messages);
  const formRef = useRef<HTMLFormElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);
  const summaryId = useId();

  const resolvedAlign = align ?? defaults.align;
  const resolvedErrorFocus = errorFocus ?? defaults.errorFocus;
  const resolvedSummary = summary ?? defaults.summary;
  const resolvedTitle = summaryTitle ?? t('summaryTitle');
  const resolvedDescription = summaryDescription ?? defaults.summaryDescription;
  const resolvedValidate = validate ?? defaults.validate;
  const resolvedNativeValidation = nativeValidation ?? defaults.nativeValidation;

  const controlled = errors !== undefined;
  const external = useMemo(() => normalizeErrors(errors), [errors]);
  const [own, setOwn] = useState<FormErrors>(() => normalizeErrors(defaultErrors));
  const current = controlled ? external : own;

  const [ownSubmitting, setOwnSubmitting] = useState(false);
  /* Either the family's own submission or a consumer's own work. */
  const submitting = ownSubmitting || loading;
  const [submitted, setSubmitted] = useState(false);
  const [entries, setEntries] = useState<readonly FormErrorEntry[]>([]);
  /** Set when a move should be followed by the focus a failed submit moves. */
  const focusAfter = useRef(false);

  const request = useCallback(
    (next: FormErrors, reason: ChangeReason, source: unknown) => {
      const state = createControllable<FormErrors>({
        ...(controlled ? { controlled: external } : {}),
        initial: current,
        equals: sameErrors,
        onRequest: (pending) => onErrorsChange?.(pending.value, pending),
      });
      const moved = state.request(next, reason, source);
      if (moved) setOwn(next);
      return moved;
    },
    [controlled, current, external, onErrorsChange],
  );

  /**
   * The order is the DOM's, so it is read from the DOM. An object's own key
   * order is the server's, and the server does not know the layout.
   */
  useEffect(() => {
    const form = formRef.current;
    setEntries(form === null ? [] : orderErrors(current, namedControls(form)));
  }, [current]);

  const focusFirstError = useCallback(() => {
    if (resolvedErrorFocus === 'none') return;
    if (resolvedErrorFocus === 'summary' && summaryRef.current !== null) {
      summaryRef.current.focus();
      return;
    }
    const form = formRef.current;
    const first = entries[0];
    if (form === null || first === undefined) return;
    const control = form.elements.namedItem(first.name);
    const element = control instanceof RadioNodeList ? control[0] : control;
    if (element instanceof HTMLElement) element.focus();
  }, [entries, resolvedErrorFocus]);

  /**
   * The summary is rendered from the same state that decides where focus goes,
   * so the move waits for the region to exist rather than racing it.
   */
  useEffect(() => {
    if (!focusAfter.current) return;
    if (entries.length === 0) return;
    focusAfter.current = false;
    focusFirstError();
  }, [entries, focusFirstError]);

  const publish = useCallback(
    (next: FormErrors, reason: ChangeReason, source: unknown) => {
      focusAfter.current = hasErrors(next);
      request(next, reason, source);
      return next;
    },
    [request],
  );

  const runValidation = useCallback(
    (reason: ChangeReason, source: unknown) => {
      const form = formRef.current;
      if (form === null) return {};
      const found = mergeErrors(external, collectValidity(form));
      publish(found, reason, source);
      return found;
    },
    [external, publish],
  );

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      setSubmitted(true);

      /* A second submit while one is pending is refused. */
      if (submitting) {
        event.preventDefault();
        return;
      }

      const found =
        resolvedValidate === 'none' ? external : mergeErrors(external, collectValidity(form));

      if (hasErrors(found)) {
        event.preventDefault();
        publish(found, 'submit', event);
        return;
      }

      publish({}, 'submit', event);
      if (onSubmit === undefined) return;

      event.preventDefault();
      const data = new FormData(form);
      const values: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
      for (const key of new Set(data.keys())) {
        const all = data.getAll(key);
        values[key] = all.length > 1 ? all : (all[0] as FormDataEntryValue);
      }

      const answer = onSubmit(values, { event, values });
      if (!(answer instanceof Promise)) {
        if (answer !== undefined) publish(normalizeErrors(answer), 'submit', event);
        return;
      }

      setOwnSubmitting(true);
      try {
        const settled = await answer;
        if (settled !== undefined) publish(normalizeErrors(settled), 'submit', event);
      } finally {
        setOwnSubmitting(false);
      }
    },
    [external, onSubmit, publish, resolvedValidate, submitting],
  );

  /**
   * A server error is dropped when the control it names is edited, and every
   * error is dropped when the form is reset. Both are listened for on the form
   * itself, so a control associated by its `form` attribute is covered as well.
   */
  useEffect(() => {
    const form = formRef.current;
    if (form === null) return;

    const onInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const name = (target as { name?: string }).name;
      if (typeof name !== 'string' || name === '') return;

      if (resolvedValidate === 'change' && submitted) {
        request(mergeErrors(external, collectValidity(form)), 'keyboard', event);
        return;
      }
      const next = withoutError(current, name);
      if (next !== current) request(next, 'keyboard', event);
    };

    /**
     * On blur only the control that lost focus is checked. Running the whole
     * form would tell a reader that six fields they have not reached yet are
     * wrong, which is the noise `validate="submit"` exists to avoid.
     */
    const onBlurOut = (event: Event) => {
      if (resolvedValidate !== 'blur') return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const name = (target as { name?: string }).name;
      if (typeof name !== 'string' || name === '') return;
      const found = collectValidity(form);
      const next =
        name in found
          ? mergeErrors(current, { [name]: found[name] as readonly string[] })
          : withoutError(current, name);
      if (next !== current) request(next, 'keyboard', event);
    };

    const onReset = () => {
      focusAfter.current = false;
      setSubmitted(false);
      request({}, 'clear', undefined);
    };

    form.addEventListener('input', onInput);
    form.addEventListener('focusout', onBlurOut);
    form.addEventListener('reset', onReset);
    return () => {
      form.removeEventListener('input', onInput);
      form.removeEventListener('focusout', onBlurOut);
      form.removeEventListener('reset', onReset);
    };
  }, [current, external, request, resolvedValidate, submitted]);

  /**
   * The guard nobody else ships. It is off by default, because a page that
   * refuses to close after a reader typed one character is a trap, and it is
   * removed as soon as the form is submitted or reset.
   */
  useEffect(() => {
    if (!guardUnsaved) return;
    const form = formRef.current;
    if (form === null) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (submitting || !isDirty(form)) return;
      event.preventDefault();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [guardUnsaved, submitting]);

  useImperativeHandle(
    handle,
    () => ({
      validate: () => runValidation('programmatic', undefined),
      submit: () => formRef.current?.requestSubmit(),
      reset: () => formRef.current?.reset(),
      focusFirstError,
    }),
    [focusFirstError, runValidation],
  );

  const context = useMemo(
    () => ({
      align: resolvedAlign,
      entries,
      errors: current,
      registerSummary: (element: HTMLElement | null) => {
        summaryRef.current = element;
      },
      submitted,
      submitting,
      summaryDescription: resolvedDescription,
      summaryId,
      summaryTitle: resolvedTitle,
    }),
    [
      current,
      entries,
      resolvedAlign,
      resolvedDescription,
      resolvedTitle,
      submitted,
      submitting,
      summaryId,
    ],
  );

  const content: ReactNode = (
    <>
      {resolvedSummary === 'auto' ? <FormSummary /> : null}
      {children}
    </>
  );

  const rootProps: FormRootProps = keyedProps({
    children: content,
    className,
    style,
    ...(disabled === true ? { 'data-disabled': '' } : {}),
    ...(hasErrors(current) ? { 'data-invalid': '' } : {}),
    ...(submitting ? { 'data-loading': '' } : {}),
    'data-part': 'root',
    'data-ui': 'form',
  });

  /**
   * The root is a `form` and stays one. There is no `render` prop here, and the
   * reason is not an omission: a submit event has nowhere else to come from,
   * `FormData` reads a `form`, and `requestSubmit()` and `reset()` are the
   * element's own. Every part beside it is placed by the consumer already.
   */
  return (
    <FormContext.Provider value={context}>
      <form
        {...nativeProps}
        {...rootProps}
        aria-busy={submitting ? true : undefined}
        noValidate={!resolvedNativeValidation}
        onSubmit={submit}
        ref={(element: HTMLFormElement | null) => {
          formRef.current = element;
          if (typeof ref === 'function') ref(element);
          else if (ref !== null && ref !== undefined) ref.current = element;
        }}
      />
    </FormContext.Provider>
  );
}

export type { FormErrorInput };
