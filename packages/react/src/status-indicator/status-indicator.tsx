import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/status-indicator/status-indicator.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { statusIndicatorMessages } from '@slotted/core/i18n';

import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useStatusIndicatorDefaults } from './status-indicator-defaults';
import {
  STATUS_INDICATOR_DEFAULT_STATUS,
  STATUS_INDICATOR_GLYPHS,
} from './status-indicator.constants';
import type { StatusIndicatorProps, StatusIndicatorRootProps } from './status-indicator.types';

/**
 * What `live` writes on the root. The names are the platform's: `status` is a
 * polite live region with an implicit `aria-atomic`, so the mark and its word
 * are announced as one thing; `alert` interrupts, which the APG's Alert
 * pattern reserves for a message that needs immediate attention.
 */
const ROLE = { off: undefined, polite: 'status', assertive: 'alert' } as const;

/**
 * The operational state of something the application observes.
 *
 * The family reports; it never moves the value. That is why there is no
 * controlled and uncontrolled pair and no change request here — `status` is
 * the application's fact about a system this component cannot see, the same
 * relationship a progress range has to the work it reports.
 *
 * It is always named. Given words, those words are the name; given none, the
 * status's own word is rendered and clipped from view. Neither branch reaches
 * for `role="img"` and an `aria-label`, which is what Fluent's presence badge
 * does: real text in the document is what lets a live region announce its own
 * contents, lets an `aria-labelledby` elsewhere point at it, and lets a page
 * search find the word.
 */
export function StatusIndicator({
  children,
  detail,
  label,
  live,
  mark,
  messages,
  pulse = false,
  render,
  role,
  size,
  status = STATUS_INDICATOR_DEFAULT_STATUS,
  ...nativeProps
}: StatusIndicatorProps) {
  const defaults = useStatusIndicatorDefaults();
  const t = useMessages(statusIndicatorMessages, messages);
  const resolved = {
    live: live ?? defaults.live ?? 'off',
    mark: mark ?? defaults.mark ?? 'dot',
    size: size ?? defaults.size ?? 'md',
  };

  const name = label ?? t(status);

  const rootProps: StatusIndicatorRootProps = keyedProps({
    ...nativeProps,
    /**
     * The mark is hidden rather than left to be ignored. It is a painted dot
     * or a glyph that is itself hidden, so nothing would be announced either
     * way — but a family whose whole subject is what a reader hears should
     * say which of its parts is not for them. The icon mark's glyph follows
     * the status; the stylesheet sizes and colours it and draws none of it.
     *
     * The label part is always rendered, even holding nothing but the clipped
     * word, so the two bindings and the harness write one shape rather than
     * three. The stylesheet takes the gap back when that is all it holds.
     */
    children: (
      <>
        <span aria-hidden="true" data-part="mark" data-part-mark="">
          {resolved.mark === 'icon' ? (
            <Icon>
              <Glyph name={STATUS_INDICATOR_GLYPHS[status]} />
            </Icon>
          ) : null}
        </span>
        <span data-part="label" data-part-label="">
          {children ?? (
            <span
              data-part="announcement"
              data-part-announcement=""
              data-ui="visually-hidden"
              data-ui-visually-hidden=""
            >
              {name}
            </span>
          )}
          {detail === undefined ? null : (
            <span data-part="detail" data-part-detail="">
              {detail}
            </span>
          )}
        </span>
      </>
    ),
    'data-mark': resolved.mark,
    'data-part': 'root',
    'data-pulse': pulse || undefined,
    'data-size': resolved.size,
    'data-status': status,
    'data-ui': 'status-indicator',
    /* An explicit role the consumer wrote is never replaced by an inferred one. */
    ...(role === undefined ? {} : { role }),
    ...(role === undefined && ROLE[resolved.live] !== undefined
      ? { role: ROLE[resolved.live] }
      : {}),
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
