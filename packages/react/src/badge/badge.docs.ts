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

export const REACT_BADGE_TOKENS = badgeTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Badge decision',
}));

export const REACT_BADGE_DOCS = {
  badge: {
    api: apiRows([
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'Badge',
        'Which of the five semantic colours the badge speaks in',
      ],
      [
        'variant',
        "'solid' | 'soft' | 'outline'",
        'soft',
        'Badge',
        'How that colour is painted: filled, tinted, or an edge alone. All three draw the same tone edge',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Badge',
        'Type and glyph come from the control scale, so a badge shrinks with density beside the controls it sits with',
      ],
      [
        'shape',
        "'pill' | 'square' | 'dot'",
        'pill',
        'Badge',
        'A dot is the same badge, tone and hidden text, drawn without a value',
      ],
      [
        'count',
        'number',
        '—',
        'Badge',
        'The number the badge shows, written before any children and formatted for the locale',
      ],
      [
        'max',
        'number | false',
        '99',
        'Badge',
        'The largest count written in full; above it the badge shows the ceiling and a plus. false removes the ceiling',
      ],
      [
        'showZero',
        'boolean',
        'false',
        'Badge',
        'Whether a count of nought is a value worth showing or an absence that removes the badge',
      ],
      [
        'locale',
        'string',
        '—',
        'Badge',
        'BCP 47, for the digits of count. Falls back to the provider, then to the runtime',
      ],
      [
        'start',
        'ReactNode',
        '—',
        'Badge',
        'A glyph before the words, wrapped in the start part, which sizes and centres it',
      ],
      ['end', 'ReactNode', '—', 'Badge', 'A glyph after the words, wrapped in the end part'],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'Badge',
        'Whether a change to this badge is announced, and how urgently',
      ],
      [
        'placement',
        "'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'",
        'top-end',
        'BadgeAnchor',
        'Which corner of the host the badge sits on. Mirrors in a right-to-left document',
      ],
      [
        'overlap',
        "'rectangle' | 'circle'",
        'rectangle',
        'BadgeAnchor',
        "The host's shape, which decides how far in from the corner the badge starts",
      ],
      [
        'offset',
        '{ x?: number; y?: number }',
        '{ x: 0, y: 0 }',
        'BadgeAnchor',
        'Moves the badge off the computed corner, in pixels. x runs along the inline axis and mirrors with the document',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Badge, BadgeAnchor',
        'Renders the wiring into another element — an anchor for a badge that navigates',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element; each part extends its own element’s props',
      ],
      [
        'BadgeDefaultsProvider',
        '{ tone, variant, size, shape, max, locale }',
        '—',
        'a subtree',
        'Sets the defaults once for every badge under it; an explicit prop still wins',
      ],
    ]),
    accessibility: [
      'There is no badge pattern in the WAI-ARIA Authoring Practices — the pattern index carries no entry — and there is no badge role. The applicable guidance is the status role in WAI-ARIA 1.2, and WCAG 2.2 1.4.1 Use of Color, 1.4.11 Non-text Contrast and 4.1.3 Status Messages.',
      'The root is a span with no role. What a badge means comes from where it sits, and a role invented here would be wrong more often than right.',
      'live is the announcement policy for a badge whose value changes: polite writes role="status", whose implicit aria-live and aria-atomic are what a changing count needs; assertive writes role="alert". It is off by default, because a page of twenty badges that all announce is a page no screen reader user can read.',
      'A dot says nothing a screen reader can read. Put the words beside it — a VisuallyHidden inside the badge — because colour alone is not a signal. Inside a badge that element is out of flow, so it costs no space and the gap reserves nothing for it.',
      'The dot is the only badge whose whole meaning is a graphic, so its rim is --slotted-border-strong: the one border token the theme holds to 3:1 against the surface. A pill or a square carries text, so its edge is decoration.',
      'BadgeAnchor wraps its host rather than rewriting it. The badge is read after the host in document order. When the host is interactive and its name must carry the count, either wire aria-describedby from the host to the badge’s own id, or name the count in the host’s aria-label — “Inbox, 4 unread messages”.',
      'A badge is not focusable and is never a command: it answers no hover and gives no press feedback. render can make the root an anchor, and the family paints the focus ring for exactly that case.',
      'Under forced colours every tone ground becomes one system colour, so the family draws its edge in currentColor there. It is the only rule the family writes for that mode.',
      'A count of nought removes the badge from the page entirely rather than leaving an empty circle, so nothing announces a value that is no longer there.',
      'A badge is one line. A string too long for its container is clipped with an ellipsis rather than reflowed, and the clipping is visual only: text-overflow shortens nothing, so the whole value stays in the DOM, stays in the accessibility tree, and a page search still finds it. A value that routinely needs more room is a Tag, not a Badge.',
      'The count is formatted with Intl.NumberFormat, so a total reads 1.234 in de-DE and ١٬٢٣٤ in ar-EG. Set locale on the provider when the application server-renders counts above its grouping threshold.',
    ],
    snippets: [
      defineSnippet({
        id: 'badge-react-status',
        language: 'tsx',
        label: 'A status beside the thing it describes',
        source:
          '<Heading level={3}>\n  Invoice #4821 <Badge tone="warning">Pending</Badge>\n</Heading>;',
      }),
      defineSnippet({
        id: 'badge-react-count',
        language: 'tsx',
        label: 'A count on the corner of a control',
        source:
          '<BadgeAnchor>\n  <IconButton aria-label="Notifications">\n    <BellIcon />\n  </IconButton>\n  <Badge tone="danger" variant="solid" size="sm" count={unread} live="polite">\n    <VisuallyHidden>unread notifications</VisuallyHidden>\n  </Badge>\n</BadgeAnchor>;',
      }),
      defineSnippet({
        id: 'badge-react-described',
        language: 'tsx',
        label: 'The count inside the host’s own description',
        source:
          'const id = useId();\n\n<BadgeAnchor>\n  <button aria-describedby={id} type="button">\n    Inbox\n  </button>\n  <Badge count={4} id={id} size="sm" tone="danger" variant="solid">\n    <VisuallyHidden>unread messages</VisuallyHidden>\n  </Badge>\n</BadgeAnchor>;',
      }),
      defineSnippet({
        id: 'badge-react-dot',
        language: 'tsx',
        label: 'A dot, and the words it cannot say',
        source:
          '<Inline align="center" gap={3}>\n  <Badge shape="dot" tone="success" variant="solid">\n    <VisuallyHidden>Online</VisuallyHidden>\n  </Badge>\n  <Text>Deployed</Text>\n</Inline>;',
      }),
      defineSnippet({
        id: 'badge-react-presence',
        language: 'tsx',
        label: 'Presence on a round host',
        source:
          '<BadgeAnchor overlap="circle" placement="bottom-end">\n  <Avatar name="André Lopes" />\n  <Badge shape="dot" size="sm" tone="success" variant="solid">\n    <VisuallyHidden>Online</VisuallyHidden>\n  </Badge>\n</BadgeAnchor>;',
      }),
      defineSnippet({
        id: 'badge-react-link',
        language: 'tsx',
        label: 'A badge that navigates',
        source:
          '<Badge render={(props) => <a {...props} href="/releases/4.2.0" />} tone="accent" variant="outline">\n  v4.2.0\n</Badge>;',
      }),
      defineSnippet({
        id: 'badge-react-defaults',
        language: 'tsx',
        label: 'One decision for every badge in the application',
        source:
          '<BadgeDefaultsProvider locale="pt-BR" max={999} size="sm">\n  <App />\n</BadgeDefaultsProvider>;',
      }),
    ],
  },
} as const;
