import { keyedProps } from '@slotted/core/selector-key';
import { createContext, useContext, useEffect } from 'react';

import { ButtonDefaultsProvider } from '../button/button-defaults';
import type {
  AlertActionsProps,
  AlertContentProps,
  AlertDescriptionProps,
  AlertLive,
  AlertPartProps,
  AlertTitleProps,
  AlertTone,
} from './alert.types';

/**
 * What the box tells the parts inside it: which role the announcing region
 * carries, and the identifier the title has to write so the box can be named
 * by it.
 *
 * `registerTitle` is how the box learns that a title exists at all. A `section`
 * with an `aria-labelledby` pointing at nothing is a `section` with no
 * accessible name, and writing the attribute anyway would leave a dangling
 * reference in the DOM of every alert that has only a description.
 */
export interface AlertContextValue {
  live: AlertLive;
  tone: AlertTone;
  titleId: string;
  registerTitle: (present: boolean) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const AlertProvider = AlertContext.Provider;

function useAlertContext(part: string): AlertContextValue {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error(`Alert${part} has to be rendered inside an Alert.`);
  }
  return context;
}

/**
 * The two roles that announce, and the value that does not. Both roles imply
 * `aria-live` and `aria-atomic`, so the whole message is read rather than the
 * word that changed, and nothing here writes either attribute by hand.
 */
const LIVE_ROLE: Record<AlertLive, string | undefined> = {
  off: undefined,
  polite: 'status',
  assertive: 'alert',
};

/**
 * The message itself, and the only part that announces.
 *
 * MDN's `alert` role reference states that the role "should only be used for
 * text content, not interactive elements such as links or buttons". Four of the
 * ten surveyed implementations write a live role on the box and then put a
 * dismiss button inside it; two write none at all and announce nothing. This
 * part is the third answer: the region holds the title and the description, and
 * the controls are its siblings.
 *
 * It is written explicitly rather than wrapped around the alert's children,
 * because a box that guessed which of its children were text would be guessing
 * about the one thing a reader hears.
 */
export function AlertContent({ render, ...nativeProps }: AlertContentProps) {
  const { live } = useAlertContext('Content');
  const role = LIVE_ROLE[live];

  const partProps: AlertPartProps = keyedProps({
    ...nativeProps,
    ...(role === undefined ? {} : { role }),
    'data-part': 'content',
  });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/**
 * The message's name, and the box's. It renders a `div`: a heading puts the
 * alert in the document outline, which is right for a page banner and wrong for
 * the alert beside a field group, and only the page knows which. `render` is
 * how a page that wants one says so.
 */
export function AlertTitle({ render, ...nativeProps }: AlertTitleProps) {
  const { registerTitle, titleId } = useAlertContext('Title');

  useEffect(() => {
    registerTitle(true);
    return () => registerTitle(false);
  }, [registerTitle]);

  const partProps: AlertPartProps = keyedProps({
    id: titleId,
    ...nativeProps,
    'data-part': 'title',
  });

  return render === undefined ? <div {...partProps} /> : render(partProps);
}

/** The message. A `p`, because that is what a paragraph of prose is. */
export function AlertDescription({ render, ...nativeProps }: AlertDescriptionProps) {
  const partProps = keyedProps({ ...nativeProps, 'data-part': 'description' } as const);

  return render === undefined ? <p {...partProps} /> : render(partProps);
}

/**
 * The controls that act on the message, outside the region that announces: a
 * reader hearing the message is not read the labels of two buttons in the
 * middle of it. What goes in is the consumer's own `Button`s, because `button`
 * already owns what a button is; they take the alert's tone and the small
 * size through its defaults, and a button that states an axis still wins.
 */
export function AlertActions({ render, ...nativeProps }: AlertActionsProps) {
  const { tone } = useAlertContext('Actions');
  const partProps: AlertPartProps = keyedProps({ ...nativeProps, 'data-part': 'actions' });

  return (
    <ButtonDefaultsProvider size="sm" tone={tone}>
      {render === undefined ? <div {...partProps} /> : render(partProps)}
    </ButtonDefaultsProvider>
  );
}
