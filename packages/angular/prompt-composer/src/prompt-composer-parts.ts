import { createDictation, dictationSupported } from '@slotted/core/dictation';
import type { Dictation } from '@slotted/core/dictation';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { writeSelectorKey } from '@slotted/core/selector-key';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  DestroyRef,
  HostAttributeToken,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

import { SlPromptComposer } from './prompt-composer';

/** The band above the value: attachments, a quoted reply, a context chip. */
@Directive({
  selector: '[slPromptComposerHeader]',
  standalone: true,
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlPromptComposerHeader {}

/** The band below the value: tools on the start, the send at the end. */
@Directive({
  selector: '[slPromptComposerFooter]',
  standalone: true,
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlPromptComposerFooter {}

/**
 * A button of the consumer's in a band: a model menu, a tool, Cancelar.
 * `slMenuTriggerFor` on the same element binds `data-part` to `null`, and the
 * binding is a constant, so the part is written back once after the first
 * render — the rule `menu` records for its own trigger.
 */
@Directive({
  selector: 'button[slPromptComposerAction]',
  standalone: true,
  exportAs: 'slPromptComposerAction',
  host: { 'data-part': 'action', 'data-part-action': '', '[attr.type]': 'type' },
})
export class SlPromptComposerAction {
  protected readonly type = inject(new HostAttributeToken('type'), { optional: true }) ?? 'button';

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() => writeSelectorKey(element, 'part', 'action'));
  }
}

/**
 * The paperclip. It opens a file chooser it creates and never attaches to the
 * page, with the composer's `accept` and `multiple`; content projected into
 * the button replaces the mark.
 */
@Component({
  selector: 'button[slPromptComposerAttach]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon><svg slGlyph name="paperclip"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'attach',
    'data-part-attach': '',
    type: 'button',
    '[attr.aria-label]': "label ?? composer.t('attach')",
    '[disabled]': 'composer.off()',
    '(click)': 'open()',
  },
})
export class SlPromptComposerAttach {
  protected readonly composer = inject(SlPromptComposer);
  protected readonly label = inject(new HostAttributeToken('aria-label'), { optional: true });

  protected open() {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.multiple = this.composer.multiple();
    const accept = this.composer.accept();
    if (accept !== undefined) picker.accept = accept;
    picker.addEventListener(
      'change',
      (event) => this.composer.attachFiles(Array.from(picker.files ?? []), 'pointer', event),
      { once: true },
    );
    picker.click();
  }
}

/**
 * The microphone: dictation through the platform's speech recognition. Each
 * final phrase is written at the end of the value with reason `dictation`;
 * the button is pressed while the engine listens, and a second press stops
 * it. Where the platform has no recognition engine the button is not drawn.
 */
@Component({
  selector: 'button[slPromptComposerDictate]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content
    ><span slIcon><svg slGlyph name="mic"></svg></span
  ></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'dictate',
    'data-part-dictate': '',
    type: 'button',
    '[attr.aria-label]': "label ?? composer.t('dictate')",
    '[attr.aria-pressed]': "listening() ? 'true' : 'false'",
    '[disabled]': 'composer.off()',
    '[style.display]': "supported ? null : 'none'",
    '(click)': 'toggle()',
  },
})
export class SlPromptComposerDictate {
  protected readonly composer = inject(SlPromptComposer);
  protected readonly label = inject(new HostAttributeToken('aria-label'), { optional: true });
  /** The language the engine listens in, a BCP 47 tag. Defaults to the nearest `lang` attribute. */
  readonly lang = input<string | undefined>(undefined);
  protected readonly supported = dictationSupported();
  protected readonly listening = signal(false);
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private session: Dictation | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.session?.destroy());
  }

  protected toggle() {
    if (this.session?.listening) {
      this.session.stop();
      return;
    }
    this.session = createDictation({
      lang: this.lang() ?? this.element.closest('[lang]')?.getAttribute('lang') ?? undefined,
      onListeningChange: (next) => {
        this.listening.set(next);
        if (next)
          getLiveAnnouncer(this.element.ownerDocument).announce(this.composer.t('listening'));
      },
      onPhrase: (phrase) => this.composer.control()?.dictate(phrase),
    });
    this.session?.start();
  }
}

/**
 * The send. Round and named by the provider's label for its status; a padded
 * word when given text, which then names it. It turns into a busy ring while
 * the request travels, a stop inside the ring while the answer streams, and a
 * retry after an error.
 */
@Component({
  selector: 'button[slPromptComposerSubmit]',
  standalone: true,
  imports: [SlGlyph, SlIcon],
  template: `<ng-content>
    @switch (composer.status()) {
      @case ('submitted') {
        <span data-ui="spinner" data-ui-spinner="" aria-hidden="true"
          ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="8.875" />
            <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
        ></span>
      }
      @case ('streaming') {
        <span data-ui="spinner" data-ui-spinner="" aria-hidden="true"
          ><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="8.875" />
            <circle cx="12" cy="12" r="8.875" pathLength="100" /></svg
        ></span>
        <span slIcon><svg slGlyph name="stop"></svg></span>
      }
      @case ('error') {
        <span slIcon><svg slGlyph name="rotate-ccw"></svg></span>
      }
      @default {
        <span slIcon><svg slGlyph name="arrow-up"></svg></span>
      }
    }
  </ng-content>`,
  styleUrl: '../../../styles/src/spinner/spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'submit',
    'data-part-submit': '',
    '[attr.type]': "composer.busy() ? 'button' : 'submit'",
    '[attr.aria-label]': 'named() ? null : label()',
    '[attr.aria-disabled]': "composer.status() === 'submitted' ? 'true' : null",
    '[disabled]':
      "composer.status() === 'streaming' ? false : composer.status() !== 'submitted' && !composer.resolvedCanSubmit()",
    '(click)': 'activate($event)',
  },
})
export class SlPromptComposerSubmit {
  protected readonly composer = inject(SlPromptComposer);
  private readonly element: HTMLButtonElement = inject(ElementRef).nativeElement;
  /** Whether the consumer named the button with words of its own. */
  protected readonly named = signal(false);

  protected readonly label = computed(() => {
    const { t } = this.composer;
    switch (this.composer.status()) {
      case 'streaming':
        return t('stop');
      case 'submitted':
        return t('sending');
      case 'error':
        return t('retry');
      default:
        return t('send');
    }
  });

  constructor() {
    afterNextRender(() => this.named.set((this.element.textContent ?? '').trim() !== ''));
  }

  protected activate(event: MouseEvent) {
    event.preventDefault();
    const reason = event.detail === 0 ? 'keyboard' : 'pointer';
    const status = this.composer.status();
    if (status === 'streaming') this.composer.stopWith(reason, event);
    else if (status !== 'submitted') this.composer.submitWith(reason, event);
  }
}
