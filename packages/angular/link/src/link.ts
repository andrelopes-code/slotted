import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { linkMessages, type LinkMessages, type PartialMessages } from '@slotted/core/i18n';

import { injectLinkDefaults } from './link-defaults';
import {
  LINK_DEFAULT_UNDERLINE,
  LINK_DEFAULT_VARIANT,
  type LinkSize,
  type LinkUnderline,
  type LinkVariant,
} from './link.constants';

/**
 * Text that goes somewhere. The directive sits on the consumer's own anchor,
 * so the role, `Enter`, the context menu, the middle click and every modified
 * click are the platform's — and `routerLink` composes on the same element,
 * because the element was never the family's to begin with. `button` owns the
 * action that has no URL, and `ButtonLink` the navigation that wants the
 * action surface.
 *
 * `rel` and `target` are written imperatively rather than through host
 * bindings, and only when the anchor carries neither. A host binding writes on
 * every change detection pass, and the value that means "leave it alone" is
 * `null`, which removes the attribute — so an anchor whose consumer binds
 * `[attr.target]` itself would lose it to this component. Adding what is
 * missing and touching nothing else is the only shape that keeps the
 * consumer's explicit value winning.
 */
@Component({
  selector: 'a[slLink]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  /**
   * The joiner is a text node of its own, before the marker and outside it:
   * what it forbids is the line break between the last word of the link and
   * the inline box that follows it. Every space in this template is therefore
   * load-bearing — Angular collapses a newline between two nodes into one
   * space, and a space before the joiner puts back exactly the break the
   * joiner exists to forbid. The formatter is told to leave it alone, and
   * `link.spec.ts` asserts the rendered text in case it stops listening. The
   * arrow mirrors in a right-to-left document, which is what `directional` is.
   */
  // prettier-ignore
  template: `<ng-content></ng-content>@if (newTab()) {&#8288;<span aria-hidden="true" data-part="external-icon" data-part-external-icon=""><span slIcon directional><svg slGlyph name="external"></svg></span></span><span data-part="external-hint" data-part-external-hint="" data-ui="visually-hidden" data-ui-visually-hidden="">{{ hint() }}</span>&#8288;}`,
  styleUrls: [
    '../../../styles/src/link/link.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slLink',
  host: {
    'data-ui': 'link',
    'data-ui-link': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-underline]': 'underlineValue()',
    '[attr.data-variant]': 'variantValue()',
    '[attr.data-size]': 'size() ?? null',
    '[attr.data-visited]': 'visitedValue() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.role]': 'disabled() ? "link" : null',
    '[attr.tabindex]': 'tabIndex()',
  },
})
export class SlLink {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly external = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force: the warning a link
   * to a new tab announces (`externalHint`).
   */
  readonly messages = input<PartialMessages<LinkMessages> | undefined>(undefined);
  /**
   * The text size. Unset, the link takes the size its action slot states — a stat card's, a
   * section's or a chart's actions — or else its parent's.
   */
  readonly size = input<LinkSize | undefined>(undefined);
  readonly underline = input<LinkUnderline | undefined>(undefined);
  readonly variant = input<LinkVariant | undefined>(undefined);
  readonly visited = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: optionalBoolean,
  });

  private readonly defaults = injectLinkDefaults();
  /** The family's words in the language in force, with this link's `messages` laid over them. */
  readonly t = injectMessages(linkMessages, this.messages);
  private readonly element = inject(ElementRef<HTMLAnchorElement>).nativeElement;
  private readonly renderer = inject(Renderer2);

  /**
   * What the consumer wrote on their own anchor, read once through the token
   * that exists for exactly this: a static attribute has to survive the
   * component that was placed on top of it.
   */
  private readonly ownRel = inject(new HostAttributeToken('rel'), { optional: true });
  private readonly ownTarget = inject(new HostAttributeToken('target'), { optional: true });
  private readonly ownTabIndex = inject(new HostAttributeToken('tabindex'), { optional: true });

  /** The destination the anchor had before it was made unavailable. */
  private withheldHref: string | null = null;

  readonly underlineValue = computed(
    () => this.underline() ?? this.defaults.underline ?? LINK_DEFAULT_UNDERLINE,
  );
  readonly variantValue = computed(
    () => this.variant() ?? this.defaults.variant ?? LINK_DEFAULT_VARIANT,
  );
  readonly visitedValue = computed(() => this.visited() ?? this.defaults.visited ?? false);

  /**
   * The fact, not the prop. `external` is the way to state it, and an anchor
   * the consumer already pointed at a new tab has stated the same thing.
   */
  readonly newTab = computed(() => this.external() || this.ownTarget === '_blank');
  readonly hint = computed(() => ` ${this.t('externalHint')}`);

  /**
   * A disabled link keeps its place in the tab sequence: without an `href` the
   * anchor would drop out of it, so the zero is stated rather than inherited.
   */
  readonly tabIndex = computed(() =>
    this.disabled() ? (this.ownTabIndex ?? '0') : this.ownTabIndex,
  );

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

    effect(() => {
      const newTab = this.newTab();
      this.write('target', newTab && this.ownTarget === null ? '_blank' : null);
      this.write('rel', newTab && this.ownRel === null ? 'noopener noreferrer' : null);
    });

    /**
     * An anchor that keeps its destination and only refuses `click` still
     * navigates on a middle click, on a modified click and from the context
     * menu. Taking the destination away is what actually disables it, and it
     * is given back the moment the link becomes available again.
     */
    effect(() => {
      if (this.disabled()) {
        this.withheldHref ??= this.element.getAttribute('href');
        this.renderer.removeAttribute(this.element, 'href');
        return;
      }
      if (this.withheldHref === null) return;
      this.renderer.setAttribute(this.element, 'href', this.withheldHref);
      this.withheldHref = null;
    });
  }

  /** Adds what the anchor is missing, and removes only what it added. */
  private write(attribute: 'rel' | 'target', value: string | null) {
    if (value !== null) {
      this.renderer.setAttribute(this.element, attribute, value);
      return;
    }
    const own = attribute === 'rel' ? this.ownRel : this.ownTarget;
    if (own === null) this.renderer.removeAttribute(this.element, attribute);
  }

  private refuse(event: Event) {
    if (!this.disabled()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
  }
}

/**
 * Absence has to survive the transform. `booleanAttribute` maps an unset input
 * to `false`, and `false` is a value: it would stop the application's own
 * decision about visited links from ever reaching a link that says nothing.
 */
function optionalBoolean(value: boolean | string | undefined) {
  return value === undefined ? undefined : booleanAttribute(value);
}
