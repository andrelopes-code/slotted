import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { injectMessages } from '@slotted/angular/i18n';
import { keysMessages, type KeysMessages, type PartialMessages } from '@slotted/core/i18n';
import { resolveShortcut } from '@slotted/core/keys';

import { SlShortcutAxes } from './kbd-axes';
import { injectKbdDefaults, injectKbdPlatform } from './kbd-defaults';
import type { KbdPlatformInput, KbdSize, KbdVariant } from './kbd-defaults';

/**
 * A whole key combination, and the element the HTML Standard says it is:
 * “nesting a `kbd` element within another `kbd` element represents an actual key
 * or other unit of input as a portion of a larger input”. shadcn's `KbdGroup` is
 * a `div`, and Chakra and Radix put the whole combination inside one `kbd` as
 * text; this is the markup the specification describes.
 *
 * `keys` is written once and rendered for the reader's platform. The modifiers
 * are reordered into that platform's own convention — the Apple Style Guide
 * writes Fn, Control, Option, Shift, Command, and Microsoft writes the Windows
 * key ahead of Ctrl, Alt and Shift — so one authored string is right on both.
 * The escape hatch is composition rather than a fifth input: keys projected into
 * this element are rendered exactly as written.
 */
@Component({
  selector: 'kbd[slShortcut]',
  standalone: true,
  exportAs: 'slShortcut',
  /**
   * The key markup is written here as well as in `SlKbd`, because a rendered key
   * has no token to hand back to that component — the combination resolved it
   * already, under its own `legends` and `names`. The two are held identical by
   * `kbd.spec.ts`, which renders the same key both ways and compares the DOM,
   * rather than by a shared helper that could only serve one of them.
   *
   * Every space is load-bearing: Angular collapses a newline between two nodes
   * into a space, and a space between two caps is a space the gap already owns.
   */
  // prettier-ignore
  template: `@if (resolved(); as shortcut) {@for (step of shortcut.steps; track $index) {@if (!$first) {<span data-part="separator" data-part-separator="" data-separator="then">{{ shortcut.thenLabel }}</span>}@for (key of step; track $index) {@if (!$first && shortcut.separator) {<span aria-hidden="true" data-part="separator" data-part-separator="" data-separator="plus">{{ shortcut.separator }}</span>}<kbd data-ui="kbd" data-ui-kbd="" data-part="root" data-part-root="" [attr.data-key]="key.token" [attr.data-platform]="shortcut.platform" [attr.data-size]="resolvedSize()" [attr.data-variant]="resolvedVariant()" [attr.data-disabled]="disabled() ? '' : null"><span data-part="legend" data-part-legend="" aria-hidden="true" [attr.data-legend]="key.symbolic ? 'symbol' : null">{{ key.legend }}</span>@if (key.name; as name) {<span data-part="name" data-part-name="">{{ name }}</span>}</kbd>}}} @else {<ng-content></ng-content>}`,
  styleUrl: '../../../styles/src/kbd/kbd.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: SlShortcutAxes.token,
      /* The decorator runs before the class binding exists. */
      useExisting: forwardRef(() => SlShortcut),
    },
  ],
  host: {
    'data-ui': 'kbd',
    'data-ui-kbd': '',
    'data-part': 'shortcut',
    'data-part-shortcut': '',
    '[attr.data-platform]': 'resolvedPlatform()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    /**
     * A combination with nothing in it is nothing, not an empty cap at the end
     * of a row announcing that a shortcut exists. The React binding returns
     * nothing; this directive is written on an element the consumer owns, so it
     * cannot un-write it, and `display: none` is the same outcome the platform
     * can give from here. The inline style is what beats the family's own
     * `display: inline-flex`, which the `hidden` attribute would lose to.
     */
    '[style.display]': 'empty() ? "none" : null',
  },
})
export class SlShortcut {
  /**
   * The shortcut, written once: `+` joins keys pressed together and whitespace
   * joins the steps of a sequence.
   */
  readonly keys = input<string | undefined>(undefined);
  /** Defaults to the provider, then to `auto`. */
  readonly platform = input<KbdPlatformInput | undefined>(undefined);
  /** Defaults to the provider, then to `md`. */
  readonly size = input<KbdSize | undefined>(undefined);
  /** Defaults to the provider, then to `raised`. */
  readonly variant = input<KbdVariant | undefined>(undefined);
  readonly disabled = input(undefined, { transform: booleanAttribute });
  /** Between two simultaneous keys. Defaults to the provider, then to `+`. */
  readonly separator = input<string | undefined>(undefined);
  /**
   * Words laid over the `keys` catalog of the language in force, key by key:
   * `legends.*`, `names.*`, and `then` between two steps of a sequence.
   */
  readonly messages = input<PartialMessages<KeysMessages> | undefined>(undefined);
  /** Replaces what the eye sees, per key token. Defaults to the provider. */
  readonly legends = input<Readonly<Record<string, string>> | undefined>(undefined);
  /** Replaces what a reader hears, per key token. Defaults to the provider. */
  readonly names = input<Readonly<Record<string, string>> | undefined>(undefined);

  private readonly defaults = injectKbdDefaults();
  private readonly platformOf = injectKbdPlatform();
  private readonly t = injectMessages(keysMessages, this.messages);

  protected readonly resolvedPlatform = computed(() => this.platformOf(this.platform()));
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);

  protected readonly resolved = computed(() => {
    const keys = this.keys();
    if (keys === undefined) return undefined;
    return resolveShortcut(keys, {
      platform: this.resolvedPlatform(),
      t: this.t,
      legends: this.legends() ?? this.defaults.legends,
      names: this.names() ?? this.defaults.names,
      separator: this.separator() ?? this.defaults.separator,
    });
  });

  protected readonly empty = computed(() => this.resolved()?.steps.length === 0);
}
