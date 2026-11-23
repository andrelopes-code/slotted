import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  clampPlace,
  FLOATING_LARGE_STEP,
  FLOATING_STEP,
  stepPlace,
} from '@slotted/core/floating-panel';
import type { FloatingCorner, FloatingPlace } from '@slotted/core/floating-panel';
import {
  floatingPanelMessages,
  type FloatingPanelMessages,
  type PartialMessages,
} from '@slotted/core/i18n';

export type { FloatingCorner, FloatingPlace } from '@slotted/core/floating-panel';

let titles = 0;

/**
 * A tool that stays over the page while the page stays usable: a calculator,
 * a notepad, a timer. It is non-modal by definition (no scrim, no focus trap,
 * no inert page) and a named region rather than a dialog, so the shortcuts an
 * application holds back while a dialog is open keep working. The reader moves
 * it by its handle, with the pointer or with the arrow keys on its grip, and
 * it stays whole inside the viewport; Escape inside it closes it and focus
 * returns to the element that held it before it opened.
 */
@Component({
  selector: '[slFloatingPanel]',
  standalone: true,
  exportAs: 'slFloatingPanel',
  template: '<ng-content />',
  styleUrl: '../../../styles/src/floating-panel/floating-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'floating-panel',
    'data-ui-floating-panel': '',
    'data-part': 'root',
    'data-part-root': '',
    role: 'region',
    '[attr.hidden]': "open() ? null : ''",
    '[attr.aria-labelledby]': 'label() === undefined ? titleId : null',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.data-corner]': 'shown() === null ? defaultPlace() : null',
    '[attr.data-dragging]': "live() === null ? null : ''",
    '[style.--_x]': "shown() === null ? null : shown()!.x + 'px'",
    '[style.--_y]': "shown() === null ? null : shown()!.y + 'px'",
    '(keydown)': 'onKeydown($event)',
  },
})
export class SlFloatingPanel {
  /** Whether the panel is drawn. The page under it stays usable either way. */
  readonly open = input(false);
  /** The region's name when no title names it. */
  readonly label = input<string | undefined>(undefined);
  /** The corner the panel first opens in, in the reading direction. */
  readonly defaultPlace = input<FloatingCorner>('bottom-end');
  /** A controlled place, its top-left corner in viewport pixels; drawn inside the viewport. */
  readonly place = input<FloatingPlace | undefined>(undefined);
  /** Pixels an arrow key on the grip moves the panel. */
  readonly step = input(FLOATING_STEP, { transform: numberAttribute });
  /** Pixels an arrow key with Shift moves it. */
  readonly largeStep = input(FLOATING_LARGE_STEP, { transform: numberAttribute });
  readonly messages = input<PartialMessages<FloatingPanelMessages> | undefined>(undefined);

  /** Asked with `false` on Escape inside the panel and on its close control. */
  readonly openChange = output<boolean>();
  /** Fired once at the end of a move, by pointer or by key, for the application to store. */
  readonly placeChange = output<FloatingPlace>();

  readonly t = injectMessages(floatingPanelMessages, this.messages);
  readonly titleId = `slotted-floating-panel-${String((titles += 1))}`;

  private readonly native: HTMLElement = inject(ElementRef).nativeElement;
  private readonly own = signal<FloatingPlace | null>(null);
  protected readonly live = signal<FloatingPlace | null>(null);
  private opener: HTMLElement | null = null;

  protected readonly shown = computed(() => this.live() ?? this.place() ?? this.own());

  constructor() {
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        const active = this.native.ownerDocument.activeElement;
        this.opener =
          active instanceof HTMLElement && active !== active.ownerDocument.body ? active : null;
      });
    });
  }

  /** Closes the panel and returns focus to the element that held it. */
  close() {
    this.openChange.emit(false);
    this.opener?.focus();
  }

  /** Moves the panel one step for an arrow key, a larger one with Shift. */
  move(event: KeyboardEvent) {
    const step = event.shiftKey ? this.largeStep() : this.step();
    const next = stepPlace(this.drawn(), event.key, step);
    if (next === null) return;

    event.preventDefault();
    this.commit(this.clamped(next));
  }

  /** Drags the panel from a press on its handle, the pointer captured. */
  startDrag(event: PointerEvent) {
    if (event.button !== 0) return;
    if ((event.target as Element).closest('[data-part="close"]') !== null) return;

    const handle = event.currentTarget as HTMLElement;
    const from = this.drawn();
    const pressed = { x: event.clientX, y: event.clientY };
    let last: FloatingPlace | null = null;
    handle.setPointerCapture(event.pointerId);

    const onMove = (move: PointerEvent) => {
      const by = { x: move.clientX - pressed.x, y: move.clientY - pressed.y };
      if (last === null && by.x === 0 && by.y === 0) return;

      last = this.clamped({ x: from.x + by.x, y: from.y + by.y });
      this.live.set(last);
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      if (last === null) return;

      this.live.set(null);
      this.commit(last);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }

  protected onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.key !== 'Escape') return;
    event.stopPropagation();
    this.close();
  }

  private commit(next: FloatingPlace) {
    if (this.place() === undefined) this.own.set(next);
    this.placeChange.emit(next);
  }

  private clamped(next: FloatingPlace) {
    return clampPlace(next, this.size(), this.viewport());
  }

  /** Where the panel is drawn, which is not its stored place when that lies outside the viewport. */
  private drawn(): FloatingPlace {
    const box = this.native.getBoundingClientRect();

    return { x: box.left, y: box.top };
  }

  private size() {
    const box = this.native.getBoundingClientRect();

    return { width: box.width, height: box.height };
  }

  private viewport() {
    const root = this.native.ownerDocument.documentElement;

    return { width: root.clientWidth, height: root.clientHeight };
  }
}

/**
 * The bar the panel is moved by. A press that moves drags the panel; the grip
 * at its start takes focus and moves it one step per arrow key, a larger one
 * with Shift.
 */
@Component({
  selector: '[slFloatingPanelHandle]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<button
      type="button"
      data-part="grip"
      data-part-grip=""
      [attr.aria-label]="panel.t('move')"
      (keydown)="panel.move($event)"
    >
      <span slIcon><svg slGlyph name="grip-vertical"></svg></span>
    </button>
    <ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'handle',
    'data-part-handle': '',
    '(pointerdown)': 'panel.startDrag($event)',
  },
})
export class SlFloatingPanelHandle {
  protected readonly panel = inject(SlFloatingPanel);
}

/** The panel's name, which names the region when no `label` does. */
@Directive({
  selector: '[slFloatingPanelTitle]',
  standalone: true,
  host: { 'data-part': 'title', 'data-part-title': '', '[attr.id]': 'panel.titleId' },
})
export class SlFloatingPanelTitle {
  protected readonly panel = inject(SlFloatingPanel);
}

/** Closes the panel; focus returns to the element that held it before it opened. */
@Component({
  selector: 'button[slFloatingPanelClose]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon><svg slGlyph name="x"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    type: 'button',
    'data-part': 'close',
    'data-part-close': '',
    '[attr.aria-label]': "panel.t('close')",
    '(click)': 'panel.close()',
  },
})
export class SlFloatingPanelClose {
  protected readonly panel = inject(SlFloatingPanel);
}

/** What the tool holds. It scrolls when the panel is held shorter than it. */
@Directive({
  selector: '[slFloatingPanelBody]',
  standalone: true,
  host: { 'data-part': 'body', 'data-part-body': '' },
})
export class SlFloatingPanelBody {}
