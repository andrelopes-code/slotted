import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { SlField } from '@slotted/angular/field';
import { tabbables } from '@slotted/core/focus';

import type { PickerLayer } from './picker-layer';
import type { PickerKind, PickerShowing } from './picker-views';

/** The positioned dialog of a picker; on a phone, a modal bottom sheet over a scrim. */
@Component({
  selector: '[slPickerLayer]',
  standalone: true,
  template: `
    @if (layer().sheet()) {
      <div aria-hidden="true" data-part="backdrop" data-part-backdrop=""></div>
    }
    <div
      data-part="content"
      data-part-content=""
      role="dialog"
      [attr.aria-label]="label()"
      [attr.aria-modal]="layer().sheet() ? 'true' : null"
      [attr.id]="layer().contentId"
      (keydown)="onKeydown($event)"
    >
      @if (layer().sheet()) {
        <span aria-hidden="true" data-part="grip" data-part-grip=""></span>
      }
      <ng-content />
    </div>
  `,
  styleUrl: '../../../styles/src/picker-panel/picker-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'picker-panel',
    'data-ui-picker-panel': '',
    'data-part': 'positioner',
    'data-part-positioner': '',
    '[attr.data-open]': "layer().isOpen() ? '' : null",
    '[attr.data-presentation]': "layer().sheet() ? 'sheet' : 'popover'",
  },
})
export class SlPickerLayer {
  readonly layer = input.required<PickerLayer>();
  readonly label = input.required<string>();

  /** Ctrl+Enter, or Cmd+Enter, anywhere in the panel. */
  readonly applied = output<Event>();

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const release = this.layer().attach(element);
      destroyRef.onDestroy(release);
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.applied.emit(event);
    }
    if (event.key === 'Tab') this.wrapTab(event);
  }

  /** Tab and Shift+Tab wrap inside the panel while it is open. */
  private wrapTab(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const panel = event.currentTarget as HTMLElement;
    const items = tabbables(panel);
    const [edge, landing] = event.shiftKey ? [items[0], items.at(-1)] : [items.at(-1), items[0]];
    if (landing === undefined || panel.ownerDocument.activeElement !== edge) return;

    event.preventDefault();
    landing.focus();
  }
}

/**
 * The grid of a panel: the rail, the modules, and the footer under all of them.
 *
 * The field around the picker names the control, not what is in the panel, so
 * nothing in here finds it.
 */
@Component({
  selector: '[slPickerPanel]',
  standalone: true,
  template: `
    <ng-content select="[slPickerRail]" />
    <div data-part="main" data-part-main=""><ng-content /></div>
    <ng-content select="[slPickerSide]" />
    <ng-content select="[slPickerFooter]" />
  `,
  providers: [{ provide: SlField, useValue: null }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'picker-panel',
    'data-ui-picker-panel': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-kind]': 'kind()',
    '[attr.data-showing]': 'resolvedShowing()',
  },
})
export class SlPickerPanel {
  readonly kind = input.required<PickerKind>();
  readonly showing = input<PickerShowing | undefined>(undefined);

  protected readonly resolvedShowing = computed(
    () => this.showing() ?? (['time', 'time-range'].includes(this.kind()) ? 'time' : 'day'),
  );
}

/** The second module of a panel: the clock beside a month. */
@Directive({
  selector: '[slPickerSide]',
  standalone: true,
  host: { 'data-part': 'side', 'data-part-side': '' },
})
export class SlPickerSide {}

/** One month or one clock, with the air of its module. */
@Directive({
  selector: '[slPickerBody]',
  standalone: true,
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlPickerBody {}

/** Two clocks, each under the half of its own end. */
@Directive({
  selector: '[slPickerClocks]',
  standalone: true,
  host: { 'data-part': 'clocks', 'data-part-clocks': '' },
})
export class SlPickerClocks {}

/** The clock of the end that is being chosen. */
@Directive({
  selector: '[slPickerCurrent]',
  standalone: true,
  host: { '[attr.data-current]': "slPickerCurrent() ? '' : null" },
})
export class SlPickerCurrent {
  readonly slPickerCurrent = input.required({ transform: booleanAttribute });
}
