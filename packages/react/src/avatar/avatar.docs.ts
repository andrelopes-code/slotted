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
        'The person or entity. It is the accessible name in every status, the source of the initials and the seed of the color.',
      ],
      [
        'src',
        'string',
        '—',
        'Avatar',
        'The picture. When absent, the avatar draws its fallback and requests nothing.',
      ],
      [
        'initials',
        'string',
        '—',
        'Avatar',
        'The letters to draw in place of those derived from the name. The box holds two letters, and xs holds one.',
      ],
      [
        'tone',
        "'auto' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'auto',
        'Avatar',
        'The semantic color of the fallback. auto derives one of accent, secondary, success, warning or danger from the name; info applies only when set.',
      ],
      [
        'idFor',
        'string',
        '—',
        'Avatar',
        'A stable identifier to derive the color from, for a name that is not stable or that two people share. Defaults to name.',
      ],
      [
        'variant',
        "'soft' | 'solid'",
        'soft',
        'Avatar',
        'How the color is painted: soft is tinted, solid is filled.',
      ],
      [
        'surface',
        "'tone' | 'none' | 'plate'",
        'tone',
        'Avatar',
        'The ground behind the avatar. tone paints the tone behind the fallback and nothing behind a loaded picture, none paints nothing, and plate paints a light plate in every color scheme, for a logo made for a white ground (--slotted-avatar-plate-surface).',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'Avatar',
        'One of five steps. --slotted-avatar-size sets a size that no step holds.',
      ],
      [
        'shape',
        "'circle' | 'square'",
        'circle',
        'Avatar',
        'circle is for a person; square is for a team, an organization or a bot.',
      ],
      [
        'status',
        "'idle' | 'loading' | 'loaded' | 'error'",
        '—',
        'Avatar',
        'Where the picture is. A supplied value wins over the status derived from the img element.',
      ],
      [
        'onStatusChange',
        '(status) => void',
        '—',
        'Avatar',
        'Called with the derived status when the picture loads or fails. Not called for a status passed in.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Avatar',
        'Marks a deactivated account, or an avatar inside a control that the page has turned off.',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'Avatar',
        'Removes the avatar from the accessibility tree, for an avatar beside the name it belongs to.',
      ],
      [
        'locale',
        'string',
        '—',
        'Avatar',
        'BCP 47 tag that sets the case of the initials. Falls back to the defaults provider, then to the runtime locale.',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'Avatar',
        'Content for the fallback in place of the initials and the glyph, such as a logo or an Icon.',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Avatar',
        'Renders the avatar into another element, such as an anchor for an avatar that opens a profile.',
      ],
      [
        'renderImage',
        '(props) => ReactNode',
        '—',
        'Avatar',
        'Renders the picture into the consumer’s own element, such as a Next.js Image, while the avatar keeps reporting the load.',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'Avatar',
        'Reaches the native element. The props type is the element’s own, extended.',
      ],
      [
        'AvatarDefaultsProvider',
        '{ size, shape, tone, variant, locale }',
        '—',
        'a subtree',
        'Sets the defaults for every avatar under it. An explicit prop wins.',
      ],
    ]),
    accessibility: [
      'The WAI-ARIA Authoring Practices have no avatar pattern. The guidance applied is the img role in WAI-ARIA 1.2, the W3C WAI alt decision tree, and WCAG 2.2 success criteria 1.1.1 Non-text Content, 1.4.11 Non-text Contrast and 2.5.8 Target Size (Minimum).',
      'The name is on the root as aria-label with role="img", and the picture takes an empty alt. The avatar announces the same name in all four statuses; naming the image instead would announce the initials before the photograph loads and the name after.',
      'An avatar with no name is aria-hidden, the rule that Icon takes. A present name sets role="img"; an absent name leaves nothing to announce.',
      'decorative covers a name written beside the avatar, where announcing it would read the person twice. The name still drives the initials and the color.',
      'The color derived from a name is an aid to scanning a list, not an identifier. The palette holds five colors, so collisions occur, and color alone is not a signal. The name identifies the person and is present in every status.',
      'An avatar is not focusable and not a command. render can make the root an anchor or a button; the avatar then draws the focus ring and the hover edge, and withholds both when disabled. The element that render returns keeps its own role and takes the name as aria-label; a generic element returned there passes role="img".',
      'An interactive avatar smaller than 24 by 24 CSS pixels grows a centered overlay to --slotted-target-min, which meets WCAG 2.2 2.5.8 at the two tighter densities without changing the layout. Inside a stack the overlay can reach under a neighbor; the raised member receives the pointer.',
      'The fallback glyph is the person Glyph in an aria-hidden Icon, not a character: no font reliably carries a silhouette, and a character would be read aloud.',
      'Under forced colors the avatar draws its edge in currentColor, because the theme maps every tone ground to one system color. The photograph is left unchanged.',
      'The picture crosses over the initials in --slotted-duration-short, which prefers-reduced-motion reduces to 1ms in the theme. Nothing loops.',
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
        id: 'avatar-react-organization',
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
