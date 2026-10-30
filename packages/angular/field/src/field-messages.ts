import {
  afterNextRender,
  type AfterContentChecked,
  booleanAttribute,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

import type {
  InlineMessageLive,
  InlineMessageMark,
  InlineMessageTone,
} from '@slotted/angular/inline-message';

/**
 * What the page wants said, and how — carried by the element the page writes
 * and read by the field, which renders the `inline-message` around it.
 *
 * The field renders the message rather than the page, because `SlInlineMessage`
 * takes its values as `input()` signals and nothing outside the template that
 * instantiates it can write one. A directive sharing the element could only set
 * attributes the component's own host bindings would then overwrite, and the
 * identifier the field derives is exactly such a value.
 */
@Directive()
export abstract class SlFieldMessage implements AfterContentChecked {
  /** Replaces the message's own tone. `inline-message` owns the five. */
  readonly tone = input<InlineMessageTone | undefined>(undefined);
  /** Whether the message announces itself when it arrives. */
  readonly live = input<InlineMessageLive | undefined>(undefined);
  /**
   * Which mark the message draws. A field's messages default to `none`, and
   * `glyph` asks for the tone's own silhouette, `dot` for one neutral bullet.
   */
  readonly mark = input<InlineMessageMark | undefined>(undefined);
  /** The word read before the message; the empty string removes it. */
  readonly prefix = input<string | undefined>(undefined);
  /** Draws no mark, for a message that carries its own artwork. */
  readonly hideIcon = input(false, { transform: booleanAttribute });
  /** Holds one line box open so nothing below moves when the message arrives. */
  readonly reserve = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly content = signal(false);

  /**
   * Whether the message has text to say. An empty one — a `reserve` line
   * waiting for its text — keeps its box and describes nothing, which is what
   * React's messages register.
   *
   * It is read after the template that declares the message writes its text
   * and before the host bindings of that template run, so the first render,
   * the only one a server performs, names exactly the messages that have text.
   * In the browser an observer also reports text that arrives from anywhere
   * else.
   */
  readonly hasContent = this.content.asReadonly();

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new MutationObserver(() => this.read());
      observer.observe(this.host, { characterData: true, childList: true, subtree: true });
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  ngAfterContentChecked() {
    this.read();
  }

  private read() {
    this.content.set((this.host.textContent ?? '').trim() !== '');
  }
}

/**
 * Help about the field, projected into the `inline-message` the field renders.
 *
 * It arrives with a tone, a mark, a clipped severity word an application
 * translates once and a reserved line — none of which the field reimplements.
 * `docs/process/build-order.md` states that as the reason `inline-message` was built
 * in wave 2.
 */
@Directive({
  selector: '[slFieldDescription]',
  standalone: true,
  exportAs: 'slFieldDescription',
})
export class SlFieldDescription extends SlFieldMessage {}

/**
 * What is wrong with the value, in words — which is what WCAG 2.2 SC 3.3.1
 * requires and what color and a mark alone do not satisfy.
 *
 * `tone` accepts the other four, so a warning that does not block submission is
 * the same part in another tone rather than a member of its own. Fluent spends
 * a `validationState` axis on that distinction and Carbon a second component.
 */
@Directive({
  selector: '[slFieldError]',
  standalone: true,
  exportAs: 'slFieldError',
})
export class SlFieldError extends SlFieldMessage {}
