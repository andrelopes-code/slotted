import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import {
  blockActivation,
  BUTTON_WAIT,
  resolveInertness,
  resolveLoadingIndicator,
  SlButton,
  SlIconButton,
} from '@slotted/angular/button';
import { SlMenuRadioGroup, SlMenuTrigger } from '@slotted/angular/menu';

import { SlSplitButton } from './split-button';
import type { SplitButtonValueReason } from './split-button';

/**
 * The action: `SlButton`, carrying this family's part and folding the root's
 * `disabled` and `loading` into its own. The subclass restates the template
 * and the host binding for the part, and overrides the two resolvers the
 * parent reads its state through — everything else, from `slButtonStart` to
 * the indicator, is `SlButton`'s. `button` selects itself by `data-ui` alone
 * and reads no part on its root, so the part slot is free.
 */
@Component({
  selector: 'button[slSplitButtonPrimary]',
  standalone: true,
  template: `<ng-content select="[slButtonStart]"></ng-content
    ><span data-part="label" data-part-label=""><ng-content></ng-content></span
    ><ng-content select="[slButtonEnd]"></ng-content>
    @if (waiting() && !hasVisualSlot()) {
      <span
        data-part="indicator"
        data-part-indicator=""
        data-ui="spinner"
        data-ui-spinner=""
        role="progressbar"
        [attr.aria-label]="t('loading')"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    }`,
  styleUrls: [
    '../../../styles/src/button/button.css',
    '../../../styles/src/spinner/spinner.css',
    '../../../styles/src/split-button/split-button.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slSplitButtonPrimary',
  providers: [{ provide: BUTTON_WAIT, useExisting: forwardRef(() => SlSplitButtonPrimary) }],
  host: {
    '[attr.data-part]': '"primary"',
    '[attr.data-part-root]': 'null',
    '[attr.data-part-primary]': "''",
    '[attr.data-disabled]': 'stateAttribute(resolvedDisabled())',
    '[attr.data-loading]': 'stateAttribute(resolvedLoading())',
  },
})
export class SlSplitButtonPrimary extends SlButton {
  private readonly split = inject(SlSplitButton);

  readonly resolvedDisabled = computed(() => this.disabled() || this.split.disabled());
  readonly resolvedLoading = computed(() => this.loading() || this.split.loading());

  protected override readonly inert = resolveInertness({
    disabled: this.resolvedDisabled,
    focusableWhenDisabled: this.focusableWhenDisabled,
    loading: this.resolvedLoading,
  });
  override readonly waiting = resolveLoadingIndicator(this.resolvedLoading, this.loadingDelay);
}

/**
 * The keys of the Menu Button pattern, which `slMenuTriggerFor` answers on
 * this element and which a busy trigger has to refuse before it does.
 */
const OPENING_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Enter', ' ']);

/**
 * The menu trigger: `SlIconButton` hosting `slMenuTriggerFor` and carrying
 * this family's part. It takes `aria-haspopup`, `aria-expanded`,
 * `aria-controls` and the four keys of the Menu Button pattern from `menu`,
 * and every tone, variant and size from `button`. The chevron is the
 * family's, the `chevron-down` Glyph element in the icon part, which `button`
 * sizes; content the consumer writes replaces it; the accessible name is the consumer's, and `SlIconButton`
 * refuses to render without one in development.
 *
 * `slMenuTriggerFor` is a host directive rather than a second attribute the
 * consumer writes beside this one, and the order is the point: a host
 * directive's bindings run before the host's, so the `data-part` and the
 * `data-disabled` this component binds win over the `null` the trigger
 * binds for a control that is neither a bar's item nor a submenu's. The
 * write-back `toolbar`'s overflow needs is not needed here.
 *
 * While the root is loading the trigger is busy: `aria-disabled`, still in
 * the tab sequence, still named, still painted — no `data-disabled`, so
 * `button` does not paint it unavailable beside an action still in its
 * tone. The click is refused in the capture phase by `button`'s own guard,
 * and the opening keys are refused the same way here, before the trigger's
 * own listener sees them.
 */
@Component({
  selector: 'button[slSplitButtonMenuTrigger]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  /* The chevron is drawn unless the consumer wrote content of their own. */
  template: `<span data-part="icon" data-part-icon=""
    ><ng-content
      ><span slIcon><svg slGlyph name="chevron-down"></svg></span
    ></ng-content>
    @if (waiting()) {
      <span
        data-part="indicator"
        data-part-indicator=""
        data-ui="spinner"
        data-ui-spinner=""
        role="progressbar"
        [attr.aria-label]="t('loading')"
        ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8.875" />
          <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
      ></span>
    }
  </span>`,
  styleUrls: [
    '../../../styles/src/button/button.css',
    '../../../styles/src/spinner/spinner.css',
    '../../../styles/src/split-button/split-button.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slSplitButtonMenuTrigger',
  hostDirectives: [{ directive: SlMenuTrigger, inputs: ['slMenuTriggerFor'] }],
  host: {
    '[attr.data-part]': '"menu-trigger"',
    '[attr.data-part-root]': 'null',
    '[attr.data-part-menu-trigger]': "''",
    '[attr.data-disabled]': 'stateAttribute(resolvedDisabled())',
    '[attr.aria-disabled]': 'inert.ariaDisabled()',
    '[disabled]': 'inert.nativelyDisabled()',
  },
})
export class SlSplitButtonMenuTrigger extends SlIconButton {
  private readonly split = inject(SlSplitButton);

  readonly resolvedDisabled = computed(() => this.disabled() || this.split.disabled());
  /** The action is in flight and the menu waits with it. */
  readonly busy = computed(() => this.split.loading());

  protected override readonly inert = resolveInertness({
    disabled: this.resolvedDisabled,
    focusableWhenDisabled: this.focusableWhenDisabled,
    loading: this.busy,
  });

  constructor() {
    super();
    const element = inject(ElementRef<HTMLButtonElement>).nativeElement;
    const listener = (event: KeyboardEvent) => {
      if (this.busy() && OPENING_KEYS.has(event.key)) blockActivation(event);
    };
    element.addEventListener('keydown', listener, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      element.removeEventListener('keydown', listener, { capture: true }),
    );
  }
}

/**
 * The alternatives under `remember`: the consumer's `sl-menu-radio-group`,
 * bound both ways to the root's value. The group never owns the value — its
 * own request is cancelled once forwarded, and what it shows checked is
 * written back from the root, so a controlled root the consumer has not yet
 * moved shows nothing the consumer did not agree to. The DI tree is the
 * template tree, so the group finds the root above it however the layer is
 * portaled.
 */
@Directive({
  selector: 'sl-menu-radio-group[slSplitButtonChoices]',
  standalone: true,
  exportAs: 'slSplitButtonChoices',
})
export class SlSplitButtonChoices {
  private readonly group = inject(SlMenuRadioGroup, { self: true });
  private readonly split = inject(SlSplitButton);

  constructor() {
    if (!this.split.remember()) {
      throw new Error('slSplitButtonChoices needs a slSplitButton with `remember`.');
    }

    effect(() => {
      this.group.value.set(this.split.resolvedValue());
    });

    const subscription = this.group.valueChangeRequest.subscribe((request) => {
      this.split.select(request.value, request.reason as SplitButtonValueReason, request.source);
      request.cancel();
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }
}
