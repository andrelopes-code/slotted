import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/alert/alert.css';

import { alertMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, MouseEvent, SyntheticEvent } from 'react';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import type { GlyphName } from '../icon';
import { useAlertDefaults } from './alert-defaults';
import { AlertProvider } from './alert-parts';
import type { AlertCloseReason, AlertProps, AlertRootProps, AlertTone } from './alert.types';

/**
 * The glyph each tone draws, in its solid form: `specs/components/alert/contract.json`
 * holds the map. Every one is circled, so every mark is the same disc and the
 * symbol cut out of it tells the tones apart. `secondary` draws none: a neutral
 * note has no severity to state, and a disc with nothing cut out of it said
 * nothing. Its absence is itself the difference under forced colors.
 */
const TONE_GLYPH: Record<AlertTone, GlyphName | null> = {
  accent: 'status-info',
  secondary: null,
  info: 'status-info',
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
};

/**
 * A message about the page, a section, or the thing beside it: a tone, a mark,
 * a title, a description, the controls that act on it, and the control that
 * puts it away.
 *
 * **The box is a landmark, not a live region.** It renders a `section`, named
 * by its own title through `aria-labelledby`, so a reader can jump to it; the
 * region that announces is `AlertContent`, which holds only the text. MDN's
 * `alert` role reference is explicit that the role "should only be used for
 * text content, not interactive elements such as links or buttons", and every
 * alert worth shipping has a dismiss control.
 *
 * **Closing hides rather than unmounts.** A live region has to be in the
 * document before its text changes, so an alert that removed itself could not
 * announce the second time the message arrived — and `data-open` is only a
 * state a consumer can style if the element is there to carry it. An
 * application that must not pay for the hidden subtree renders the alert
 * conditionally itself and never passes `defaultOpen`.
 *
 * **The keyboard is not dropped.** None of the ten surveyed implementations
 * says where focus goes after the dismiss control it was on is destroyed. Here
 * it goes back where it came from, and nowhere at all if it never came.
 */
export function Alert({
  actionsPlacement,
  children,
  defaultOpen = true,
  dismissible = false,
  hideIcon = false,
  icon,
  live,
  messages,
  onBlur,
  onFocus,
  onOpenChange,
  open,
  reach,
  ref,
  render,
  restoreFocus = true,
  tone,
  variant,
  ...nativeProps
}: AlertProps) {
  const defaults = useAlertDefaults();
  const t = useMessages(alertMessages, messages);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [hasTitle, setHasTitle] = useState(false);
  const id = useId();
  const titleId = `${id}title`;

  const resolvedLive = live ?? defaults.live;
  const isOpen = open ?? uncontrolledOpen;

  /**
   * Where the keyboard came from, and whether it is here now. Both are read at
   * the moment the message closes, when the element it was on may already be
   * gone — so they are remembered as the focus crosses the boundary rather
   * than looked up in the DOM afterwards.
   */
  const cameFrom = useRef<HTMLElement | null>(null);
  const holdsFocus = useRef(false);
  const wasOpen = useRef(isOpen);
  const wantsRestore = useRef(restoreFocus);
  useEffect(() => {
    wantsRestore.current = restoreFocus;
  }, [restoreFocus]);

  const restore = useCallback(() => {
    if (!wantsRestore.current || !holdsFocus.current) return;
    holdsFocus.current = false;
    const target = cameFrom.current;
    if (target === null || !target.isConnected) return;
    target.focus();
  }, []);

  useEffect(() => {
    if (wasOpen.current && !isOpen) restore();
    wasOpen.current = isOpen;
  }, [isOpen, restore]);

  /* The message removed by the consumer rather than closed by itself. The
     cleanup runs after the element is gone, which is why nothing here reads
     the DOM. */
  useEffect(() => () => restore(), [restore]);

  const resolvedTone = tone ?? defaults.tone;
  const context = useMemo(
    () => ({ live: resolvedLive, registerTitle: setHasTitle, titleId, tone: resolvedTone }),
    [resolvedLive, titleId, resolvedTone],
  );

  function requestClose(reason: AlertCloseReason, source?: SyntheticEvent) {
    const state = createControllable<boolean>({
      controlled: open,
      initial: uncontrolledOpen,
      onRequest: (request) => onOpenChange?.(request.value, request),
    });

    if (state.request(false, reason, source)) setUncontrolledOpen(false);
  }

  const glyph = TONE_GLYPH[resolvedTone];

  const rootProps: AlertRootProps = keyedProps({
    ...(hasTitle ? { 'aria-labelledby': titleId } : {}),
    ...nativeProps,
    ...(isOpen ? { 'data-open': '' } : {}),
    children: (
      <AlertProvider value={context}>
        {hideIcon || (icon == null && glyph === null) ? null : (
          <span aria-hidden="true" data-part="icon" data-part-icon="">
            {icon ??
              (glyph === null ? null : (
                <Icon>
                  <Glyph name={glyph} solid />
                </Icon>
              ))}
          </span>
        )}
        {children}
        {dismissible ? (
          <button
            aria-label={t('dismiss')}
            data-part="dismiss"
            data-part-dismiss=""
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              /* A consumer that called preventDefault has refused the
                 dismissal, and a refused dismissal moves nothing. */
              if (event.defaultPrevented) return;
              requestClose('dismiss', event);
            }}
            type="button"
          >
            <Icon>
              <Glyph name="x" />
            </Icon>
          </button>
        ) : null}
      </AlertProvider>
    ),
    'data-actions-placement':
      actionsPlacement ?? ((reach ?? defaults.reach) === 'page' ? 'end' : 'below'),
    'data-live': resolvedLive,
    'data-part': 'root',
    'data-reach': reach ?? defaults.reach,
    'data-tone': resolvedTone,
    'data-ui': 'alert',
    'data-variant': variant ?? defaults.variant,
    hidden: !isOpen,
    onBlur: (event: FocusEvent<HTMLElement>) => {
      onBlur?.(event);
      const next = event.relatedTarget;
      if (next === null || !event.currentTarget.contains(next)) holdsFocus.current = false;
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      onFocus?.(event);
      const previous = event.relatedTarget;
      if (previous instanceof HTMLElement && !event.currentTarget.contains(previous)) {
        cameFrom.current = previous;
      }
      holdsFocus.current = true;
    },
    ref,
    tabIndex: nativeProps.tabIndex ?? -1,
  });

  return render === undefined ? <section {...rootProps} /> : render(rootProps);
}
