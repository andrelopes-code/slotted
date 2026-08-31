import '@slotted/styles/alert/alert.css';

import type { AlertLive, AlertProps, AlertRootProps } from './alert.types';

/**
 * `live` decides whether the message interrupts, and nothing else does. A
 * message rendered with the page says nothing; one that appears after an
 * action is polite; only a message about something going wrong right now earns
 * assertive, which cuts a screen reader off mid-sentence.
 */
const LIVE_ROLE: Record<AlertLive, string | undefined> = {
  off: undefined,
  polite: 'status',
  assertive: 'alert',
};

export function Alert({
  className,
  fill = 'subtle',
  live = 'off',
  render,
  role,
  size = 'md',
  variant = 'accent',
  ...nativeProps
}: AlertProps) {
  const rootProps: AlertRootProps = {
    ...nativeProps,
    className: ['slotted-alert', className].filter(Boolean).join(' '),
    'data-fill': fill,
    'data-part': 'root',
    'data-size': size,
    'data-slotted-component': 'alert',
    'data-variant': variant,
    role: role ?? LIVE_ROLE[live],
  };

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
