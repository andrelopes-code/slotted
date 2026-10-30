import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { blockActivation, resolveAppearance, stateAttribute } from './button-appearance';
import {
  BUTTON_LINK_DEFAULTS,
  type ButtonJustify,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button.constants';

/**
 * Navigation wearing the action surface. The element is an `a`, so activation,
 * the context menu and every modified click stay the platform's, and Space
 * does not activate it because Space does not activate a link. `routerLink`
 * works on it for the same reason: the component is a directive on the
 * consumer's own anchor.
 *
 * A disabled link keeps no `href`. An anchor that keeps its destination and
 * only blocks `click` still navigates on a middle click and on a modified
 * click; taking the destination away is what actually disables it. It stays in
 * the tab sequence with `role="link"` and `aria-disabled`, because a control a
 * keyboard user cannot reach is one they cannot discover is unavailable.
 */
@Component({
  selector: 'a[slButtonLink]',
  standalone: true,
  template: `<ng-content select="[slButtonStart]"></ng-content
    ><span data-part="label" data-part-label=""><ng-content></ng-content></span
    ><ng-content select="[slButtonEnd]"></ng-content>`,
  styleUrl: '../../../styles/src/button/button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slButtonLink',
  host: {
    'data-ui': 'button',
    'data-ui-button': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
    '[attr.role]': "disabled() ? 'link' : null",
    '[attr.href]': 'disabled() ? null : href()',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.data-tone]': 'appearance.tone()',
    '[attr.data-variant]': 'appearance.variant()',
    '[attr.data-size]': 'appearance.size()',
    '[attr.data-full-width]': 'stateAttribute(fullWidth())',
    '[attr.data-justify]': 'justify()',
    '[attr.data-disabled]': 'stateAttribute(disabled())',
  },
})
export class SlButtonLink {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /**
   * Where the content sits along the inline axis. `between` sets the label at
   * the start and the end slot at the inline end, as a field trigger reads;
   * the start slot stays beside the label.
   */
  readonly justify = input<ButtonJustify>('center');
  readonly size = input<ButtonSize | undefined>(undefined);
  readonly tone = input<ButtonTone | undefined>(undefined);
  readonly variant = input<ButtonVariant | undefined>(undefined);
  /**
   * The destination, when the anchor is not driven by a router. A `routerLink`
   * on the same element writes the `href` itself, and this input stays unset.
   */
  readonly href = input<string | undefined>(undefined);

  readonly stateAttribute = stateAttribute;
  protected readonly appearance = resolveAppearance(this, BUTTON_LINK_DEFAULTS);
  /**
   * A disabled link keeps its place in the tab sequence: without an `href` the
   * anchor would drop out of it, so the zero is stated rather than inherited.
   */
  readonly tabIndex = computed(() => (this.disabled() ? 0 : null));

  constructor() {
    const element = inject(ElementRef<HTMLAnchorElement>).nativeElement;
    const destroyRef = inject(DestroyRef);
    const listen = (type: 'click' | 'auxclick' | 'keydown', listener: EventListener) => {
      element.addEventListener(type, listener, { capture: true });
      destroyRef.onDestroy(() => element.removeEventListener(type, listener, { capture: true }));
    };

    listen('click', (event) => this.refuse(event));
    listen('auxclick', (event) => this.refuse(event));
    listen('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Enter') this.refuse(event);
    });
  }

  private refuse(event: Event) {
    if (this.disabled()) blockActivation(event);
  }
}
