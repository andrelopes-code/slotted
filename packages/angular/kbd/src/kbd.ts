import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { injectMessages } from '@slotted/angular/i18n';
import { keysMessages, type KeysMessages, type PartialMessages } from '@slotted/core/i18n';
import { resolveKey } from '@slotted/core/keys';

import { injectKbdDefaults, injectKbdPlatform } from './kbd-defaults';
import type { KbdPlatformInput, KbdSize, KbdVariant } from './kbd-defaults';
import { SlShortcutAxes } from './kbd-axes';

/**
 * One key of a keyboard, drawn so a reader can find it on theirs.
 *
 * The directive is written on the consumer's own `<kbd>`, which is the element
 * the HTML Standard defines for exactly this and the reason this binding needs
 * no `render` prop: substituting the element is Angular's default.
 *
 * It is not a control: nothing here is focusable, nothing answers hover, and
 * nothing binds a shortcut. Registering one is the application's, because WCAG
 * 2.2 2.1.4 Character Key Shortcuts can only be answered by whoever knows
 * whether the shortcut can be turned off.
 */
@Component({
  selector: 'kbd[slKbd]',
  standalone: true,
  exportAs: 'slKbd',
  /**
   * A named key wins over projected content, because it is the more specific of
   * two explicit instructions — and because content cannot be asked whether it
   * exists, so any rule that depended on the answer would be one only the React
   * binding could keep.
   *
   * Every space in this template is load-bearing: Angular collapses a newline
   * between two nodes into a space, and a space inside the legend would be a
   * space inside the key's word.
   */
  // prettier-ignore
  template: `<span data-part="legend" data-part-legend="" [attr.aria-hidden]="key() ? true : null" [attr.data-legend]="key()?.symbolic ? 'symbol' : null">@if (key(); as resolved) {{{ resolved.legend }}} @else {<ng-content></ng-content>}</span>@if (key()?.name; as name) {<span data-part="name" data-part-name="">{{ name }}</span>}`,
  styleUrl: '../../../styles/src/kbd/kbd.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'kbd',
    'data-ui-kbd': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-key]': 'key()?.token ?? null',
    '[attr.data-platform]': 'keyName() ? resolvedPlatform() : null',
    '[attr.data-disabled]': 'resolvedDisabled() ? "" : null',
  },
})
export class SlKbd {
  /**
   * A token from the vocabulary — `mod`, `meta`, `shift`, `escape`, `up` — or
   * any of its aliases. It resolves to the legend the reader's platform draws
   * and the word a screen reader hears in place of it.
   */
  readonly keyName = input<string | undefined>(undefined);
  /** Defaults to the combination, then to the provider, then to `auto`. */
  readonly platform = input<KbdPlatformInput | undefined>(undefined);
  /** Defaults to the combination, then to the provider, then to `md`. */
  readonly size = input<KbdSize | undefined>(undefined);
  /** Defaults to the combination, then to the provider, then to `raised`. */
  readonly variant = input<KbdVariant | undefined>(undefined);
  /**
   * Dims the key without claiming the item's semantics. `kbd` may carry only
   * the global ARIA attributes, and `aria-disabled` is not one of them, so the
   * row this key belongs to is what says it is unavailable.
   */
  readonly disabled = input(undefined, { transform: booleanAttribute });
  /**
   * Words laid over the `keys` catalog of the language in force, key by key:
   * `legends.*` for what a cap shows, `names.*` for what a reader hears.
   */
  readonly messages = input<PartialMessages<KeysMessages> | undefined>(undefined);

  private readonly defaults = injectKbdDefaults();
  private readonly platformOf = injectKbdPlatform();
  private readonly t = injectMessages(keysMessages, this.messages);
  /**
   * The combination this key sits in, when it sits in one. It is optional, so a
   * key written on its own works, and a key written by hand inside a `Shortcut`
   * is painted like the combination around it without repeating four inputs.
   */
  private readonly group = SlShortcutAxes.injectOptional();

  protected readonly resolvedPlatform = computed(() =>
    this.platformOf(this.platform() ?? this.group?.platform()),
  );
  protected readonly resolvedSize = computed(
    () => this.size() ?? this.group?.size() ?? this.defaults.size,
  );
  protected readonly resolvedVariant = computed(
    () => this.variant() ?? this.group?.variant() ?? this.defaults.variant,
  );
  protected readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.group?.disabled() ?? false,
  );

  protected readonly key = computed(() => {
    const token = this.keyName();
    if (token === undefined || token === '') return undefined;
    return resolveKey(token, {
      platform: this.resolvedPlatform(),
      t: this.t,
      legends: this.defaults.legends,
      names: this.defaults.names,
    });
  });
}
