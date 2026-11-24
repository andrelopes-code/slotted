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

export const ANGULAR_AVATAR_TOKENS = avatarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Avatar decision',
}));

export const ANGULAR_AVATAR_DOCS = {
  avatar: {
    api: apiRows([
      [
        'name',
        'string',
        '—',
        'slAvatar',
        'The person or entity. It is the accessible name in every status, the source of the initials and the seed of the color.',
      ],
      [
        'src',
        'string',
        '—',
        'slAvatar',
        'The picture the component renders itself. Project an img with slAvatarImage instead when the element must be the consumer’s own.',
      ],
      [
        'initials',
        'string',
        '—',
        'slAvatar',
        'The letters to draw in place of those derived from the name. The box holds two letters, and xs holds one.',
      ],
      [
        'tone',
        "'auto' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'auto',
        'slAvatar',
        'The semantic color of the fallback. auto derives one of accent, secondary, success, warning or danger from the name; info applies only when set.',
      ],
      [
        'idFor',
        'string',
        '—',
        'slAvatar',
        'A stable identifier to derive the color from, for a name that is not stable or that two people share. Defaults to name.',
      ],
      [
        'variant',
        "'soft' | 'solid'",
        'soft',
        'slAvatar',
        'How the color is painted: soft is tinted, solid is filled.',
      ],
      [
        'surface',
        "'tone' | 'none' | 'plate'",
        'tone',
        'slAvatar',
        'The ground behind the avatar. tone paints the tone behind the fallback and nothing behind a loaded picture, none paints nothing, and plate paints a light plate in every color scheme, for a logo made for a white ground (--slotted-avatar-plate-surface).',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'slAvatar',
        'One of five steps. --slotted-avatar-size sets a size that no step holds.',
      ],
      [
        'shape',
        "'circle' | 'square'",
        'circle',
        'slAvatar',
        'circle is for a person; square is for a team, an organization or a bot.',
      ],
      [
        'status',
        "'idle' | 'loading' | 'loaded' | 'error'",
        '—',
        'slAvatar',
        'Where the picture is. A supplied value wins over the status derived from the img element.',
      ],
      [
        'statusChange',
        'output<AvatarStatus>',
        '—',
        'slAvatar',
        'Emits the derived status when the picture loads or fails. Does not emit for a status passed in.',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slAvatar',
        'Marks a deactivated account, or an avatar inside a control that the page has turned off.',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'slAvatar',
        'Removes the avatar from the accessibility tree, for an avatar beside the name it belongs to.',
      ],
      [
        'locale',
        'string',
        '—',
        'slAvatar',
        'BCP 47 tag that sets the case of the initials. Falls back to the injected defaults, then to the runtime locale.',
      ],
      [
        'slAvatarImage',
        'directive',
        '—',
        'img',
        'The consumer’s own img, so that ngSrc and NgOptimizedImage reach it. It reports its own load and error.',
      ],
      [
        'slAvatarFallback',
        'directive',
        '—',
        'projected content',
        'Content that stands in for the picture, in place of the initials and the glyph.',
      ],
      [
        'provideAvatarDefaults',
        '{ size, shape, tone, variant, locale }',
        '—',
        'an injector',
        'Sets the defaults for every avatar under the injector. An explicit input wins.',
      ],
      [
        'exportAs',
        "'slAvatar'",
        '—',
        'slAvatar',
        'Reaches the component instance from the template.',
      ],
    ]),
    accessibility: [
      'The WAI-ARIA Authoring Practices have no avatar pattern. The guidance applied is the img role in WAI-ARIA 1.2, the W3C WAI alt decision tree, and WCAG 2.2 success criteria 1.1.1 Non-text Content, 1.4.11 Non-text Contrast and 2.5.8 Target Size (Minimum).',
      'The name is on the root as aria-label with role="img", and the picture takes an empty alt. The avatar announces the same name in all four statuses; naming the image instead would announce the initials before the photograph loads and the name after.',
      'An avatar with no name is aria-hidden, the rule that Icon takes. decorative covers a name written beside the avatar, where announcing it would read the person twice.',
      'A role written on the host element is read before the host binding writes one, so an avatar that is also a menu trigger keeps the role its page chose. On an a or a button the avatar writes no role, so the element keeps its own and takes the name as aria-label.',
      'The color derived from a name is an aid to scanning a list, not an identifier. The palette holds five colors, so collisions occur, and color alone is not a signal.',
      'The component is written on the element the page chose, so an a or a button is an avatar with the platform’s own keyboard behavior. The avatar draws the focus ring and the hover edge only on an element the browser treats as interactive, and withholds both when disabled.',
      'An interactive avatar smaller than 24 by 24 CSS pixels grows a centered overlay to --slotted-target-min, which meets WCAG 2.2 2.5.8 at the two tighter densities without changing the layout.',
      'The fallback glyph is the person slGlyph in an aria-hidden slIcon, not a character. An alt that the consumer wrote on a projected img is read with HostAttributeToken and kept.',
      'Under forced colors the avatar draws its edge in currentColor, because the theme maps every tone ground to one system color. The photograph is left unchanged.',
      'The picture crosses over the initials in --slotted-duration-short, which prefers-reduced-motion reduces to 1ms in the theme. Nothing loops.',
    ],
    snippets: [
      defineSnippet({
        id: 'avatar-angular-name',
        language: 'angular',
        label: 'A name is enough',
        source: '<span slAvatar name="Ada Lovelace"></span>',
      }),
      defineSnippet({
        id: 'avatar-angular-picture',
        language: 'angular',
        label: 'A picture, and the initials until it arrives',
        source: '<span slAvatar [name]="person.name" [src]="person.photograph"></span>',
      }),
      defineSnippet({
        id: 'avatar-angular-optimized-image',
        language: 'angular',
        label: 'The consumer’s own img, so NgOptimizedImage can reach it',
        source:
          '<span slAvatar [name]="person.name">\n  <img slAvatarImage [ngSrc]="person.photograph" width="64" height="64" />\n</span>',
      }),
      defineSnippet({
        id: 'avatar-angular-decorative',
        language: 'angular',
        label: 'Beside the name it belongs to',
        source:
          '<div slInline align="center" [gap]="3">\n  <span slAvatar decorative [name]="person.name" [src]="person.photograph"></span>\n  <div slStack [gap]="1">\n    <span slText weight="medium">{{ person.name }}</span>\n    <span slText tone="muted">{{ person.role }}</span>\n  </div>\n</div>',
      }),
      defineSnippet({
        id: 'avatar-angular-presence',
        language: 'angular',
        label: 'Presence, composed with Badge',
        source:
          '<span slBadgeAnchor overlap="circle" placement="bottom-end">\n  <span slAvatar [name]="person.name" [src]="person.photograph"></span>\n  <span slBadge shape="dot" size="sm" tone="success" variant="solid">\n    <span slVisuallyHidden>Online</span>\n  </span>\n</span>',
      }),
      defineSnippet({
        id: 'avatar-angular-link',
        language: 'angular',
        label: 'An avatar that opens a profile',
        source:
          '<a\n  slAvatar\n  [name]="person.name"\n  [src]="person.photograph"\n  [routerLink]="[\'/people\', person.id]"\n></a>',
      }),
      defineSnippet({
        id: 'avatar-angular-organization',
        language: 'angular',
        label: 'A square avatar, and a mark of its own',
        source:
          '<span slAvatar name="Acme Inc" shape="square" tone="accent" variant="solid">\n  <span slIcon slAvatarFallback>\n    <svg viewBox="0 0 24 24"><path d="M4 20 12 4l8 16Z" /></svg>\n  </span>\n</span>',
      }),
      defineSnippet({
        id: 'avatar-angular-defaults',
        language: 'ts',
        label: 'One decision for every avatar in the application',
        source:
          "bootstrapApplication(App, {\n  providers: [provideAvatarDefaults({ locale: 'pt-BR', size: 'sm' })],\n});",
      }),
    ],
  },
} as const;
