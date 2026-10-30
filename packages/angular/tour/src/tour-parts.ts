import { writeSelectorKey } from '@slotted/core/selector-key';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SL_TOUR } from './tour-context';

/**
 * `<ng-template slTourStep="share">`: the body of the step with that id,
 * rendered only while the step is shown. `slTourStepSlot="media"` writes the
 * picture above the header instead.
 */
@Directive({ selector: 'ng-template[slTourStep]', standalone: true })
export class SlTourStep {
  readonly id = input.required<string>({ alias: 'slTourStep' });
  readonly slot = input<'body' | 'media'>('body', { alias: 'slTourStepSlot' });
  readonly template = inject(TemplateRef<unknown>);
}

/**
 * `<ng-template slTourCard>`: the consumer's own arrangement of the card,
 * rendered inside the positioned layer in place of the whole anatomy.
 */
@Directive({ selector: 'ng-template[slTourCard]', standalone: true })
export class SlTourCard {
  readonly template = inject(TemplateRef<unknown>);
}

/**
 * The card. `role="dialog"`, named by the title part and described by the
 * description part when the step has one; `aria-modal` only on a modal step,
 * the only state in which the page behind is actually inert. The arrow keys
 * are read here. A role or an `aria-label` the consumer wrote survives.
 */
@Directive({
  selector: '[slTourContent]',
  standalone: true,
  host: {
    'data-part': 'content',
    'data-part-content': '',
    tabindex: '-1',
    '[attr.role]': 'role ?? "dialog"',
    '[attr.aria-labelledby]': 'label === null ? tour.titleId : null',
    '[attr.aria-describedby]': 'tour.hasDescription() ? tour.descriptionId : null',
    '[attr.aria-modal]': 'tour.modal() ? "true" : null',
    '(keydown)': 'tour.onKeyDown($event)',
  },
})
export class SlTourContent {
  protected readonly tour = inject(SL_TOUR);
  protected readonly role = inject(new HostAttributeToken('role'), { optional: true });
  protected readonly label = inject(new HostAttributeToken('aria-label'), { optional: true });
}

/** The step's picture, full bleed above the header; hidden when it has none. */
@Component({
  selector: '[slTourMedia]',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `@if (tour.mediaTemplate(); as media) {
      <ng-container [ngTemplateOutlet]="media" />
    } @else if (url(); as src) {
      <img alt="" [src]="src" />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'media',
    'data-part-media': '',
    '[attr.hidden]': 'shown() ? null : ""',
  },
})
export class SlTourMedia {
  protected readonly tour = inject(SL_TOUR);
  protected readonly url = computed(() => {
    const media = this.tour.current()?.media;
    return typeof media === 'string' ? media : null;
  });
  protected readonly shown = computed(
    () => this.tour.mediaTemplate() !== null || this.url() !== null,
  );
}

@Directive({
  selector: '[slTourHeader]',
  standalone: true,
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlTourHeader {}

/** “2 of 5”, counting the steps available now; hidden in a tour of one step. */
@Component({
  selector: '[slTourProgress]',
  standalone: true,
  template: `{{ tour.t('progress', { position: tour.position(), total: tour.total() }) }}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'progress',
    'data-part-progress': '',
    '[attr.hidden]': 'tour.total() > 1 ? null : ""',
  },
})
export class SlTourProgress {
  protected readonly tour = inject(SL_TOUR);
}

/** Closes with the outcome `close` and the reason `dismiss`. The cross is drawn unless the consumer wrote content of their own. */
@Component({
  selector: 'button[slTourClose]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon size="sm"><svg slGlyph name="x"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'close',
    'data-part-close': '',
    type: 'button',
    '[attr.aria-label]': "label ?? tour.t('close')",
    '[attr.hidden]': 'tour.showClose() ? null : ""',
    '(click)': 'tour.close("close", $event, true)',
  },
})
export class SlTourClose {
  protected readonly tour = inject(SL_TOUR);
  protected readonly label = inject(new HostAttributeToken('aria-label'), { optional: true });
}

/** The step's title and the card's accessible name. Text written inside replaces it. */
@Component({
  selector: '[slTourTitle]',
  standalone: true,
  template: `<ng-content>{{ tour.current()?.title }}</ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'data-part': 'title', 'data-part-title': '', '[id]': 'tour.titleId' },
})
export class SlTourTitle {
  protected readonly tour = inject(SL_TOUR);
}

/** The step's description, and the card's accessible description; hidden when it has none. */
@Component({
  selector: '[slTourDescription]',
  standalone: true,
  template: `{{ tour.current()?.description }}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'description',
    'data-part-description': '',
    '[id]': 'tour.descriptionId',
    '[attr.hidden]': 'tour.hasDescription() ? null : ""',
  },
})
export class SlTourDescription {
  protected readonly tour = inject(SL_TOUR);
}

/** The step's content — a template or text — and the only part that scrolls. */
@Component({
  selector: '[slTourBody]',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `@if (tour.bodyTemplate(); as body) {
      <ng-container [ngTemplateOutlet]="body" />
    } @else {
      {{ text() }}
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'body',
    'data-part-body': '',
    '[attr.hidden]': 'shown() ? null : ""',
  },
})
export class SlTourBody {
  protected readonly tour = inject(SL_TOUR);
  protected readonly text = computed(() => {
    const content = this.tour.current()?.content;
    return typeof content === 'string' ? content : '';
  });
  protected readonly shown = computed(
    () => this.tour.bodyTemplate() !== null || this.text() !== '',
  );
}

@Directive({
  selector: '[slTourFooter]',
  standalone: true,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlTourFooter {}

/**
 * The three actions go on the consumer's own `button slButton`. `slButton`
 * writes `data-part="root"` as a static host attribute, which erases the part
 * the template wrote, so each of these writes its part back after the first
 * render, as `slTransferPart` does.
 */
abstract class TourAction {
  protected readonly tour = inject(SL_TOUR);

  constructor(part: string) {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => writeSelectorKey(host, 'part', part));
  }
}

/** Closes with the outcome `skip`. Hidden on the last step and in a tour of one. */
@Directive({
  selector: 'button[slTourSkip]',
  standalone: true,
  host: {
    '[attr.hidden]': 'tour.showSkip() ? null : ""',
    '(click)': 'onClick($event)',
  },
})
export class SlTourSkip extends TourAction {
  constructor() {
    super('skip');
  }

  protected onClick(event: MouseEvent) {
    if (!event.defaultPrevented) this.tour.close('skip', event);
  }
}

/** The previous available step. Hidden on the first. */
@Directive({
  selector: 'button[slTourPrev]',
  standalone: true,
  host: {
    '[attr.hidden]': 'tour.showPrev() ? null : ""',
    '(click)': 'onClick($event)',
  },
})
export class SlTourPrev extends TourAction {
  constructor() {
    super('prev');
  }

  protected onClick(event: MouseEvent) {
    if (!event.defaultPrevented) this.tour.prev(event);
  }
}

/**
 * The next available step, or Done on the last (`data-last`), which closes
 * with the outcome `complete`. Hidden on a step that advances on the reader's
 * own action at the target, unless the step asks for it.
 */
@Directive({
  selector: 'button[slTourNext]',
  standalone: true,
  host: {
    '[attr.hidden]': 'tour.showNext() ? null : ""',
    '[attr.data-last]': 'tour.last() ? "" : null',
    '(click)': 'onClick($event)',
  },
})
export class SlTourNext extends TourAction {
  constructor() {
    super('next');
  }

  protected onClick(event: MouseEvent) {
    if (event.defaultPrevented || this.tour.pending()) return;
    this.tour.next(event);
  }
}
