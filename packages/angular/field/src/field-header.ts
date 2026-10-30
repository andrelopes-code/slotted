import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  provideTooltipDefaults,
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';
import { fieldMessages } from '@slotted/core/i18n';

import { SlField } from './field';
import { formatFieldCount, isFieldCountOver } from './field-counter';
import {
  SlFieldHeaderSlot,
  SlFieldHelpSlot,
  SlFieldIdFactory,
  SlFieldIndicatorSlot,
} from './field-defaults';

/**
 * The label row, when the label has company: the help, an indicator, an action
 * and the counter beside it. ReUI writes the same row by hand in four of its
 * examples; here it is a part, so its alignment, its gap and its place in a
 * side layout are the family's.
 *
 * It draws the count the control published at its own end when the page wrote
 * no counter, which is where a field without a header puts it too.
 */
@Component({
  selector: '[slFieldHeader]',
  standalone: true,
  exportAs: 'slFieldHeader',
  template: `<ng-content />
    @if (drawnCount(); as count) {
      <span
        data-part="counter"
        data-part-counter=""
        [id]="field.ids().counter"
        [attr.data-invalid]="countOver() ? '' : null"
        >{{ formatCount(count) }}</span
      >
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: SlFieldHeaderSlot, useExisting: forwardRef(() => SlFieldHeader) }],
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlFieldHeader {
  protected readonly field = inject(SlField);

  protected readonly drawnCount = computed(() =>
    this.field.writtenCounter() === undefined ? this.field.count() : undefined,
  );
  protected readonly countOver = computed(() => {
    const count = this.drawnCount();
    return count !== undefined && isFieldCountOver(count);
  });
  protected readonly formatCount = formatFieldCount;
}

/**
 * What qualifies the field — `Beta`, `Pro`, `New` — as one or more `slBadge`s
 * after the label. It stands outside the `label`, so the necessity mark stays
 * against the label's last word, and it joins the control's description, so a
 * reader on the control hears it.
 */
@Directive({
  selector: '[slFieldIndicator]',
  standalone: true,
  exportAs: 'slFieldIndicator',
  providers: [{ provide: SlFieldIndicatorSlot, useExisting: forwardRef(() => SlFieldIndicator) }],
  host: {
    'data-part': 'indicator',
    'data-part-indicator': '',
    '[attr.id]': 'indicatorId()',
  },
})
export class SlFieldIndicator {
  private readonly field = inject(SlField);
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });

  protected readonly indicatorId = computed(() => this.writtenId ?? this.field.ids().indicator);
}

/**
 * The help beside the label: the button itself, drawing `circle-question`, with
 * the hint in a tooltip. The hint is the directive's value —
 * `<button slFieldHelp="Dias corridos."></button>` — because it is written once
 * and read in two places: the tooltip's layer, and a hidden node inside the
 * button that describes the button and the control while the layer is closed. A
 * directly referenced hidden element still enters the description (accname 1.2,
 * step 2A), and the tooltip is asked to describe nothing, so the hint is not
 * read twice.
 *
 * **A press is the hint.** A tooltip opens on a coarse pointer only by a long
 * press, because a tap is the trigger's own action; this button has no other
 * action, so the tooltip is composed on the button as host directives and run
 * by hand (`openOn: 'manual'`, provided here): a press pins the hint open and a
 * second press closes it, while hover and keyboard focus open it the way every
 * tooltip opens. It is Carbon's toggletip. `[(open)]` and `(openChangeRequest)`
 * are the tooltip's own, exposed on the button.
 *
 * **It stays operable on a disabled field.** The help is often where the reason
 * the field is off is written.
 */
@Component({
  selector: 'button[slFieldHelp]',
  standalone: true,
  exportAs: 'slFieldHelp',
  imports: [SlGlyph, SlIcon, SlTooltipArrow, SlTooltipContent, SlTooltipLayer],
  hostDirectives: [
    {
      directive: SlTooltip,
      inputs: ['open', 'side'],
      outputs: ['openChange', 'openChangeRequest'],
    },
    SlTooltipTrigger,
  ],
  template: `<span slIcon aria-hidden="true"><svg slGlyph name="circle-question"></svg></span>
    <span data-part="help-text" data-part-help-text="" hidden [id]="textId()">{{
      slFieldHelp()
    }}</span>
    <ng-template slTooltipLayer>
      <div slTooltipContent>{{ slFieldHelp() }}</div>
      <div slTooltipArrow></div>
    </ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    provideTooltipDefaults({ closeOnPress: false, describes: 'none', openOn: 'manual' }),
    { provide: SlFieldHelpSlot, useExisting: forwardRef(() => SlFieldHelp) },
  ],
  host: {
    'data-part': 'help',
    'data-part-help': '',
    type: 'button',
    '[attr.aria-label]': 'label()',
    '[attr.aria-describedby]': 'describedBy()',
    '(pointerenter)': 'enter($event)',
    '(pointerleave)': 'leave($event)',
    '(focus)': 'focus($event)',
    '(blur)': 'blur($event)',
    '(click)': 'press($event)',
  },
})
export class SlFieldHelp {
  /** The hint. */
  readonly slFieldHelp = input('');

  private readonly field = inject(SlField, { optional: true });
  private readonly tooltip = inject(SlTooltip);
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly fallbackId = `${inject(SlFieldIdFactory).next()}-help`;
  /** The field family's words, for a help control outside a field. */
  private readonly own = injectMessages(fieldMessages);

  protected readonly textId = computed(() => this.field?.ids().help ?? this.fallbackId);
  protected readonly label = computed(
    () => this.writtenLabel ?? (this.field?.t ?? this.own)('help'),
  );
  protected readonly describedBy = computed(() => this.writtenDescribedBy ?? this.textId());

  /** Whether a press opened the hint; a hover-opened hint closes when the pointer leaves. */
  private readonly pinned = signal(false);

  constructor() {
    /* A hint closed from anywhere — Escape, a press outside, the consumer — is
       no longer pinned by the press that opened it. */
    effect(() => {
      if (!this.tooltip.isOpen()) this.pinned.set(false);
    });
  }

  protected enter(event: PointerEvent) {
    if (event.pointerType === 'touch' || this.tooltip.isOpen()) return;
    this.tooltip.openAfterDelay(event);
  }

  protected leave(event: PointerEvent) {
    if (event.pointerType === 'touch' || this.pinned()) return;
    this.tooltip.closeAfterDelay(event);
  }

  /** `:focus-visible` rather than every focus: a press focuses the button too. */
  protected focus(event: FocusEvent) {
    if (!(event.target as HTMLElement).matches(':focus-visible')) return;
    this.tooltip.toggle(true, 'keyboard', event);
  }

  protected blur(event: FocusEvent) {
    this.pinned.set(false);
    this.tooltip.toggle(false, 'blur', event);
  }

  /**
   * A click synthesised by the keyboard reports no detail; a real one reports
   * the click count, which is how `Enter` and `Space` are told from a press.
   */
  protected press(event: MouseEvent) {
    const reason = event.detail === 0 ? 'keyboard' : 'pointer';
    if (this.tooltip.isOpen() && this.pinned()) {
      this.pinned.set(false);
      this.tooltip.toggle(false, reason, event);
      return;
    }
    this.pinned.set(true);
    this.tooltip.toggle(true, reason, event);
  }
}
