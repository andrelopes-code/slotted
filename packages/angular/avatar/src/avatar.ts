import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  linkedSignal,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { initialsFrom, toneFrom } from '@slotted/core/identity';

import {
  injectAvatarDefaults,
  type AvatarResolvedTone,
  type AvatarShape,
  type AvatarSize,
  type AvatarStatus,
  type AvatarTone,
  type AvatarSurface,
  type AvatarVariant,
} from './avatar-defaults';
import { SlAvatarFallback } from './avatar-fallback';
import { AVATAR_IMAGE_HOST } from './avatar-image-host';
import { SlAvatarImage } from './avatar-image';

export type {
  AvatarDefaults,
  AvatarGroupLayout,
  AvatarResolvedTone,
  AvatarShape,
  AvatarSize,
  AvatarStatus,
  AvatarTone,
  AvatarSurface,
  AvatarVariant,
} from './avatar-defaults';

/**
 * The palette `tone="auto"` chooses from, in the order the hash indexes it.
 * Five is a small palette and collisions are frequent by construction: the
 * colour is an aid to scanning a list of faces, and the name is what identifies
 * the person — which is why it is on the root in every one of the four
 * statuses.
 */
const AUTO_TONES: readonly AvatarResolvedTone[] = [
  'accent',
  'secondary',
  'success',
  'warning',
  'danger',
];

/** At the smallest step there is room for one letter, which is Fluent's rule at 16 pixels. */
const INITIALS_MAX: Record<AvatarSize, number> = { xs: 1, sm: 2, md: 2, lg: 2, xl: 2 };

/**
 * A picture of a person or an entity, and what stands in when there is none:
 * the initials taken from the name, then a glyph the family owns. A request
 * that fails never paints the browser's torn-page mark, because the picture is
 * out of sight until it reports that it arrived.
 *
 * The component is written on the element the page chose, so a `span` in a
 * table cell, an `a` that opens a profile and a `button` that opens a menu are
 * all the same avatar.
 *
 * The name lives on the root and the picture takes an empty `alt`, so the
 * avatar announces the same thing before and after the photograph loads. Every
 * surveyed implementation names the image instead, which makes the same avatar
 * “Ada Lovelace” once the picture arrives and “AL” before it.
 *
 * `status` is an input with an output beside it rather than a `model()`. A
 * `model()` promises a two-way binding for a value the browser owns: the
 * component would write over whatever the consumer passed the first time an
 * image loaded. Here the consumer's value simply wins, and the output reports
 * the derivation — a load event is a fact rather than a request, so there is
 * nothing to cancel and no reason from the closed vocabulary that fits it.
 */
@Component({
  selector: '[slAvatar]',
  standalone: true,
  exportAs: 'slAvatar',
  imports: [SlAvatarImage, SlGlyph, SlIcon],
  providers: [
    /* The component is its own image host, and a decorator is evaluated before
       the class it decorates exists. */
    { provide: AVATAR_IMAGE_HOST, useExisting: forwardRef(() => SlAvatar) },
  ],
  template: `@if (src(); as source) {
      <img slAvatarImage [src]="source" />
    }
    <ng-content select="img"></ng-content
    ><span data-part="fallback" data-part-fallback="">
      @if (custom() === undefined) {
        <!-- No picture and no name to take initials from: the person glyph. -->
        @if (initials() === '') {
          <span slIcon><svg slGlyph name="person"></svg></span>
        } @else {
          {{ initials() }}
        }
      }
      <ng-content select="[slAvatarFallback]"></ng-content
    ></span>`,
  styleUrl: '../../../styles/src/avatar/avatar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'avatar',
    'data-ui-avatar': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-surface]': 'surface()',
    '[attr.data-status]': 'resolvedStatus()',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-hidden]': 'ariaHidden()',
  },
})
export class SlAvatar {
  /**
   * The person or entity this is a picture of. It is the accessible name in
   * every status, the source of the initials, and the seed of the colour.
   */
  readonly name = input<string | undefined>(undefined);
  /** The picture. Absent, the avatar is its fallback and nothing is requested. */
  readonly src = input<string | undefined>(undefined);
  /**
   * The letters to draw, in place of the ones derived from the name. Two
   * graphemes at most is what the box holds; `xs` draws one.
   */
  readonly initialsOverride = input<string | undefined>(undefined, { alias: 'initials' });
  /**
   * A stable identifier to derive the colour from, when the name is not stable
   * or two people share one. Defaults to `name`.
   */
  readonly idFor = input<string | undefined>(undefined);
  /** BCP 47, for the case of the initials. Defaults to the provider, then to the runtime. */
  readonly locale = input<string | undefined>(undefined);
  /** Defaults to the provider, then to `md`. */
  readonly size = input<AvatarSize | undefined>(undefined);
  /** Defaults to the provider, then to `circle`. */
  readonly shape = input<AvatarShape | undefined>(undefined);
  /** Defaults to the provider, then to `auto`, which derives it from the name. */
  readonly tone = input<AvatarTone | undefined>(undefined);
  /** Defaults to the provider, then to `soft`. */
  readonly variant = input<AvatarVariant | undefined>(undefined);
  /** The ground behind the avatar; `tone` by default. */
  readonly surface = input<AvatarSurface>('tone');
  /** A deactivated account, or an avatar inside a control the page has turned off. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Takes the avatar out of the accessibility tree. For an avatar beside the
   * name it belongs to, where announcing it would read the person twice.
   */
  readonly decorative = input(false, { transform: booleanAttribute });
  /**
   * Where the picture is. Supplied, it wins over what the component derives
   * from the element — for a server that already knows, or a loader the family
   * cannot see.
   */
  readonly status = input<AvatarStatus | undefined>(undefined);

  /** Reports the derived status. Never emits for a status passed in. */
  readonly statusChange = output<AvatarStatus>();

  private readonly defaults = injectAvatarDefaults();
  /** An explicit role the consumer wrote is never replaced by an inferred one. */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly custom = contentChild(SlAvatarFallback);
  private readonly projected = contentChild(SlAvatarImage);

  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedShape = computed(() => this.shape() ?? this.defaults.shape);
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  private readonly resolvedLocale = computed(() => this.locale() ?? this.defaults.locale);

  /**
   * The derivation, and the picture it belongs to. A new request makes the
   * previous answer describe nothing, so the status starts again from what the
   * props alone can say — which is also what a server render and the hydration
   * after it both compute, so nothing flashes between them.
   */
  private readonly derived = linkedSignal<string, AvatarStatus>({
    source: () => `${this.src() ?? ''}|${this.projected() === undefined ? '' : 'projected'}`,
    computation: (request) => (request === '|' ? 'idle' : 'loading'),
  });

  protected readonly resolvedStatus = computed(() => this.status() ?? this.derived());

  protected readonly resolvedTone = computed<AvatarResolvedTone>(() => {
    const tone = this.tone() ?? this.defaults.tone;
    if (tone !== 'auto') return tone;
    return toneFrom({ seed: this.idFor() ?? this.name(), tones: AUTO_TONES }) ?? 'secondary';
  });

  protected readonly initials = computed(
    () =>
      this.initialsOverride() ??
      initialsFrom({
        name: this.name(),
        max: INITIALS_MAX[this.resolvedSize()],
        locale: this.resolvedLocale(),
      }),
  );

  /**
   * The W3C `alt` decision tree, in this library's vocabulary and with the rule
   * `icon` already took: a name present decides `role="img"`, an absent one
   * decides `aria-hidden`. `decorative` is the third case — a name that is
   * written beside the avatar, where announcing it reads the person twice.
   */
  private readonly silent = computed(() => {
    const name = this.name();
    return this.decorative() || name === undefined || name.trim() === '';
  });

  protected readonly role = computed(() => this.writtenRole ?? (this.silent() ? null : 'img'));
  protected readonly ariaLabel = computed(() => (this.silent() ? null : (this.name() ?? null)));
  protected readonly ariaHidden = computed(() => (this.silent() ? 'true' : null));

  /** Called by the picture, whichever of the two elements it turned out to be. */
  reportStatus(status: AvatarStatus) {
    this.derived.set(status);
    this.statusChange.emit(status);
  }
}
