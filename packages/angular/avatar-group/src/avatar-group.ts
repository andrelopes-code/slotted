import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { AVATAR_DEFAULTS, SlAvatar } from '@slotted/angular/avatar';
import type {
  AvatarDefaults,
  AvatarGroupLayout,
  AvatarShape,
  AvatarSize,
  AvatarVariant,
} from '@slotted/angular/avatar';
import { formatCount } from '@slotted/core/count';
import { formatNameList } from '@slotted/core/identity';

import { AVATAR_GROUP, type AvatarGroupMember } from './avatar-group-host';
import { SlAvatarGroupItem } from './avatar-group-item';

/**
 * The three axes the group hands down to the avatars inside it, through the
 * avatar family's own defaults token rather than through a second channel of
 * this family's invention. That is what keeps an explicit input on a member
 * winning over the group, because it is the rule `SlAvatar` already implements.
 *
 * `tone` is not among them, deliberately: a tone derived from a name is the
 * member's own identity, and a group that overrode it would paint eight people
 * the same color.
 *
 * The values are read through getters so a member's `computed` tracks the
 * group's signals; a plain snapshot would fix the paint at the moment the first
 * member was created. The pattern `button-group` established.
 */
function provideGroupPaint() {
  return {
    provide: AVATAR_DEFAULTS,
    useFactory: (): AvatarDefaults => {
      const group = inject(SlAvatarGroup);
      const inherited = inject(AVATAR_DEFAULTS, { skipSelf: true });

      return {
        get locale() {
          return group.locale() ?? inherited.locale;
        },
        get shape() {
          return group.shape() ?? inherited.shape;
        },
        get size() {
          return group.size() ?? inherited.size;
        },
        get tone() {
          return inherited.tone;
        },
        get variant() {
          return group.variant() ?? inherited.variant;
        },
      };
    },
  };
}

/**
 * A list of faces, overlapped or apart, ending in a summary of the ones it does
 * not show.
 *
 * It is written on a real `<ul>` whose members are real `<li>`s, so assistive
 * technology announces a list of N without the family inventing a role. There
 * is no `label` input: the element already accepts `aria-label`, and a second
 * way to name one thing is a second thing to get wrong — the decision
 * `button-group` took for the same question.
 *
 * The summary is an avatar rather than a fourth part painted to look like one,
 * so it takes the group's size, shape, edge and ring from the same rules as
 * every member beside it. Its accessible name is the hidden members' names,
 * joined for the locale: Atlassian's default there is the English string “N
 * more people”, and MUI, Ant, Fluent, Chakra and HeroUI leave `+3` as the whole
 * announcement.
 */
@Component({
  selector: 'ul[slAvatarGroup]',
  standalone: true,
  exportAs: 'slAvatarGroup',
  imports: [SlAvatar],
  providers: [
    /* A decorator is evaluated before the class it decorates exists. */
    { provide: AVATAR_GROUP, useExisting: forwardRef(() => SlAvatarGroup) },
    provideGroupPaint(),
  ],
  template: `<ng-content></ng-content>
    @if (surplus() > 0 && summary() !== undefined) {
      <li data-part="overflow" data-part-overflow="">
        <span slAvatar tone="secondary" [name]="overflowName()" [initials]="'+' + summary()"></span>
      </li>
    }`,
  styleUrl: '../../../styles/src/avatar-group/avatar-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'avatar-group',
    'data-ui-avatar-group': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-layout]': 'layout()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'resolvedShape()',
  },
})
export class SlAvatarGroup {
  /** `stack` overlaps the members; `spread` lays them apart and wraps. */
  readonly layout = input<AvatarGroupLayout>('stack');
  /**
   * The largest number of discs the group draws, the summary included. Above
   * it, one fewer member is shown and the rest are summarized. `false` shows
   * every member.
   */
  readonly max = input<number | false>(5);
  /**
   * How many members there really are, when the page renders fewer than it
   * has — a server-paged list showing three of forty. Defaults to the number of
   * items written.
   */
  readonly total = input<number | undefined>(undefined);
  /**
   * What the summary is called. Defaults to the hidden members' names, joined
   * for the locale — which is only possible while every hidden member is in the
   * DOM, so a group given a larger `total` supplies this itself.
   */
  readonly overflowLabel = input<string | undefined>(undefined);
  /** Provided to every member. An avatar that states its own still wins. */
  readonly size = input<AvatarSize | undefined>(undefined);
  /** Provided to every member. An avatar that states its own still wins. */
  readonly shape = input<AvatarShape | undefined>(undefined);
  /** Provided to every member. An avatar that states its own still wins. */
  readonly variant = input<AvatarVariant | undefined>(undefined);
  /** BCP 47, for the digits of the summary and for joining the hidden names. */
  readonly locale = input<string | undefined>(undefined);

  private readonly inherited = inject(AVATAR_DEFAULTS, { skipSelf: true });
  private readonly items = contentChildren(SlAvatarGroupItem);

  protected readonly resolvedSize = computed(() => this.size() ?? this.inherited.size);
  protected readonly resolvedShape = computed(() => this.shape() ?? this.inherited.shape);
  private readonly resolvedLocale = computed(() => this.locale() ?? this.inherited.locale);

  private readonly count = computed(() => this.total() ?? this.items().length);

  /**
   * `max` counts the discs the group draws, the summary included, so a limit of
   * five never puts six circles in a row. Below the limit nothing is
   * summarized: a `+1` beside four faces is one more circle than showing the
   * fifth, and says less.
   */
  private readonly shownCount = computed(() => {
    const max = this.max();
    const limit = max === false ? Number.POSITIVE_INFINITY : max;
    const items = this.items().length;
    return this.count() > limit ? Math.min(limit - 1, items) : items;
  });

  protected readonly surplus = computed(() => Math.max(this.count() - this.shownCount(), 0));

  protected readonly summary = computed(() =>
    formatCount({ count: this.surplus(), max: false, locale: this.resolvedLocale() }),
  );

  /**
   * The names of the members that were not drawn. They are only complete while
   * every hidden member is in the DOM: a group told it stands for forty and
   * given three items knows three names and no more, so it says nothing rather
   * than naming a third of them.
   */
  protected readonly overflowName = computed(() => {
    const label = this.overflowLabel();
    if (label !== undefined) return label;
    const total = this.total();
    if (total !== undefined && total !== this.items().length) return undefined;
    return formatNameList({
      names: this.items()
        .slice(this.shownCount())
        .map((item) => item.memberName()),
      locale: this.resolvedLocale(),
    });
  });

  /** Read from each item's own `computed`, so a member hides itself. */
  isHiddenMember(member: AvatarGroupMember) {
    return this.items().indexOf(member as SlAvatarGroupItem) >= this.shownCount();
  }
}
