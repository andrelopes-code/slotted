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
        'The person or entity. It is the accessible name in every status, the source of the initials, and the seed of the color',
      ],
      [
        'src',
        'string',
        '—',
        'slAvatar',
        'The picture the component renders itself. Project an img slAvatarImage instead when the element must be yours',
      ],
      [
        'initials',
        'string',
        '—',
        'slAvatar',
        'The letters to draw, in place of the ones derived from the name',
      ],
      [
        'tone',
        "'auto' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'auto',
        'slAvatar',
        'Which of the five semantic colors the fallback is painted in. auto derives it from the name',
      ],
      [
        'idFor',
        'string',
        '—',
        'slAvatar',
        'A stable identifier to derive the color from, when the name is not stable or two people share one',
      ],
      [
        'variant',
        "'soft' | 'solid'",
        'soft',
        'slAvatar',
        'How that color is painted: tinted, or filled',
      ],
      [
        'surface',
        "'tone' | 'none' | 'plate'",
        'tone',
        'slAvatar',
        'The ground behind the avatar: the tone behind the fallback and nothing behind a loaded picture; nothing at all; or a light plate in every scheme, for a logo made for a white ground (--slotted-avatar-plate-surface)',
      ],
      [
        'size',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'slAvatar',
        'Five steps, each of which answers density. --slotted-avatar-size states a size no step holds',
      ],
      [
        'shape',
        "'circle' | 'square'",
        'circle',
        'slAvatar',
        'A circle is a person; a square is a team, an organization or a bot',
      ],
      [
        'status',
        "'idle' | 'loading' | 'loaded' | 'error'",
        '—',
        'slAvatar',
        'Where the picture is. Supplied, it wins over what the component derives from the element',
      ],
      [
        'statusChange',
        'output<AvatarStatus>',
        '—',
        'slAvatar',
        'Reports the derived status. Never emits for a status passed in',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slAvatar',
        'A deactivated account, or an avatar inside a control the page has turned off',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'slAvatar',
        'Takes the avatar out of the accessibility tree, for one beside the name it belongs to',
      ],
      [
        'locale',
        'string',
        '—',
        'slAvatar',
        'BCP 47, for the case of the initials. Falls back to the injected defaults, then to the runtime',
      ],
      [
        'slAvatarImage',
        'directive',
        '—',
        'img',
        'The consumer’s own img, so ngSrc and NgOptimizedImage reach it. Reports its own load and error',
      ],
      [
        'slAvatarFallback',
        'directive',
        '—',
        'projected content',
        'Content that stands in for the picture, in place of the initials and the glyph',
      ],
      [
        'provideAvatarDefaults',
        '{ size, shape, tone, variant, locale }',
        '—',
        'an injector',
        'Sets the defaults once for every avatar under it; an explicit input still wins',
      ],
      [
        'exportAs',
        "'slAvatar'",
        '—',
        'slAvatar',
        'Reaches the component instance from the template',
      ],
    ]),
    accessibility: [
      'There is no avatar pattern in the WAI-ARIA Authoring Practices — the pattern index carries no entry, and the string does not occur on the page. The applicable guidance is the platform’s own: the img element and the img role in WAI-ARIA 1.2, the W3C WAI alt decision tree, and WCAG 2.2 1.1.1 Non-text Content, 1.4.11 Non-text Contrast and 2.5.8 Target Size (Minimum).',
      'The name is on the root, as aria-label with role="img", and the picture takes an empty alt. The avatar therefore announces the same thing in all four statuses. An alt the consumer wrote on a projected img is read with HostAttributeToken and kept.',
      'An avatar with no name is aria-hidden, which is the rule Icon already takes. decorative is the third case — a name written beside the avatar, where announcing it would read the person twice.',
      'A role the consumer wrote on the host element is read before the host binding writes one, so an avatar that is also a menu trigger keeps the role its page chose.',
      'The color derived from a name is an aid to scanning a list, never the identifier: five tones mean collisions are certain, and color alone is not a signal.',
      'The component is written on the element the page chose, so an a or a button is an avatar with the platform’s own keyboard behavior. The family paints the focus ring and the hover edge only on an element the browser treats as interactive, and holds both back when it is disabled.',
      'An interactive avatar smaller than 24 by 24 CSS pixels grows a centerd overlay to --slotted-target-min, so WCAG 2.2 2.5.8 is met at the two tighter densities without changing any layout.',
      'The fallback glyph is the person slGlyph in an aria-hidden slIcon, not a character. Under forced colors the family draws its edge in currentColor and leaves the photograph alone.',
      'The picture crosses over the initials on --slotted-duration-short, which prefers-reduced-motion collapses to 1ms in the theme. Nothing here loops.',
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
