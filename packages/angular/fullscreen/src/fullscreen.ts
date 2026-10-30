import {
  afterNextRender,
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { createFullscreen, fullscreenSupported } from '@slotted/core/fullscreen';
import type {
  FullscreenController,
  FullscreenError,
  FullscreenMode,
  FullscreenNavigationUI,
  FullscreenOptions,
  FullscreenPolicy,
} from '@slotted/core/fullscreen';
import {
  fullscreenMessages,
  type FullscreenMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import { injectFullscreenDefaults } from './fullscreen-defaults';
import type { FullscreenTriggerSize, FullscreenTriggerVariant } from './fullscreen-defaults';

/**
 * Why the state moved. `escape` is the leave nobody asked for: `Escape` in the
 * layout, or the agent's own exit in native — a key, F11, its interface.
 */
export type FullscreenReason = 'pointer' | 'keyboard' | 'escape' | 'programmatic';

/**
 * A region the reader can give the whole screen: by the Fullscreen API where
 * the page may ask, fixed over the page where it may not. At rest it paints
 * nothing — it is the container the consumer already had — so it is a
 * directive on that container rather than a wrapper around it.
 *
 * `[(fullscreen)]` holds the state; every move is first asked through
 * `fullscreenChangeRequest`, whose `cancel()` refuses it. `Escape` in native
 * full screen belongs to the agent, and no listener is written for it; the
 * leave arrives as a request with the reason `escape`, and the agent has
 * already left by then.
 */
@Directive({
  selector: '[slFullscreen]',
  standalone: true,
  exportAs: 'slFullscreen',
  host: {
    'data-ui': 'fullscreen',
    'data-ui-fullscreen': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-fullscreen]': "fullscreen() ? '' : null",
    '[attr.data-mode]': 'mode()',
  },
})
export class SlFullscreen {
  readonly fullscreen = model(false);
  /** The value an uncontrolled region starts from, read once. */
  readonly defaultFullscreen = input(false, { transform: booleanAttribute });
  /** `auto` asks the platform and falls back to the layout; `layout` never asks. */
  readonly policy = input<FullscreenPolicy | undefined>(undefined, { alias: 'mode' });
  readonly navigationUI = input<FullscreenNavigationUI | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * control's (`enter`, `exit`) and the announcements (`entered`, `exited`).
   */
  readonly messages = input<PartialMessages<FullscreenMessages> | undefined>(undefined);

  readonly fullscreenChangeRequest = output<ChangeRequest<boolean>>();
  /** The platform was absent or refused. The region is in the layout by then. */
  readonly fullscreenError = output<FullscreenError>();

  private readonly defaults = injectFullscreenDefaults();
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  /** The way that answered, or `null` while the region is not full screen. */
  readonly mode = signal<FullscreenMode | null>(null);
  /** Whether the page may ask for native full screen. `false` until rendered. */
  readonly supported = signal(false);
  /** The last refusal, cleared on the next entry. */
  readonly error = signal<FullscreenError | null>(null);
  /** The family's words in the language in force, with this region's `messages` laid over them. */
  readonly t = injectMessages(fullscreenMessages, this.messages);

  private controller: FullscreenController | null = null;
  /* Set when the agent left native and the state was kept: a new request
     outside a gesture would only be refused. */
  private agentLeft = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (this.defaultFullscreen()) this.fullscreen.set(true);
      this.supported.set(fullscreenSupported(this.element.ownerDocument));
      this.controller = createFullscreen(this.element, this.options());
      this.apply();
    });

    /* Options the controller reads on its next move. */
    effect(() => {
      const options = this.options();
      untracked(() => this.controller?.update(options));
    });

    /* The state applied: a two-way value the page set, and a value the page
       kept after the agent left. */
    effect(() => {
      this.fullscreen();
      this.mode();
      untracked(() => this.apply());
    });

    destroyRef.onDestroy(() => {
      this.controller?.destroy();
      this.controller = null;
    });
  }

  /** Asks to enter. From code the reason is `programmatic`. */
  enter(reason: FullscreenReason = 'programmatic', source?: unknown) {
    this.request(true, reason, source);
  }

  exit(reason: FullscreenReason = 'programmatic', source?: unknown) {
    this.request(false, reason, source);
  }

  toggle(reason: FullscreenReason = 'programmatic', source?: unknown) {
    this.request(!this.fullscreen(), reason, source);
  }

  /**
   * The request, and on acceptance the entry itself — inside the handler that
   * asked, because the agent grants native full screen only to a request made
   * during a gesture.
   */
  private request(next: boolean, reason: FullscreenReason, source?: unknown) {
    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.fullscreen(),
      onRequest: (request) => {
        this.fullscreenChangeRequest.emit(request);
        cancelled = request.cancelled;
      },
    });
    if (!state.request(next, reason, source) || cancelled) return;
    this.fullscreen.set(next);
    if (next) {
      this.error.set(null);
      void this.controller?.enter();
    } else void this.controller?.exit();
  }

  private apply() {
    const controller = this.controller;
    if (!controller) return;
    if (this.fullscreen() && controller.mode === null) {
      const native = !this.agentLeft;
      this.agentLeft = false;
      void controller.enter({ native });
    } else if (!this.fullscreen() && controller.mode !== null) {
      void controller.exit();
    }
  }

  private options(): FullscreenOptions {
    return {
      policy: this.policy() ?? this.defaults.mode,
      navigationUI: this.navigationUI() ?? this.defaults.navigationUI,
      t: this.t,
      onModeChange: (mode) => this.mode.set(mode),
      onError: (failure) => {
        this.error.set(failure);
        this.fullscreenError.emit(failure);
      },
      onExit: (source) => {
        /* In native the agent has already left and the controller is out; in
           the layout `Escape` only asked, and the region is still there. */
        this.agentLeft = this.controller?.mode === null;
        this.request(false, 'escape', source);
      },
    };
  }
}

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count.
 */
function activationReason(event: Event): FullscreenReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * The control. Its words and its mark say what the press does next and change
 * with the state, so it is not a toggle and writes no `aria-pressed` (APG
 * Button pattern). Inside `[slFullscreen]` it reaches the region by injection;
 * anywhere else it takes the region's instance: `[slFullscreenTrigger]="fs"`.
 *
 * Projected content replaces the words, and an element marked `slFullscreenIcon`
 * replaces the mark; both can read `fs.fullscreen()` to follow the state.
 */
@Component({
  selector: 'button[slFullscreenTrigger]',
  standalone: true,
  exportAs: 'slFullscreenTrigger',
  imports: [SlGlyph, SlIcon],
  /* The mark follows the state unless the consumer projected their own. */
  template: `<span data-part="icon" data-part-icon="" aria-hidden="true"
      ><ng-content select="[slFullscreenIcon]"
        ><span slIcon
          ><svg slGlyph [name]="on() ? 'minimize' : 'maximize'"></svg></span></ng-content></span
    ><span data-part="label" data-part-label=""
      ><ng-content>{{ label() }}</ng-content></span
    >`,
  styleUrl: '../../../styles/src/fullscreen/fullscreen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'fullscreen',
    'data-ui-fullscreen': '',
    'data-part': 'trigger',
    'data-part-trigger': '',
    '[attr.type]': 'type',
    '[attr.data-fullscreen]': "on() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.data-icon-only]': "iconOnly() ? '' : null",
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[disabled]': 'disabled()',
  },
})
export class SlFullscreenTrigger implements AfterViewInit {
  /** The region, when the control is not inside it. */
  readonly target = input<SlFullscreen | '' | undefined>(undefined, {
    alias: 'slFullscreenTrigger',
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly size = input<FullscreenTriggerSize | undefined>(undefined);
  readonly variant = input<FullscreenTriggerVariant | undefined>(undefined);

  private readonly defaults = injectFullscreenDefaults();
  /* A control with no region has no region's words, and speaks the catalog's. */
  private readonly own = injectMessages(fullscreenMessages);
  private readonly enclosing = inject(SlFullscreen, { optional: true });
  private readonly element = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  /** A `type` the consumer wrote survives, read before the host binding writes it. */
  private readonly writtenType = inject(new HostAttributeToken('type'), { optional: true });
  protected readonly type = this.writtenType ?? 'button';

  readonly region = computed(() => {
    const target = this.target();
    return target instanceof SlFullscreen ? target : this.enclosing;
  });
  readonly on = computed(() => this.region()?.fullscreen() ?? false);
  protected readonly label = computed(() =>
    (this.region()?.t ?? this.own)(this.on() ? 'exit' : 'enter'),
  );
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);

  /**
   * After the view: a `(click)` the consumer wrote on the same element is
   * bound first, so its `preventDefault()` is read before the family acts.
   */
  ngAfterViewInit() {
    const listener = (event: Event) => {
      if (this.disabled() || event.defaultPrevented) return;
      this.region()?.toggle(activationReason(event), event);
    };
    this.element.addEventListener('click', listener);
    this.destroyRef.onDestroy(() => this.element.removeEventListener('click', listener));
  }
}

/**
 * The part that takes the height the other children of the region leave
 * while it is full screen — a chart under its header, a document under its
 * toolbar — and whose first child fills it. A direct child of the region; at
 * rest it is the element the consumer wrote, unchanged.
 */
@Directive({
  selector: '[slFullscreenContent]',
  standalone: true,
  host: {
    'data-ui': 'fullscreen',
    'data-ui-fullscreen': '',
    'data-part': 'content',
    'data-part-content': '',
  },
})
export class SlFullscreenContent {}

/** Marks the consumer's own mark for the control's icon part. */
@Directive({
  selector: '[slFullscreenIcon]',
  standalone: true,
})
export class SlFullscreenIcon {}
