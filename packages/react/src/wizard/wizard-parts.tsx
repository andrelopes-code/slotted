import { withSelectorKey } from '@slotted/core/selector-key';
import type { MouseEvent, ReactElement } from 'react';

import { Button } from '../button';
import type { ButtonRootProps } from '../button';
import { useLocale } from '../i18n';
import { useWizard } from './wizard-context';
import type {
  WizardActionProps,
  WizardActionsProps,
  WizardCompleteProps,
  WizardEditProps,
  WizardStepProps,
} from './wizard.types';

/**
 * One step. The wizard reads its props to lay out the flow and renders its
 * children inside the step's `form`; rendered anywhere else it is only its
 * children.
 */
export function WizardStep({ children }: WizardStepProps) {
  return <>{children}</>;
}

/**
 * What stands in place of the step and the actions after an accepted
 * submission. The wizard renders it as the `complete` part, lands its props
 * there, and moves focus to it.
 */
export function WizardComplete(props: WizardCompleteProps) {
  void props;
  return null;
}

/**
 * `Button` writes its own `data-part="root"`, and the wizard's parts are named
 * for what they do. The part is written after the button's props, the way
 * `transfer` names its moves, and a consumer's own `render` still receives it.
 */
function asPart(
  part: string,
  render: ((props: ButtonRootProps) => ReactElement) | undefined,
): (props: ButtonRootProps) => ReactElement {
  return (props) => {
    const named = withSelectorKey(props, 'part', part);
    return render === undefined ? <button {...named} /> : render(named);
  };
}

/** Runs the consumer's handler first, and the family's only if it was not refused. */
function composed(
  own: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined,
  family: (event: MouseEvent<HTMLButtonElement>) => void,
) {
  return (event: MouseEvent<HTMLButtonElement>) => {
    own?.(event);
    if (!event.defaultPrevented) family(event);
  };
}

/**
 * The row under the step: what leaves the flow at the start, what moves it at
 * the end, the primary action last. Each group defaults to the actions the
 * wizard can offer; a consumer that names its own arranges the parts below.
 */
export function WizardActions({ end, ref, start, ...nativeProps }: WizardActionsProps) {
  return (
    <div {...withSelectorKey(nativeProps, 'part', 'actions')} ref={ref}>
      <div data-part="actions-start" data-part-actions-start="">
        {start ?? (
          <>
            <WizardCancel />
            <WizardSaveDraft />
            <WizardDraftStatus />
          </>
        )}
      </div>
      <div data-part="actions-end" data-part-actions-end="">
        {end ?? (
          <>
            <WizardSkip />
            <WizardPrevious />
            <WizardNext />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Submits the step's form from outside it, through the platform's `form`
 * attribute, so `Enter` in a field and this button are one path. It reads
 * "Next", "Save and return" after an edit from a review step, and the submit
 * label on the step whose acceptance submits the flow.
 */
export function WizardNext({ children, onClick, render, ...props }: WizardActionProps) {
  const wizard = useWizard();
  const final = wizard.isFinal && !wizard.returning;
  return (
    <Button
      data-final={final ? '' : undefined}
      render={asPart(final ? 'submit' : 'next', render)}
      disabled={wizard.disabled}
      focusableWhenDisabled
      form={wizard.formId}
      loading={wizard.busy}
      onClick={onClick}
      tone="accent"
      type="submit"
      variant="solid"
      {...props}
    >
      {children ?? wizard.t(wizard.returning ? 'return' : final ? 'submit' : 'next')}
    </Button>
  );
}

/** One step back, keeping what was typed. Absent on the first step. */
export function WizardPrevious({ children, onClick, render, ...props }: WizardActionProps) {
  const wizard = useWizard();
  if (wizard.isFirst || wizard.phase === 'complete') return null;
  return (
    <Button
      render={asPart('previous', render)}
      disabled={wizard.disabled || wizard.busy}
      focusableWhenDisabled
      onClick={composed(onClick, (event) => wizard.previous(event))}
      tone="secondary"
      type="button"
      variant="outline"
      {...props}
    >
      {children ?? wizard.t('previous')}
    </Button>
  );
}

/** Asks `onCancel`, with whether anything is unsubmitted. Absent without a handler. */
export function WizardCancel({ children, onClick, render, ...props }: WizardActionProps) {
  const wizard = useWizard();
  if (!wizard.canCancel) return null;
  return (
    <Button
      render={asPart('cancel', render)}
      disabled={wizard.phase === 'submitting'}
      focusableWhenDisabled
      onClick={composed(onClick, (event) => wizard.cancel(event))}
      tone="secondary"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? wizard.t('cancel')}
    </Button>
  );
}

/** Writes the draft. Absent unless the wizard has somewhere to write it. */
export function WizardSaveDraft({ children, onClick, render, ...props }: WizardActionProps) {
  const wizard = useWizard();
  if (!wizard.canSaveDraft) return null;
  return (
    <Button
      render={asPart('save-draft', render)}
      disabled={wizard.disabled || wizard.busy}
      focusableWhenDisabled
      loading={wizard.draftState === 'saving'}
      onClick={composed(onClick, (event) => wizard.saveDraft('pointer', event))}
      tone="secondary"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? wizard.t('saveDraft')}
    </Button>
  );
}

/** Accepts an optional step with no answers. Absent on a required step. */
export function WizardSkip({ children, onClick, render, ...props }: WizardActionProps) {
  const wizard = useWizard();
  if (!wizard.optional) return null;
  return (
    <Button
      render={asPart('skip', render)}
      disabled={wizard.disabled || wizard.busy}
      focusableWhenDisabled
      onClick={composed(onClick, (event) => wizard.skip(event))}
      tone="secondary"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? wizard.t('skip')}
    </Button>
  );
}

/**
 * The polite status that says when the draft was saved. It is always in the
 * DOM once the wizard can save, so the first announcement is heard; the
 * stylesheet takes it out of the layout while it is empty.
 */
export function WizardDraftStatus() {
  const wizard = useWizard();
  const locale = useLocale();
  if (!wizard.canSaveDraft) return null;
  const text =
    wizard.draftState === 'saving'
      ? wizard.t('saving')
      : wizard.draftState === 'failed'
        ? wizard.t('draftFailed')
        : wizard.draftState === 'saved' && wizard.savedAt !== undefined
          ? wizard.t('saved', {
              time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
                wizard.savedAt,
              ),
            })
          : '';
  return (
    <span data-part="draft-status" data-part-draft-status="" role="status">
      {text}
    </span>
  );
}

/**
 * The control a review step puts beside each answer. It goes to the named step
 * and sets the return point, so accepting that step comes back here. Its name
 * is the label and the step's name: "Change shipping address".
 */
export function WizardEdit({ children, onClick, ref, step, ...nativeProps }: WizardEditProps) {
  const wizard = useWizard();
  const target = wizard.steps.find((candidate) => candidate.name === step);
  const unavailable = wizard.disabled || wizard.busy || target === undefined;
  return (
    <button
      aria-disabled={unavailable ? true : undefined}
      data-part="edit"
      data-part-edit=""
      {...nativeProps}
      onClick={composed(onClick, (event) => {
        if (unavailable) return;
        wizard.edit(step, event);
      })}
      ref={ref}
      type="button"
    >
      {children ?? wizard.t('edit')}
      {target === undefined ? null : (
        <>
          {' '}
          <span data-ui="visually-hidden" data-ui-visually-hidden="">
            {target.label}
          </span>
        </>
      )}
    </button>
  );
}
