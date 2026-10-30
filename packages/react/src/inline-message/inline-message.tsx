import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/inline-message/inline-message.css';

import { Children, createContext, isValidElement, useContext, useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { ButtonDefaultsProvider } from '../button';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { useInlineMessageDefaults } from './inline-message-defaults';
import type {
  InlineMessageActionsProps,
  InlineMessageLive,
  InlineMessageProps,
  InlineMessageRootProps,
  InlineMessageSize,
  InlineMessageTone,
} from './inline-message.types';

/** The message's size, for the buttons its actions hold. */
const InlineMessageSizeContext = createContext<InlineMessageSize>('sm');

/**
 * The answers a message offers, after its sentence: two amounts the reader
 * may have meant, a way to undo. The buttons take the message's size.
 */
export function InlineMessageActions({ children, ...nativeProps }: InlineMessageActionsProps) {
  const size = useContext(InlineMessageSizeContext);
  return (
    <div {...keyedProps({ ...nativeProps, 'data-part': 'actions' })}>
      <ButtonDefaultsProvider size={size}>{children}</ButtonDefaultsProvider>
    </div>
  );
}

/**
 * The glyph each tone draws: `specs/components/inline-message/contract.json`
 * holds the map. Help is not a severity and draws none.
 */
const TONE_GLYPH: Record<InlineMessageTone, GlyphName | null> = {
  accent: 'status-info',
  secondary: null,
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/**
 * The two roles that announce, and the value that does not. Both roles imply
 * `aria-live` and `aria-atomic`, so the whole message is read rather than the
 * word that changed, and nothing here writes either attribute by hand.
 */
const LIVE_ROLE: Record<InlineMessageLive, string | undefined> = {
  off: undefined,
  polite: 'status',
  assertive: 'alert',
};

/**
 * One sentence about one field or one control; a message about a section is
 * an alert. Help, an error, a warning, a confirmation, or a wait.
 *
 * **The severity is a word as well as a color.** A reader who cannot see the
 * message hears the sentence and nothing else — neither the red ink nor the
 * crossed circle reaches the accessibility tree — so the family writes the
 * severity in clipped text before the message, which is GOV.UK's answer
 * generalized to every tone and to a table an application replaces once.
 *
 * **The role goes on this element, not on an inner one.** `Alert` puts its live
 * role on the text part because it has a dismiss button beside the text, and
 * MDN's `alert` role reference is explicit that the role is for text content
 * alone. A message with no controls has nothing to keep out; one that holds
 * `InlineMessageActions` is a `div` with `role="group"` named by its sentence,
 * and its live role moves to the sentence, as `Alert`'s does.
 *
 * **The line can be held open.** `reserve` gives the box one line box of its own
 * leading whether or not there is a message, and the mark and the severity word
 * withdraw when there is not — so a form renders the message unconditionally
 * and never moves when the error arrives.
 */
export function InlineMessage({
  children,
  disabled,
  hideIcon = false,
  icon,
  id,
  live,
  loading = false,
  mark,
  prefix,
  ref,
  render,
  reserve = false,
  size,
  tone,
  ...nativeProps
}: InlineMessageProps) {
  const defaults = useInlineMessageDefaults();
  const generatedId = useId();

  const resolvedTone = tone ?? defaults.tone;
  const resolvedMark = mark ?? defaults.mark;
  /* The glyph the family draws when the page supplies none. A message that is
     waiting draws a ring instead, and one that asked for no mark draws none. */
  const glyph: GlyphName | null =
    loading || resolvedMark === 'none'
      ? null
      : resolvedMark === 'dot'
        ? 'dot'
        : TONE_GLYPH[resolvedTone];
  const resolvedLive = live ?? defaults.live;
  const resolvedSize = size ?? defaults.size;
  const liveRole = LIVE_ROLE[resolvedLive];
  /* A paragraph cannot hold a button: actions make the root a group. */
  const parts = Children.toArray(children);
  const actions = parts.filter(
    (part) => isValidElement(part) && part.type === InlineMessageActions,
  );
  const grouped = actions.length > 0;
  const sentence: ReactNode = grouped ? parts.filter((part) => !actions.includes(part)) : children;
  const messageId = id ?? generatedId;
  const textId = `${messageId}-text`;
  const role = grouped ? 'group' : liveRole;
  /* Unstated asks the table; the empty string is a consumer removing the word. */
  const word = prefix ?? defaults.prefixes[resolvedTone] ?? '';

  const rootProps: InlineMessageRootProps = keyedProps({
    ...(role === undefined ? {} : { role }),
    ...(grouped ? { 'aria-labelledby': textId } : {}),
    ...nativeProps,
    ...(loading ? { 'data-loading': '' } : {}),
    ...(disabled === true ? { 'data-disabled': '' } : {}),
    ...(reserve ? { 'data-reserve': '' } : {}),
    children: (
      <>
        {word === '' ? null : (
          <span data-part="prefix" data-part-prefix="">
            {word}
          </span>
        )}
        {hideIcon ? null : (
          <span aria-hidden="true" data-part="icon" data-part-icon="">
            {icon ??
              (glyph === null ? null : (
                <Icon>
                  <Glyph name={glyph} />
                </Icon>
              ))}
          </span>
        )}
        {/* The wrapper is the family's, not the consumer's: it is what makes
            "is there a message?" a question the stylesheet can ask, and what
            keeps a message holding a link one grid item rather than two. */}
        <span
          data-part="text"
          data-part-text=""
          {...(grouped ? { id: textId } : {})}
          {...(grouped && liveRole !== undefined ? { role: liveRole } : {})}
        >
          {sentence}
        </span>
        {grouped ? (
          <InlineMessageSizeContext.Provider value={resolvedSize}>
            {actions}
          </InlineMessageSizeContext.Provider>
        ) : null}
      </>
    ),
    'data-live': resolvedLive,
    'data-mark': resolvedMark,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-tone': resolvedTone,
    'data-ui': 'inline-message',
    id: messageId,
    ref,
  });

  if (render !== undefined) return render(rootProps);
  return grouped ? <div {...(rootProps as ComponentPropsWithRef<'div'>)} /> : <p {...rootProps} />;
}
