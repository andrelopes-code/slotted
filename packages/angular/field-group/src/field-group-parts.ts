import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  HostAttributeToken,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { necessityMark, SlFieldMessage } from '@slotted/angular/field';

import { SlFieldGroup } from './field-group';

/**
 * The name of the set, and whether the set has to be answered.
 *
 * It holds whatever the page puts in it. On a page asking one question GOV.UK
 * recommends the legend contain the page's own heading, so a reader hears the
 * question once rather than twice; the family removes the heading's block break
 * and its margins and leaves its type alone, because a page heading is a page's
 * decision rather than a control's.
 */
@Component({
  selector: 'legend[slFieldGroupLegend]',
  standalone: true,
  exportAs: 'slFieldGroupLegend',
  template: `<ng-content />
    @if (mark(); as text) {
      <!-- Text rather than a margin, so the accessible name reads "Note (optional)". -->
      &ngsp;<span
        data-part="mark"
        data-part-mark=""
        [attr.aria-hidden]="markHidden() ? 'true' : null"
        >{{ text }}</span
      >
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'legend',
    'data-part-legend': '',
    '[attr.id]': 'legendId()',
  },
})
export class SlFieldGroupLegend {
  private readonly group = inject(SlFieldGroup);
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });

  protected readonly legendId = computed(() => this.writtenId ?? this.group.ids().legend);
  private readonly necessity = computed(() =>
    this.group.kind() === 'section'
      ? null
      : necessityMark(this.group.resolvedNecessity(), this.group.required() === true, this.group.t),
  );
  protected readonly markHidden = computed(() => this.necessity()?.hidden === true);
  protected readonly mark = computed(() => this.necessity()?.text ?? null);
}

/**
 * Help about the whole set, projected into the `inline-message` the group
 * renders before its fields.
 *
 * It is a marker of the group's own rather than the field's, so a description
 * written inside one of the fields is never mistaken for the set's.
 */
@Directive({
  selector: '[slFieldGroupDescription]',
  standalone: true,
  exportAs: 'slFieldGroupDescription',
})
export class SlFieldGroupDescription extends SlFieldMessage {}

/**
 * What is wrong with the set — the case a single field cannot state, because
 * "choose at least one" is a fact about the group rather than about any control
 * in it. GOV.UK's error-message-with-legend example is the same arrangement.
 */
@Directive({
  selector: '[slFieldGroupError]',
  standalone: true,
  exportAs: 'slFieldGroupError',
})
export class SlFieldGroupError extends SlFieldMessage {}
