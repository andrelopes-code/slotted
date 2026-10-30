import badgeTokens from '@slotted/styles/badge/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_BADGE_TOKENS = (badgeTokens as readonly string[]).map((name) => ({
  name,
  purpose: 'Theme-owned Badge decision',
}));

export const ANGULAR_BADGE_DOCS = {
  badge: {
    api: apiRows([
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'slBadge',
        'Which of the five semantic colors the badge speaks in',
      ],
      [
        'variant',
        "'solid' | 'soft' | 'outline'",
        'soft',
        'slBadge',
        'How that color is painted: filled, tinted, or an edge alone. All three draw the same tone edge',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slBadge',
        'Type and glyph come from the control scale, so a badge shrinks with density beside the controls it sits with',
      ],
      [
        'shape',
        "'pill' | 'square' | 'dot'",
        'pill',
        'slBadge',
        'A dot is the same badge, tone and hidden text, drawn without a value',
      ],
      [
        'count',
        'number',
        '—',
        'slBadge',
        'The number the badge shows, written before any projected content and formatted for the locale',
      ],
      [
        'max',
        'number | false',
        '99',
        'slBadge',
        'The largest count written in full; above it the badge shows the ceiling and a plus. false removes the ceiling',
      ],
      [
        'showZero',
        'boolean',
        'false',
        'slBadge',
        'Whether a count of nought is a value worth showing or an absence that takes the badge out of the page',
      ],
      [
        'locale',
        'string',
        '—',
        'slBadge',
        'BCP 47, for the digits of count. Falls back to the injected default, then to the runtime',
      ],
      [
        'start',
        'slBadgeStart',
        '—',
        'a projected element',
        'A glyph before the words; the directive gives the consumer’s own element the start part',
      ],
      ['end', 'slBadgeEnd', '—', 'a projected element', 'A glyph after the words'],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'slBadge',
        'Whether a change to this badge is announced, and how urgently',
      ],
      [
        'placement',
        "'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'",
        'top-end',
        'slBadgeAnchor',
        'Which corner of the host the badge sits on. Mirrors in a right-to-left document',
      ],
      [
        'overlap',
        "'rectangle' | 'circle'",
        'rectangle',
        'slBadgeAnchor',
        "The host's shape, which decides how far in from the corner the badge starts",
      ],
      [
        'offset',
        '{ x?: number; y?: number }',
        '{ x: 0, y: 0 }',
        'slBadgeAnchor',
        'Moves the badge off the computed corner, in pixels. x runs along the inline axis and mirrors with the document',
      ],
      [
        'exportAs',
        'slBadge | slBadgeStart | slBadgeEnd | slBadgeAnchor',
        '—',
        'every directive',
        'Reaches the instance from the template',
      ],
      [
        'provideBadgeDefaults',
        '{ tone, variant, size, shape, max, locale }',
        '—',
        'an injector',
        'Sets the defaults once for every badge under it; an explicit input still wins',
      ],
    ]),
    accessibility: [
      'There is no badge pattern in the WAI-ARIA Authoring Practices — the pattern index carries no entry — and there is no badge role. The applicable guidance is the status role in WAI-ARIA 1.2, and WCAG 2.2 1.4.1 Use of Color, 1.4.11 Non-text Contrast and 4.1.3 Status Messages.',
      'The directive adds no role. It is written on the element the page chose — a span in a sentence, a dd in a description list, an a that navigates — and what a badge means comes from where it sits.',
      'live is the announcement policy for a badge whose value changes: polite writes role="status", assertive writes role="alert". A role the consumer wrote on the host is read with HostAttributeToken first and never replaced.',
      'A dot says nothing a screen reader can read. Project the words beside it — a span slVisuallyHidden inside the badge — because color alone is not a signal. Inside a badge that element is out of flow, so it costs no space.',
      'The dot is the only badge whose whole meaning is a graphic, so its rim is --slotted-border-strong: the one border token the theme holds to 3:1 against the surface.',
      'slBadgeAnchor is written on the element already around the host and does not rewrite the host. The badge is read after it in document order. When the host is interactive and its name must carry the count, wire aria-describedby from the host to the badge’s id, or name the count in the host’s aria-label.',
      'A badge is not focusable and is never a command: it answers no hover and gives no press feedback. Written on an anchor it is focusable, and the family paints the ring for exactly that case.',
      'A count of nought takes the badge out of the page with display: none — no box, no layout, nothing in the accessibility tree. React returns nothing instead; a directive written on an element the consumer owns cannot un-write it.',
      'A badge is one line. A string too long for its container is clipped with an ellipsis rather than reflowed, and the clipping is visual only: text-overflow shortens nothing, so the whole value stays in the DOM, stays in the accessibility tree, and a page search still finds it. A value that routinely needs more room is a Tag, not a Badge.',
      'The count is formatted with Intl.NumberFormat, so a total reads 1.234 in de-DE and ١٬٢٣٤ in ar-EG. Provide locale through provideBadgeDefaults when the application server-renders counts above its grouping threshold.',
    ],
    snippets: [
      defineSnippet({
        id: 'badge-angular-status',
        language: 'angular',
        label: 'A status beside the thing it describes',
        source:
          '<h3 slHeading [level]="3">Invoice #4821 <span slBadge tone="warning">Pending</span></h3>',
      }),
      defineSnippet({
        id: 'badge-angular-count',
        language: 'angular',
        label: 'A count on the corner of a control',
        source:
          '<span slBadgeAnchor>\n  <button slIconButton type="button" aria-label="Notifications">\n    <ng-icon name="bell" />\n  </button>\n  <span slBadge tone="danger" variant="solid" size="sm" live="polite" [count]="unread()">\n    <span slVisuallyHidden>unread notifications</span>\n  </span>\n</span>',
      }),
      defineSnippet({
        id: 'badge-angular-described',
        language: 'angular',
        label: 'The count inside the host’s own description',
        source:
          '<span slBadgeAnchor>\n  <button type="button" aria-describedby="inbox-count">Inbox</button>\n  <span id="inbox-count" slBadge size="sm" tone="danger" variant="solid" [count]="4">\n    <span slVisuallyHidden>unread messages</span>\n  </span>\n</span>',
      }),
      defineSnippet({
        id: 'badge-angular-dot',
        language: 'angular',
        label: 'A dot, and the words it cannot say',
        source:
          '<div slInline align="center" [gap]="3">\n  <span slBadge shape="dot" tone="success" variant="solid">\n    <span slVisuallyHidden>Online</span>\n  </span>\n  <span slText>Deployed</span>\n</div>',
      }),
      defineSnippet({
        id: 'badge-angular-presence',
        language: 'angular',
        label: 'Presence on a round host',
        source:
          '<span slBadgeAnchor placement="bottom-end" overlap="circle">\n  <img class="avatar" alt="" [src]="member.photo" />\n  <span slBadge shape="dot" size="sm" tone="success" variant="solid">\n    <span slVisuallyHidden>Online</span>\n  </span>\n</span>',
      }),
      defineSnippet({
        id: 'badge-angular-link',
        language: 'angular',
        label: 'A badge that navigates',
        source: '<a slBadge tone="accent" variant="outline" href="/releases/4.2.0">v4.2.0</a>',
      }),
      defineSnippet({
        id: 'badge-angular-defaults',
        language: 'ts',
        label: 'One decision for every badge in the application',
        source:
          "import { provideBadgeDefaults } from '@slotted/angular/badge';\n\nbootstrapApplication(App, {\n  providers: [provideBadgeDefaults({ locale: 'pt-BR', max: 999, size: 'sm' })],\n});",
      }),
    ],
  },
} as const;
