import avatarTokens from '@slotted/styles/avatar/tokens.json';
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

export const REACT_AVATAR_TOKENS = avatarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Avatar decision',
}));

export const REACT_AVATAR_DOCS = {
  avatar: {
    api: apiRows([
      [
        'name',
        'string',
        '—',
        'Avatar',
        'The person or entity. It is the accessible name in every status, the source of the initials, and the seed of the colour',
      ],
      [
        'src',
        'string',
        '—',
        'Avatar',
        'The picture. Absent, the avatar is its fallback and nothing is requested',
      ],
      [
        'initials',
        'string',
        '—',
        'Avatar',
        'The letters to draw, in place of the ones derived from the name',
      ],
      [
        'tone',
        "'auto' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'auto',
        'Avatar',
        'Which of the five semantic colours the fallback is painted in. auto derives it from the name',
      ],
      [
        'idFor',
        'string',
        '—',
        'Avatar',
        'A stable identifier to derive the colour from, when the name is not stable or two people share one',
      ],
      [
        'variant',
        "'soft' | 'solid'",
        'soft',
        'Avatar',
        'How that colour is painted: tinted, or filled',
      ],
      [
        'surface',
        "'tone' | 'none' | 'plate'",
        'tone',
        'Avatar',
        'The ground behind the avatar: the tone behind the fallback and nothing behind a loaded picture; nothing at all; or a light plate in every scheme, for a logo made for a white ground (--slotted-avatar-plate-surface)',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'Avatar',
        'Five steps, each of which answers density. --slotted-avatar-size states a size no step holds',
      ],
      [
        'shape',
        "'circle' | 'square'",
        'circle',
        'Avatar',
        'A circle is a person; a square is a team, an organisation or a bot',
      ],
      [
        'status',
        "'idle' | 'loading' | 'loaded' | 'error'",
        '—',
        'Avatar',
        'Where the picture is. Supplied, it wins over what the family derives from the element',
      ],
      [
        'onStatusChange',
        '(status) => void',
        '—',
        'Avatar',
        'Reports the derived status. Never called for a status passed in',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Avatar',
        'A deactivated account, or an avatar inside a control the page has turned off',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'Avatar',
        'Takes the avatar out of the accessibility tree, for one beside the name it belongs to',
      ],
      [
        'locale',
        'string',
        '—',
        'Avatar',
        'BCP 47, for the case of the initials. Falls back to the provider, then to the runtime',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'Avatar',
        'Content for the fallback, in place of the initials and the glyph — a logo, an Icon',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Avatar',
        'Renders the wiring into another element — an anchor for an avatar that opens a profile',
      ],
      [
        'renderImage',
        '(props) => ReactNode',
        '—',
        'Avatar',
        'Renders the picture into the consumer’s own element — a Next.js Image — while the family keeps reporting the load',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'Avatar',
        'Reaches the native element; the props type is the element’s own, extended',
      ],
      [
        'AvatarDefaultsProvider',
        '{ size, shape, tone, variant, locale }',
        '—',
        'a subtree',
        'Sets the defaults once for every avatar under it; an explicit prop still wins',
      ],
    ]),
    accessibility: [
      'There is no avatar pattern in the WAI-ARIA Authoring Practices — the pattern index carries no entry, and the string does not occur on the page. The applicable guidance is the platform’s own: the img element and the img role in WAI-ARIA 1.2, the W3C WAI alt decision tree, and WCAG 2.2 1.1.1 Non-text Content, 1.4.11 Non-text Contrast and 2.5.8 Target Size (Minimum).',
      'The name is on the root, as aria-label with role="img", and the picture takes an empty alt. The avatar therefore announces the same thing in all four statuses: every surveyed implementation names the image instead, which makes the same avatar “Ada Lovelace” once the photograph loads and “AL” before it.',
      'An avatar with no name is aria-hidden, which is the rule Icon already takes: a name present decides role="img", an absent one decides that there is nothing to announce.',
      'decorative is the third case — a name that is written beside the avatar, where announcing it would read the person twice. The name still drives the initials and the colour.',
      'The colour derived from a name is an aid to scanning a list, never the identifier: five tones mean collisions are certain, and colour alone is not a signal. The name is what identifies the person, and it is present in every state.',
      'An avatar is not focusable and not a command. render can make the root an anchor or a button, and the family paints the focus ring and the hover edge for exactly that case — and holds both back when the avatar is disabled.',
      'An interactive avatar smaller than 24 by 24 CSS pixels grows a centred overlay to --slotted-target-min, so WCAG 2.2 2.5.8 is met at the two tighter densities without changing any layout. Inside a stack the overlay can reach under a neighbour; the raised member wins the pointer.',
      'The fallback glyph is the person Glyph in an aria-hidden Icon, not a character: no font can be relied on to carry a silhouette, and a character would be read out.',
      'Under forced colours the family draws its edge in currentColor, because the theme maps every tone ground to one system colour. The photograph is left alone: a portrait reduced to two system colours is not a portrait.',
      'The picture crosses over the initials on --slotted-duration-short, which prefers-reduced-motion collapses to 1ms in the theme. Nothing here loops.',
    ],
    snippets: [
      defineSnippet({
        id: 'avatar-react-name',
        language: 'tsx',
        label: 'A name is enough',
        source: '<Avatar name="Ada Lovelace" />;',
      }),
      defineSnippet({
        id: 'avatar-react-picture',
        language: 'tsx',
        label: 'A picture, and the initials until it arrives',
        source: '<Avatar name="Ada Lovelace" src={person.photograph} />;',
      }),
      defineSnippet({
        id: 'avatar-react-decorative',
        language: 'tsx',
        label: 'Beside the name it belongs to',
        source:
          '<Inline align="center" gap={3}>\n  <Avatar decorative name={person.name} src={person.photograph} />\n  <Stack gap={1}>\n    <Text weight="medium">{person.name}</Text>\n    <Text tone="muted">{person.role}</Text>\n  </Stack>\n</Inline>;',
      }),
      defineSnippet({
        id: 'avatar-react-presence',
        language: 'tsx',
        label: 'Presence, composed with Badge',
        source:
          '<BadgeAnchor overlap="circle" placement="bottom-end">\n  <Avatar name="Ada Lovelace" src={person.photograph} />\n  <Badge shape="dot" size="sm" tone="success" variant="solid">\n    <VisuallyHidden>Online</VisuallyHidden>\n  </Badge>\n</BadgeAnchor>;',
      }),
      defineSnippet({
        id: 'avatar-react-link',
        language: 'tsx',
        label: 'An avatar that opens a profile',
        source:
          '<Avatar\n  name="Ada Lovelace"\n  render={(props) => <a {...props} href={`/people/${person.id}`} />}\n  src={person.photograph}\n/>;',
      }),
      defineSnippet({
        id: 'avatar-react-next-image',
        language: 'tsx',
        label: 'The picture in the consumer’s own element',
        source:
          '<Avatar\n  name="Ada Lovelace"\n  renderImage={(props) => <Image {...props} height={64} width={64} />}\n  src={person.photograph}\n/>;',
      }),
      defineSnippet({
        id: 'avatar-react-organisation',
        language: 'tsx',
        label: 'A square avatar, and a mark of its own',
        source:
          '<Avatar name="Acme Inc" shape="square" tone="accent" variant="solid">\n  <Icon>\n    <AcmeMark />\n  </Icon>\n</Avatar>;',
      }),
      defineSnippet({
        id: 'avatar-react-defaults',
        language: 'tsx',
        label: 'One decision for every avatar in the application',
        source:
          '<AvatarDefaultsProvider locale="pt-BR" size="sm">\n  <App />\n</AvatarDefaultsProvider>;',
      }),
    ],
  },
} as const;
