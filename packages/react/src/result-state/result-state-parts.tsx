import { keyedProps } from '@slotted/core/selector-key';
import { createContext, useContext, useEffect } from 'react';

import type {
  ResultStateActionsProps,
  ResultStateContentProps,
  ResultStateDescriptionProps,
  ResultStateFooterProps,
  ResultStateLive,
  ResultStatePartProps,
  ResultStateTitleProps,
} from './result-state.types';

/**
 * What the box tells the parts inside it: which role the announcing region
 * carries, and the identifier the title falls back to so the box can be named
 * by it.
 *
 * `registerTitle` carries the identifier rather than a boolean, because the
 * title's own is not always the family's: a page that writes `id` on the title
 * — to link a skip target at it, say — keeps that identifier, and the box has
 * to point at the one that is actually in the DOM. Reporting only presence is
 * how the first draft came to name the region by an identifier no element had.
 *
 * The APG's region landmark practice states that "a region landmark must have
 * a label", so a `section` whose `aria-labelledby` points at nothing is a
 * `section` with no accessible name and no landmark either.
 */
export interface ResultStateContextValue {
  live: ResultStateLive;
  titleId: string;
  registerTitle: (id: string | null) => void;
}

const ResultStateContext = createContext<ResultStateContextValue | undefined>(undefined);

export const ResultStateProvider = ResultStateContext.Provider;

function useResultStateContext(part: string): ResultStateContextValue {
  const context = useContext(ResultStateContext);
  if (context === undefined) {
    throw new Error(`ResultState${part} has to be rendered inside a ResultState.`);
  }
  return context;
}

/**
 * The two roles that announce, and the value that does not. Both roles imply
 * `aria-live` and `aria-atomic`, so the whole message is read rather than the
 * word that changed, and nothing here writes either attribute by hand.
 */
const LIVE_ROLE: Record<ResultStateLive, string | undefined> = {
  off: undefined,
  polite: 'status',
  assertive: 'alert',
};

/**
 * The message itself, and the only part that announces.
 *
 * MDN's `alert` role reference states that the role "should only be used for
 * text content, not interactive elements such as links or buttons", and this
 * family has a row of buttons in it. So the region holds the title and the
 * description, and the mark, the actions and the footer are its siblings.
 *
 * None of the seven surveyed implementations writes a live role of any kind,
 * while WCAG 2.2's Understanding document for SC 4.1.3 names "No results
 * returned" as its own example of a status message.
 */
export function ResultStateContent({ render, ...nativeProps }: ResultStateContentProps) {
  const { live } = useResultStateContext('Content');
  const role = LIVE_ROLE[live];

  const partProps: ResultStatePartProps = keyedProps({
    ...nativeProps,
    ...(role === undefined ? {} : { role }),
    'data-part': 'content',
  });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/**
 * The message's name, and the box's. It renders a `div`: a heading puts the
 * region in the document outline, which is right for a full-page 404 and wrong
 * for the empty state of one card in a grid of twelve, and only the page knows
 * which. `render` is how a page that wants one says so.
 *
 * Atlassian's `headingLevel`, one to six, is the field's answer. A numeric prop
 * invites a skipped level, which the guide's section 10 forbids.
 */
export function ResultStateTitle({ render, ...nativeProps }: ResultStateTitleProps) {
  const { registerTitle, titleId } = useResultStateContext('Title');
  const id = nativeProps.id ?? titleId;

  useEffect(() => {
    registerTitle(id);
    return () => registerTitle(null);
  }, [id, registerTitle]);

  const partProps: ResultStatePartProps = keyedProps({
    ...nativeProps,
    'data-part': 'title',
    id,
  });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/** The message. A `p`, because that is what a paragraph of prose is. */
export function ResultStateDescription({ render, ...nativeProps }: ResultStateDescriptionProps) {
  const partProps = keyedProps({ ...nativeProps, 'data-part': 'description' } as const);

  return render === undefined ? <p {...partProps} /> : render(partProps);
}

/**
 * The controls that get the reader out of the situation, outside the region
 * that announces. What goes in is the consumer's own `Button`s, because
 * `button` already owns what a button is — including `loading`, which is what a
 * retry in flight is.
 */
export function ResultStateActions({ render, ...nativeProps }: ResultStateActionsProps) {
  const partProps: ResultStatePartProps = keyedProps({ ...nativeProps, 'data-part': 'actions' });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/**
 * The line under the actions: the documentation link that is not a call to
 * action. Polaris calls it `footerContent` and Atlassian a `tertiaryAction`,
 * and both are right that it is neither of the buttons above it.
 */
export function ResultStateFooter({ render, ...nativeProps }: ResultStateFooterProps) {
  const partProps: ResultStatePartProps = keyedProps({ ...nativeProps, 'data-part': 'footer' });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}
