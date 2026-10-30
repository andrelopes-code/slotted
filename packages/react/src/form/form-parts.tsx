import { useFormDefaults, useFormState } from './form-context';
import type { FormActionsProps, FormAsideProps, FormSummaryProps } from './form.types';

/**
 * The summary of everything wrong with the form: a focusable region with a
 * heading, and a link per error pointing at the control it is about.
 *
 * It is the GOV.UK error summary, item for item — "move keyboard focus to the
 * error summary", "include the heading", "link to each of the answers that have
 * validation errors", "make sure the error messages in the error summary are
 * worded the same as those which appear next to the inputs". The last one is
 * free here: one map feeds the summary and the field.
 *
 * An error naming a control the form does not hold keeps its place and loses
 * its link. A message a reader cannot reach is still a message they have to be
 * given.
 *
 * The form renders this itself under `summary="auto"`. A consumer who wants it
 * somewhere else writes `summary="none"` and places this part.
 */
export function FormSummary({ ref, ...nativeProps }: FormSummaryProps) {
  const form = useFormState();
  if (form === undefined || form.entries.length === 0) return null;

  return (
    <div
      aria-labelledby={form.summaryId}
      data-ui="form"
      data-ui-form=""
      data-part="summary"
      data-part-summary=""
      role="alert"
      tabIndex={-1}
      {...nativeProps}
      ref={(element: HTMLDivElement | null) => {
        form.registerSummary(element);
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
    >
      <h2 data-part="summary-title" data-part-summary-title="" id={form.summaryId}>
        {form.summaryTitle}
      </h2>
      {form.summaryDescription === undefined ? null : <p>{form.summaryDescription}</p>}
      <ul data-part="summary-list" data-part-summary-list="">
        {form.entries.flatMap((entry) =>
          entry.messages.map((message, index) => (
            <li key={`${entry.name}-${index}`}>
              {entry.id === undefined ? (
                <span data-part="summary-item" data-part-summary-item="">
                  {message}
                </span>
              ) : (
                <a
                  data-part="summary-item"
                  data-part-summary-item=""
                  href={`#${entry.id}`}
                  onClick={(event) => {
                    /**
                     * The fragment is not followed. A link that navigated would
                     * write the control's identifier into the address bar and
                     * add an entry to the history of a page that never left;
                     * focusing the control is the whole of what the link is
                     * for, and the browser scrolls it into view with the focus.
                     */
                    const target = event.currentTarget.ownerDocument.getElementById(
                      entry.id as string,
                    );
                    if (target === null) return;
                    event.preventDefault();
                    target.focus();
                  }}
                >
                  {message}
                </a>
              )}
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

/**
 * The row a form's actions stand in.
 *
 * `inline` can end-align a row of buttons. What it cannot do without a query
 * the consumer writes for every form is the reflow: below the row's own
 * container width every action takes the whole width, in a column, with the
 * primary one first — a row's thumb is at the bottom of a phone and at the end
 * of a page.
 */
export function FormActions({ align, ref, ...nativeProps }: FormActionsProps) {
  const form = useFormState();
  const defaults = useFormDefaults();

  return (
    <div
      data-align={align ?? form?.align ?? defaults.align}
      data-ui="form"
      data-ui-form=""
      data-part="actions"
      data-part-actions=""
      {...nativeProps}
      ref={ref}
    />
  );
}

/**
 * What the form says about the whole record — a live preview, a summary in
 * words, a help panel — beside the column of fields on a wide form, and after
 * the last field on a narrow one.
 */
export function FormAside({ ref, ...nativeProps }: FormAsideProps) {
  return (
    <div
      data-ui="form"
      data-ui-form=""
      data-part="aside"
      data-part-aside=""
      {...nativeProps}
      ref={ref}
    />
  );
}
