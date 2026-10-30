import {
  booleanAttribute,
  Directive,
  HostAttributeToken,
  inject,
  input,
  signal,
} from '@angular/core';

import { SlListIdFactory } from './list-defaults';

/**
 * A group inside the set: the `li` holding a heading and a nested list, which
 * is the grouping HTML already has. MUI, Angular Material, Primer and React
 * Aria each leave the heading loose among the rows instead, so a reader hears a
 * heading inside a set rather than a set with a name.
 *
 * The three elements are the consumer's own, which is what this ecosystem
 * composes with: the heading keeps whichever level the document needs, and the
 * nested list keeps `ul` or `ol` to match the set around it. React reads the
 * heading element off a `level` input instead, because there the component owns
 * the tag; both reach the same accessibility tree.
 */
/** How a group heading is drawn. */
export type ListSectionLabelVariant = 'caption' | 'ruled';

@Directive({
  selector: 'li[slListSection]',
  standalone: true,
  exportAs: 'slListSection',
  host: { 'data-part': 'section', 'data-part-section': '' },
})
export class SlListSection {
  /**
   * The id the heading carries and the nested list names itself by. It is held
   * here rather than passed between the two, because the pair is the group and
   * neither half can name the other on its own.
   */
  readonly labelId = signal<string | undefined>(undefined);
}

/**
 * The group's name. It shares the row's inline inset, so the heading and the
 * titles under it stand in one column — the alignment that makes a grouped list
 * read as one list rather than as several.
 */
@Directive({
  selector: '[slListSectionLabel]',
  standalone: true,
  exportAs: 'slListSectionLabel',
  host: {
    'data-part': 'section-label',
    'data-part-section-label': '',
    '[attr.id]': 'id',
    '[attr.data-sticky]': "sticky() ? '' : null",
    '[attr.data-variant]': 'variant()',
  },
})
export class SlListSectionLabel {
  /**
   * How the heading is drawn. `caption` is the small muted name; `ruled` is the
   * name in the text color over a rule, with no ground behind it.
   */
  readonly variant = input<ListSectionLabelVariant>('caption');
  /**
   * Keeps the name in place while its own rows scroll past it. It takes the
   * set's surface and the library's sticky stack level, which is what a
   * consumer writing `position: sticky` alone does not get.
   */
  readonly sticky = input(false, { transform: booleanAttribute });

  private readonly section = inject(SlListSection, { optional: true });
  /** An id the consumer wrote is never replaced by the family's. */
  private readonly written = inject(new HostAttributeToken('id'), { optional: true });

  readonly id = this.written ?? inject(SlListIdFactory).next();

  constructor() {
    this.section?.labelId.set(this.id);
  }
}

/**
 * What stands at the end of a group heading, on the line of the name: a day's
 * balance, a count. Set in tabular figures.
 */
@Directive({
  selector: '[slListSectionEnd]',
  standalone: true,
  host: { 'data-part': 'section-end', 'data-part-section-end': '' },
})
export class SlListSectionEnd {}

/**
 * The rows of one group. `role="list"` for the same reason the set writes it:
 * the family draws its own marker, and the native one is what Safari and
 * VoiceOver read the semantics from.
 */
@Directive({
  selector: 'ul[slListSectionList], ol[slListSectionList]',
  standalone: true,
  exportAs: 'slListSectionList',
  host: {
    'data-part': 'section-list',
    'data-part-section-list': '',
    '[attr.role]': 'role',
    '[attr.aria-labelledby]': 'labelledBy()',
  },
})
export class SlListSectionList {
  private readonly section = inject(SlListSection, { optional: true });
  /** A role the consumer wrote is never replaced by the family's. */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });

  readonly role = this.writtenRole ?? 'list';

  readonly labelledBy = () => this.writtenLabelledBy ?? this.section?.labelId() ?? null;
}

/**
 * What the set says when it holds nothing. It is an `li`, so the reader hears
 * "list, one item" and then the message; a message outside the list leaves them
 * with "list, zero items" and silence, and leaves the words outside the box a
 * framed set paints.
 *
 * The family supplies the box, the height and the muted ink. The words are the
 * page's, and `result-state` is what goes in here.
 */
@Directive({
  selector: 'li[slListEmpty]',
  standalone: true,
  exportAs: 'slListEmpty',
  host: { 'data-part': 'empty', 'data-part-empty': '' },
})
export class SlListEmpty {}
