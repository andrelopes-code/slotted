import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  isDevMode,
  ViewEncapsulation,
} from '@angular/core';

import { blockActivation, resolveAppearance, stateAttribute } from './button-appearance';
import {
  ICON_BUTTON_DEFAULTS,
  type ButtonShape,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './button.constants';

/**
 * SlIconButton on an anchor: the surface, the shape and the mandatory name of
 * the icon button, and the navigation of SlButtonLink. `routerLink` works on
 * the same anchor and writes its `href`. A disabled link keeps no `href`,
 * stays in the tab sequence with `role="link"` and says `aria-disabled`.
 */
@Component({
  selector: 'a[slIconButtonLink]',
  standalone: true,
  template: `<span data-part="icon" data-part-icon=""><ng-content></ng-content></span>`,
  styleUrl: '../../../styles/src/button/button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slIconButtonLink',
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
    '[attr.data-shape]': 'shape()',
    '[attr.data-disabled]': 'stateAttribute(disabled())',
  },
})
export class SlIconButtonLink implements AfterViewInit {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly shape = input<ButtonShape>(ICON_BUTTON_DEFAULTS.shape);
  readonly size = input<ButtonSize | undefined>(undefined);
  readonly tone = input<ButtonTone | undefined>(undefined);
  readonly variant = input<ButtonVariant | undefined>(undefined);
  /**
   * The destination, when the anchor is not driven by a router. A `routerLink`
   * on the same element writes the `href` itself, and this input stays unset.
   */
  readonly href = input<string | undefined>(undefined);

  readonly stateAttribute = stateAttribute;
  protected readonly appearance = resolveAppearance(this, ICON_BUTTON_DEFAULTS);
  /** Without an `href` the anchor would leave the tab sequence, so the zero is stated. */
  readonly tabIndex = computed(() => (this.disabled() ? 0 : null));

  private readonly element = inject(ElementRef<HTMLAnchorElement>).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const listen = (type: 'click' | 'auxclick' | 'keydown', listener: EventListener) => {
      this.element.addEventListener(type, listener, { capture: true });
      destroyRef.onDestroy(() =>
        this.element.removeEventListener(type, listener, { capture: true }),
      );
    };

    listen('click', (event) => this.refuse(event));
    listen('auxclick', (event) => this.refuse(event));
    listen('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Enter') this.refuse(event);
    });
  }

  ngAfterViewInit() {
    if (!isDevMode()) return;

    const label = this.element.getAttribute('aria-label');
    const labelledBy = this.element.getAttribute('aria-labelledby');
    if (!label?.trim() && !labelledBy?.trim()) {
      throw new Error('SlIconButtonLink requires aria-label or aria-labelledby');
    }
  }

  private refuse(event: Event) {
    if (this.disabled()) blockActivation(event);
  }
}
