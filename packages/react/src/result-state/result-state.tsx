import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/result-state/result-state.css';

import { isValidElement, useCallback, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useResultStateDefaults } from './result-state-defaults';
import { ResultStateProvider, ResultStateTitle } from './result-state-parts';
import type { ResultStateProps, ResultStateRootProps } from './result-state.types';

/**
 * The region that stands in for content that is not there, and says what to do
 * next: a title, a description, the controls that get the reader out, and a
 * line of documentation under them. Above them goes the page's own artwork,
 * or one of three neutral drawings the family makes around the page's glyph
 * (`illustration`); a tone glyph enlarged above the title is the one picture
 * it never draws (RS1).
 *
 * It is not `alert`. An alert sits beside the content it is about; this
 * replaces it. `inline-message` is a line of text under one control.
 *
 * **The box is a landmark, not a live region.** It renders a `section`, named
 * by its own title through `aria-labelledby`, so a reader can jump to it; the
 * region that announces is `ResultStateContent`, which holds only the text.
 * MDN's `alert` role reference is explicit that the role "should only be used
 * for text content, not interactive elements such as links or buttons".
 *
 * **It announces by default.** WCAG 2.2's Understanding document for SC 4.1.3
 * names this family's own text as its example of a status message: "brief text
 * messages displayed about the completion or status of the search, such as
 * 'Searching…', '18 results returned' or 'No results returned' would be status
 * updates if they do not take focus or cause a page refresh." `alert` defaults
 * to silence because an alert may be a standing notice; a result is always the
 * outcome of an operation. None of the seven surveyed implementations writes a
 * live role of any kind.
 *
 * **The keyboard has somewhere to go.** The root carries `tabIndex={-1}`, so an
 * application that has just emptied a table can send the reader to the message
 * through the ref. The family never moves focus by itself — that would be a
 * change of context nobody asked for.
 */
/**
 * The identifier of the title written among the children, read from the
 * element tree so the server HTML is already named; the title's own effect
 * reports one a component of the page's renders. A nested state is not read.
 */
function readTitleId(node: ReactNode, fallback: string): string | null {
  if (Array.isArray(node)) {
    for (const child of node as ReactNode[]) {
      const found = readTitleId(child, fallback);
      if (found !== null) return found;
    }
    return null;
  }
  if (!isValidElement<{ children?: ReactNode; id?: string }>(node) || node.type === ResultState) {
    return null;
  }
  if (node.type === ResultStateTitle) return node.props.id ?? fallback;
  return readTitleId(node.props.children, fallback);
}

export function ResultState({
  align,
  children,
  illustration,
  live,
  media,
  reach,
  ref,
  render,
  status,
  ...nativeProps
}: ResultStateProps) {
  const defaults = useResultStateDefaults();
  /** The identifier the title actually carries, which is not always ours. */
  const [labelId, setLabelId] = useState<string | null>(null);
  const id = useId();
  const titleId = `${id}title`;

  const named = labelId ?? readTitleId(children, titleId);

  const registerTitle = useCallback((next: string | null) => setLabelId(next), []);

  const context = useMemo(
    () => ({ live: live ?? defaults.live, registerTitle, titleId }),
    [defaults.live, live, registerTitle, titleId],
  );

  const rootProps: ResultStateRootProps = keyedProps({
    ...(named === null ? {} : { 'aria-labelledby': named }),
    ...nativeProps,
    children: (
      <ResultStateProvider value={context}>
        {/* Always drawn and empty until the page fills it: the stylesheet
            withdraws an empty box, so a region with no picture is a title, a
            description and an action with nothing standing above them (RS1).
            A stack of cards is the one drawing that stands without a glyph. */}
        <div aria-hidden="true" data-part="media" data-part-media="">
          {media}
        </div>
        {children}
      </ResultStateProvider>
    ),
    'data-align': align ?? defaults.align,
    'data-illustration': illustration ?? defaults.illustration,
    'data-live': live ?? defaults.live,
    'data-part': 'root',
    'data-reach': reach ?? defaults.reach,
    'data-status': status ?? defaults.status,
    'data-ui': 'result-state',
    ref,
    tabIndex: nativeProps.tabIndex ?? -1,
  });

  return render === undefined ? <section {...rootProps} /> : render(rootProps);
}
