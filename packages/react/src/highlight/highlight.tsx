import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/highlight/highlight.css';

import { Fragment, useMemo } from 'react';

import { highlightRuns } from '@slotted/core/highlight';

import { useHighlightDefaults } from './highlight-defaults';
import type { HighlightProps, HighlightRootProps } from './highlight.types';

/**
 * The spans of a text a query found, marked.
 *
 * It is content, not a control: nothing here is focusable and nothing answers
 * a key. The HTML Standard defines `mark` for the term searched for inside a
 * result, and the family renders one per contiguous span inside the element
 * that holds the text. What is marked is decided by `@slotted/core/highlight`,
 * the same scan `combobox`'s filter decides with, so an option that passes the
 * filter shows the mark the filter found.
 *
 * `text` is a string and the runs are slices of it. Nothing is parsed, so a
 * label holding `<b>` renders `<b>` — which is what §10 of the feature guide
 * asks for when it says the family injects no HTML.
 */
export function Highlight({
  current,
  disabled,
  locale,
  matcher,
  occurrences,
  query,
  ranges,
  render,
  sensitivity,
  text,
  ...nativeProps
}: HighlightProps) {
  const defaults = useHighlightDefaults();
  const resolvedLocale = locale ?? defaults.locale;
  const resolvedSensitivity = sensitivity ?? defaults.sensitivity;
  const resolvedOccurrences = occurrences ?? defaults.occurrences;

  const runs = useMemo(
    () =>
      highlightRuns(text, {
        locale: resolvedLocale,
        matcher,
        occurrences: resolvedOccurrences,
        query,
        ranges,
        sensitivity: resolvedSensitivity,
      }),
    [matcher, query, ranges, resolvedLocale, resolvedOccurrences, resolvedSensitivity, text],
  );

  const rootProps: HighlightRootProps = keyedProps({
    ...nativeProps,
    children: runs.map((run, index) =>
      run.matched ? (
        <mark
          data-part="match"
          data-part-match=""
          key={index}
          {...(run.index === current ? { 'data-current': '' } : {})}
        >
          {run.text}
        </mark>
      ) : (
        <Fragment key={index}>{run.text}</Fragment>
      ),
    ),
    'data-part': 'root',
    'data-ui': 'highlight',
    ...(disabled ? { 'data-disabled': '' as const } : {}),
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
