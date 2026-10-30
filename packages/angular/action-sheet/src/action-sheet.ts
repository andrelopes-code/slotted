import { SlDrawer } from '@slotted/angular/drawer';
import type { DrawerChangeRequest } from '@slotted/angular/drawer';
import { injectMessages } from '@slotted/angular/i18n';
import {
  actionSheetMessages,
  type ActionSheetMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostAttributeToken,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { injectActionSheetDefaults } from './action-sheet-defaults';
import type {
  ActionSheetChangeRequest,
  ActionSheetDismissPolicy,
  ActionSheetMount,
  ActionSheetOpenReason,
} from './action-sheet-defaults';

const optionalBoolean = (given: boolean | string | undefined) =>
  given === undefined ? undefined : booleanAttribute(given);

/**
 * Where focus enters, from the dialog pattern's first note: the first action
 * that can run, unless it is destructive, in which case the least destructive
 * action — the cancel, or the first action that is not `danger`, or the panel.
 */
export function entryTarget(panel: HTMLElement): HTMLElement {
  const items = [...panel.querySelectorAll<HTMLElement>("[data-part='list'] [data-part='item']")];
  const enabled = items.filter(
    (item) => item.dataset['disabled'] === undefined && item.dataset['loading'] === undefined,
  );
  const first = enabled[0];
  if (first !== undefined && first.dataset['tone'] !== 'danger') return first;
  const cancel = panel.querySelector<HTMLElement>("[data-part='cancel']");
  if (cancel !== null) return cancel;
  return enabled.find((item) => item.dataset['tone'] !== 'danger') ?? panel;
}

/**
 * A `scrimFrom` no extent reaches. A sheet that is not modal keeps the page
 * live, and a scrim over a live page would promise an inertness that is not
 * there, so `drawer` is asked to leave it undimmed at every height.
 */
const NEVER_DIMMED = 2;

/** The family's measure, handed to `drawer`'s sheet. */
const MEASURE = 'var(--slotted-action-sheet-inline-size, 32rem)';

/**
 * A short list of actions that rises from the bottom edge, and the explicit
 * way out beneath it.
 *
 * The sheet is `<sl-drawer>` — `side="bottom"`, `size="content"` — which owns
 * the layer, the portal, the scrim, the slide, the width, Escape, the press
 * outside, the way back, the drag that closes it and the virtual keyboard.
 * This family owns what is inside and the state, because only it knows that a
 * close was a choice (`select`) and what was chosen.
 *
 * The parts are the consumer's own elements, projected into the drawer's
 * panel, and dependency injection does not reach from them into this
 * component's view, where the drawer lives. So the parts talk to the sheet,
 * and the sheet hands `drawer` what they said — the trigger, whether a title
 * and a message exist — and reads back the ids the panel is named by.
 *
 * `docs/history/designs/2026-09-25-action-sheet-on-drawer-design.md`.
 */
@Component({
  selector: 'sl-action-sheet',
  standalone: true,
  exportAs: 'slActionSheet',
  imports: [SlDrawer],
  template: `
    <sl-drawer
      #drawer
      mode="overlay"
      side="bottom"
      size="content"
      drag="panel"
      [open]="open()"
      [modal]="resolvedModal()"
      [scrimFrom]="resolvedModal() ? 0 : neverDimmed"
      [mount]="resolvedMount()"
      [escape]="resolvedEscape()"
      [outsidePress]="resolvedOutsidePress()"
      [back]="resolvedBack()"
      [container]="container()"
      [initialFocus]="entry()"
      [finalFocus]="finalFocus()"
      (openChangeRequest)="fromDrawer($event)"
      (closed)="onClosed()"
    >
      <div data-ui="action-sheet" data-ui-action-sheet="" data-part="root" data-part-root="">
        <ng-content />
      </div>
    </sl-drawer>
  `,
  styleUrls: [
    '../../../styles/src/action-sheet/action-sheet.css',
    '../../../styles/src/spinner/spinner.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[style.display]': "'contents'" },
})
export class SlActionSheet {
  readonly open = model<boolean>(false);

  readonly modal = input(undefined, { transform: optionalBoolean });
  readonly mount = input<ActionSheetMount | undefined>(undefined);
  readonly escape = input<ActionSheetDismissPolicy | undefined>(undefined);
  readonly outsidePress = input<ActionSheetDismissPolicy | undefined>(undefined);
  readonly back = input<ActionSheetDismissPolicy | undefined>(undefined);
  readonly closeOnSelect = input(undefined, { transform: optionalBoolean });
  /** Words laid over the catalog of the language in force, key by key: the cancel's (`cancel`). */
  readonly messages = input<PartialMessages<ActionSheetMessages> | undefined>(undefined);
  readonly container = input<Element | null | undefined>(undefined);
  readonly initialFocus = input<HTMLElement | false | undefined>(undefined);
  readonly finalFocus = input<HTMLElement | false | undefined>(undefined);

  readonly openChangeRequest = output<ActionSheetChangeRequest>();
  readonly closed = output<string | undefined>();

  private readonly defaults = injectActionSheetDefaults();
  /** The family's words in the language in force, with this sheet's `messages` laid over them. */
  readonly t = injectMessages(actionSheetMessages, this.messages);

  /**
   * A consumer's own `aria-label` on `<sl-action-sheet>`, read before the host
   * bindings are written and handed to the panel, which is the element the
   * role is on.
   */
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), {
    optional: true,
  });

  protected readonly drawer = viewChild<SlDrawer>('drawer');
  protected readonly neverDimmed = NEVER_DIMMED;

  /** What the parts say exists; the sheet hands it to `drawer`. */
  readonly hasTitle = signal(false);
  readonly hasMessage = signal(false);
  readonly triggerNode = signal<HTMLElement | null>(null);

  /** The ids `drawer`'s panel is named and described by, once it exists. */
  readonly titleId = computed(() => this.drawer()?.titleId ?? null);
  readonly messageId = computed(() => this.drawer()?.descriptionId ?? null);
  readonly panelId = computed(() => this.drawer()?.panelId ?? null);
  readonly triggerId = computed(() => this.drawer()?.triggerId ?? null);
  readonly mounted = computed(() => this.drawer()?.mounted() ?? false);

  private result: string | undefined = undefined;

  readonly resolvedModal = computed(() => this.modal() ?? this.defaults.modal);
  readonly resolvedMount = computed(() => this.mount() ?? this.defaults.mount);
  readonly resolvedCloseOnSelect = computed(
    () => this.closeOnSelect() ?? this.defaults.closeOnSelect,
  );
  protected readonly resolvedEscape = computed(() => this.escape() ?? this.defaults.escape);
  protected readonly resolvedBack = computed(() => this.back() ?? this.defaults.back);
  protected readonly resolvedOutsidePress = computed(
    () => this.outsidePress() ?? this.defaults.outsidePress,
  );

  /**
   * Where focus enters, decided when the sheet has opened and its actions
   * exist: the consumer's element, or the least destructive action.
   */
  protected readonly entry = computed(() => {
    const wanted = this.initialFocus();
    if (wanted === false) return false as const;
    return (): HTMLElement | null => {
      if (wanted !== undefined) return wanted;
      const panel = this.drawer()?.panel ?? null;
      return panel === null ? null : entryTarget(panel);
    };
  });

  constructor() {
    /* What the parts said, handed to the drawer that renders the panel. */
    effect(() => {
      const drawer = this.drawer();
      if (drawer === undefined) return;
      const title = this.hasTitle();
      const message = this.hasMessage();
      const trigger = this.triggerNode();
      untracked(() => {
        drawer.hasTitle.set(title);
        drawer.hasDescription.set(message);
        drawer.triggerNode.set(trigger);
      });
    });

    /**
     * What only this family knows about the panel: its measure, handed to
     * `drawer`'s sheet token; that it takes focus from script when the pointer
     * leaves an item; and a label the consumer wrote on the host.
     */
    effect(() => {
      /* `panel` reads the drawer's view query, so this runs again whenever the
         layer — and the panel with it — is built. */
      const panel = this.drawer()?.panel ?? null;
      if (panel === null) return;
      panel.style.setProperty('--slotted-drawer-sheet-inline-size', MEASURE);
      panel.tabIndex = -1;
      if (this.writtenLabel !== null) panel.setAttribute('aria-label', this.writtenLabel);
    });
  }

  /**
   * `drawer`'s own request — the trigger, Escape, the press outside, the way
   * back, the drag — asks this family first, and a refusal here refuses it
   * there, so the consumer's `cancel()` holds whichever family asked.
   */
  protected fromDrawer(request: DrawerChangeRequest) {
    if (!this.request(request.value, request.reason, undefined, request.source)) {
      request.cancel();
    }
  }

  protected onClosed() {
    this.closed.emit(this.result);
    this.result = undefined;
  }

  /** Asks to move, and answers whether the move stands. */
  request(
    next: boolean,
    reason: ActionSheetOpenReason,
    result: string | undefined,
    source: unknown,
  ): boolean {
    if (next === this.open()) return true;

    let cancelled = false;
    const state = createControllable<boolean>({
      initial: this.open(),
      onRequest: (raw) => {
        this.openChangeRequest.emit({
          cancel: () => raw.cancel(),
          get cancelled() {
            return raw.cancelled;
          },
          previous: raw.previous,
          reason,
          result,
          source: raw.source,
          value: raw.value,
        });
        cancelled = raw.cancelled;
      },
    });

    if (!state.request(next, reason, source) || cancelled) return false;
    if (!next) this.result = result;
    this.open.set(next);
    return true;
  }

  show() {
    this.request(true, 'programmatic', undefined, undefined);
  }

  close() {
    this.request(false, 'programmatic', undefined, undefined);
  }

  focus() {
    const panel = this.drawer()?.panel ?? null;
    const stop = panel?.querySelector<HTMLElement>("[data-part='item'][tabindex='0']");
    (stop ?? panel)?.focus();
  }
}
