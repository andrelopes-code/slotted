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
        'The semantic color of the badge. Six tones are available.',
      ],
      [
        'variant',
        "'solid' | 'soft' | 'outline'",
        'soft',
        'Badge',
        'How the tone is painted: filled, tinted or as an edge alone. All three variants draw the tone edge.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Badge',
        'Type and glyph size follow the control scale, so a badge shrinks with the density of the controls beside it.',
      ],
      [
        'shape',
        "'pill' | 'square' | 'dot'",
        'pill',
        'Badge',
        'A dot draws no count. Its children are its only content, so the words of a dot go in a visually hidden element.',
      ],
      [
        'count',
        'number',
        '—',
        'Badge',
        'The number the badge shows, written before any children and formatted for the locale.',
      ],
      [
        'max',
        'number | false',
        '99',
        'Badge',
        'The largest count written in full. Above it the badge shows the ceiling and a plus sign. false removes the ceiling.',
      ],
      [
        'showZero',
        'boolean',
        'false',
        'Badge',
        'Whether a count of zero is shown. When false, a count of zero removes the badge.',
      ],
      [
        'locale',
        'string',
        '—',
        'Badge',
        'BCP 47 tag for the digits of count. Falls back to the provider, then to the runtime.',
      ],
      [
        'start',
        'ReactNode',
        '—',
        'Badge',
        'A glyph before the label, wrapped in the start part, which sizes and centers it.',
      ],
      ['end', 'ReactNode', '—', 'Badge', 'A glyph after the label, wrapped in the end part.'],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'Badge',
        'Announcement policy for a change to the badge: off, polite (role status) or assertive (role alert).',
      ],
      [
        'placement',
        "'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'",
        'top-end',
        'BadgeAnchor',
        'The corner of the host the badge sits on. Start and end mirror in a right-to-left document.',
      ],
      [
        'overlap',
        "'rectangle' | 'circle'",
        'rectangle',
        'BadgeAnchor',
        'The shape of the host, which sets how far in from the corner the badge starts.',
      ],
      [
        'offset',
        '{ x?: number; y?: number }',
        '{ x: 0, y: 0 }',
        'BadgeAnchor',
        'Moves the badge off the computed corner, in pixels. x runs along the inline axis and mirrors with the document.',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Badge, BadgeAnchor',
        'Renders the root through another element, such as an anchor for a badge that navigates.',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element. Each part extends the props of its own element.',
      ],
      [
        'BadgeDefaultsProvider',
        '{ tone, variant, size, shape, max, locale }',
        '—',
        'a subtree',
        'Sets the defaults once for every badge under it. An explicit prop wins.',
      ],
    ]),
    accessibility: [
      'There is no badge pattern in the WAI-ARIA Authoring Practices — the pattern index carries no entry — and there is no badge role. The applicable guidance is the status role in WAI-ARIA 1.2, and WCAG 2.2 1.4.1 Use of Color, 1.4.11 Non-text Contrast and 4.1.3 Status Messages.',
      'The root is a span with no role. What a badge means comes from where it sits.',
      'live is the announcement policy for a badge whose value changes: polite writes role="status", whose implicit aria-live and aria-atomic are what a changing count needs; assertive writes role="alert". The default is off, so that only the badges the page marks announce.',
      'A dot has no text for a screen reader to read. Put the words beside it — a VisuallyHidden inside the badge — because color alone is not a signal. Inside a badge that element is out of flow, so it takes no space and the gap reserves nothing for it.',
      'The dot is the only badge whose whole meaning is a graphic, so its rim is --slotted-border-strong: the one border token the theme holds to 3:1 against the surface. A pill or a square carries text, so its edge is decoration.',
      'BadgeAnchor wraps its host rather than rewriting it. The badge is read after the host in document order. When the host is interactive and its name must carry the count, either wire aria-describedby from the host to the badge’s own id, or name the count in the host’s aria-label — “Inbox, 4 unread messages”.',
      'A badge is not focusable and is never a command: it answers no hover and gives no press feedback. render can make the root an anchor, and Badge paints the focus ring for that case.',
      'Under forced colors every tone ground becomes one system color, so Badge draws its edge in currentColor there. It is the only rule Badge writes for that mode.',
      'A count of zero removes the badge from the page entirely rather than leaving an empty circle, so nothing announces a value that is no longer there.',
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
