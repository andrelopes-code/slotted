import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import type { GlyphName } from '@slotted/angular/icon';
import { writeToClipboard } from '@slotted/core/clipboard';
import {
  copyText,
  gutterDigits,
  leadingColumns,
  lineMarks,
  lineText,
  plainLines,
} from '@slotted/core/code';
import type { CodeHighlighter, CodeLine, CodeMarks, LineMark } from '@slotted/core/code';
import {
  codeBlockMessages,
  type CodeBlockMessages,
  type PartialMessages,
} from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { fileKind } from '@slotted/core/upload';
import { SlScrollArea, SlScrollAreaContent } from '@slotted/angular/scroll-area';
import type { ScrollEdgesState } from '@slotted/angular/scroll-area';
import { SlSkeleton } from '@slotted/angular/skeleton';

import {
  injectCodeBlockDefaults,
  type CodeBlockCopyRequest,
  type CodeBlockRevealedReason,
  type CodeBlockWrapReason,
} from './code-block.constants';

/** How long the check stays in place of the sheets. */
const COPIED_FOR = 2000;

const KIND_ICON: Record<string, GlyphName> = {
  archive: 'file-archive',
  audio: 'file-audio',
  document: 'file-type',
  image: 'file-image',
  pdf: 'file-text',
  presentation: 'presentation',
  spreadsheet: 'file-spreadsheet',
  video: 'file-video',
};

let counter = 0;

/** A control of the consumer's own, projected beside copy and wrap. */
@Directive({ selector: '[slCodeBlockAction]', standalone: true })
export class SlCodeBlockAction {}

/** What a `slCodeBlockLine` template is handed for one line. */
export interface CodeBlockLineContext {
  $implicit: CodeLine;
  number: number;
  mark: LineMark['mark'];
  dim: boolean;
}

/** Replaces the run of tokens a line draws. The gutter stays the family's. */
@Directive({ selector: 'ng-template[slCodeBlockLine]', standalone: true })
export class SlCodeBlockLine {
  readonly template = inject<TemplateRef<CodeBlockLineContext>>(TemplateRef);
}

/**
 * A block of source: a header that names the file and holds the two controls,
 * a body that is a `scroll-area`, and inside it a `pre` whose every line is a
 * grid row. Tokens come in from an engine outside the family and are drawn as
 * text in spans; HTML never does.
 */
@Component({
  selector: '[slCodeBlock]',
  standalone: true,
  imports: [NgTemplateOutlet, SlGlyph, SlIcon, SlScrollArea, SlScrollAreaContent, SlSkeleton],
  template: `
    @if (hasHeader()) {
      <div data-part="header" data-part-header="">
        @if (icon(); as glyph) {
          <span aria-hidden="true" data-part="icon" data-part-icon=""
            ><span slIcon><svg slGlyph [name]="glyph"></svg></span
          ></span>
        }
        @if (title(); as words) {
          <span data-part="title" data-part-title="" [id]="id + '-title'">{{ words }}</span>
        }
        @if (language() !== 'text') {
          <span data-part="language" data-part-language="">{{ language() }}</span>
        }
        @if (!loading()) {
          <div data-part="actions" data-part-actions="">
            <ng-content select="[slCodeBlockAction]"></ng-content>
            @if (overflow() || isWrapped()) {
              <button
                data-part="wrap"
                data-part-wrap=""
                type="button"
                [attr.aria-label]="t(isWrapped() ? 'unwrap' : 'wrap')"
                [attr.aria-pressed]="isWrapped()"
                [attr.data-pressed]="isWrapped() ? '' : null"
                (click)="toggleWrap($event)"
                (keydown)="remember($event)"
              >
                <span slIcon><svg slGlyph name="text-wrap"></svg></span>
              </button>
            }
            @if (copyControl()) {
              <button
                data-part="copy"
                data-part-copy=""
                type="button"
                [attr.aria-label]="t('copy')"
                [attr.data-complete]="copied() ? '' : null"
                (click)="copyFromControl($event)"
                (keydown)="remember($event)"
              >
                <!-- The check stands in for the sheets while the copy is confirmed. -->
                <span slIcon><svg slGlyph [name]="copied() ? 'check' : 'copy'"></svg></span>
              </button>
            }
          </div>
        }
      </div>
    }
    <div
      #body
      slScrollArea
      data-part="body"
      data-part-body=""
      [attr.data-part-root]="null"
      [axis]="maxLines() === undefined ? 'inline' : 'both'"
      fade="both"
      gutter="auto"
      [id]="id + '-body'"
      [messages]="{ label: regionName() }"
      [attr.data-max-lines]="maxLines() === undefined ? null : ''"
      (overflowChange)="onOverflow($event)"
    >
      <div slScrollAreaContent>
        <pre
          data-part="pre"
          data-part-pre=""
        ><code data-part="code" data-part-code="" [class]="'language-' + language()">@if (loading()) {@for (width of skeletonWidths; track $index) {<span slSkeleton shape="text" aria-hidden="true" [style.inline-size]="width + '%'"></span>}} @else {@for (line of rows(); track $index) {<span data-part="line" data-part-line="" [attr.data-line]="line.number" [attr.data-mark]="line.mark ?? null" [attr.data-dim]="line.dim ? '' : null" [style.--slotted-code-block-indent]="line.indent > 0 ? line.indent : null"><span aria-hidden="true" data-part="number" data-part-number="">@if (lineNumbersValue()) {{{ line.number }}}</span><span aria-hidden="true" data-part="marker" data-part-marker=""></span><span data-part="text" data-part-text="">@if (lineTemplate(); as custom) {<ng-container [ngTemplateOutlet]="custom.template" [ngTemplateOutletContext]="{ $implicit: line.tokens, number: line.number, mark: line.mark, dim: line.dim }" />} @else {@for (token of line.tokens; track $index) {@if (token.scope) {<span data-part="token" data-part-token="" [attr.data-token]="token.scope">{{ token.text }}</span>} @else {{{ token.text }}}}}</span></span>}}</code></pre>
      </div>
    </div>
    @if (collapses()) {
      <button
        data-part="reveal"
        data-part-reveal=""
        type="button"
        [attr.aria-controls]="id + '-body'"
        [attr.aria-expanded]="isRevealed()"
        (click)="toggleRevealed($event)"
        (keydown)="remember($event)"
      >
        {{ isRevealed() ? t('collapse') : t('reveal', { count: hiddenCount() }) }}
      </button>
    }
  `,
  styleUrl: '../../../styles/src/code-block/code-block.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slCodeBlock',
  host: {
    'data-ui': 'code-block',
    'data-ui-code-block': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-language]': 'language()',
    '[attr.data-wrap]': 'isWrapped() ? "" : null',
    '[attr.data-revealed]': 'isRevealed() ? "" : null',
    '[attr.data-collapse]': 'collapses() ? "" : null',
    '[attr.data-line-numbers]': 'lineNumbersValue() ? "" : null',
    '[attr.data-loading]': 'loading() ? "" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.data-empty]': 'code() === "" ? "" : null',
    '[attr.data-marks]': 'hasMarks() ? "" : null',
    '[attr.data-overflow]': 'overflow() ? "" : null',
    '[style.--slotted-code-block-digits]': 'digits()',
    '[style.--slotted-code-block-collapse]': 'collapses() ? collapseAfter() : null',
    '[style.--slotted-code-block-max-lines]': 'maxLines() ?? null',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class SlCodeBlock {
  /** The source, as text. Never HTML. */
  readonly code = input.required<string>();
  readonly language = input('text');
  /** The engine, outside the family. `null` refuses the one the provider set. */
  readonly highlight = input<CodeHighlighter | null | undefined>(undefined);
  /** Already-tokenized lines, when the consumer ran the engine itself. */
  readonly tokens = input<readonly CodeLine[] | undefined>(undefined);
  readonly title = input<string | undefined>(undefined);
  /** The file's name, for the glyph beside the title. Defaults to `title`. */
  readonly fileName = input<string | undefined>(undefined);
  readonly lineNumbers = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly start = input(1, { transform: numberAttribute });
  readonly marks = input<CodeMarks | undefined>(undefined);
  /** Present is controlled, for the life of the block. */
  readonly wrap = model<boolean | undefined>(undefined);
  /** Where an uncontrolled block starts, read once. */
  readonly defaultWrap = input(false, { transform: booleanAttribute });
  readonly collapseAfter = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly revealed = model<boolean | undefined>(undefined);
  readonly defaultRevealed = input(false, { transform: booleanAttribute });
  readonly isWrapped = computed(() => this.wrap() ?? this.defaultWrap());
  readonly isRevealed = computed(() => this.revealed() ?? this.defaultRevealed());
  readonly maxLines = input<number | undefined, number | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : numberAttribute(value)),
  });
  readonly copy = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly copyRemoved = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * scroll region's name when the block has no title (`region`), the controls,
   * and the announcements.
   */
  readonly messages = input<PartialMessages<CodeBlockMessages> | undefined>(undefined);
  readonly tabSize = input(2, { transform: numberAttribute });

  /** The request behind a wrap change, with the reason it carries. */
  readonly wrapChangeRequest = output<ChangeRequest<boolean>>();
  readonly revealedChangeRequest = output<ChangeRequest<boolean>>();
  /** What the copy control wrote, and whether the platform took it. */
  readonly copyRequest = output<CodeBlockCopyRequest>();
  readonly highlightError = output<unknown>();

  private readonly defaults = injectCodeBlockDefaults();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ariaLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly body = viewChild.required<SlScrollArea>('body');
  protected readonly lineTemplate = contentChild(SlCodeBlockLine);
  private readonly action = contentChild(SlCodeBlockAction);

  readonly id = `slotted-code-block-${(counter += 1)}`;
  protected readonly skeletonWidths = [62, 78, 44, 70];

  /** The family's words in the language in force, with this block's `messages` laid over them. */
  readonly t = injectMessages(codeBlockMessages, this.messages);
  protected readonly lineNumbersValue = computed(
    () => this.lineNumbers() ?? this.defaults.lineNumbers ?? false,
  );
  protected readonly copyControl = computed(() => this.copy() ?? this.defaults.copy ?? true);
  private readonly engine = computed(() => {
    const own = this.highlight();
    return own === null ? undefined : (own ?? this.defaults.highlight);
  });

  private readonly resolved = signal<{ code: string; lines: readonly CodeLine[] } | null>(null);
  protected readonly copied = signal(false);
  protected readonly overflow = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private keyed = false;

  private readonly lines = computed<readonly CodeLine[]>(() => {
    const tokens = this.tokens();
    if (tokens) return tokens;
    const resolved = this.resolved();
    return resolved && resolved.code === this.code() ? resolved.lines : plainLines(this.code());
  });

  private readonly marksByLine = computed(() => lineMarks(this.marks(), this.lines().length));
  protected readonly hasMarks = computed(() =>
    this.marksByLine().some((entry) => entry.mark !== undefined || entry.dim),
  );

  protected readonly rows = computed(() => {
    const marks = this.marksByLine();
    const start = this.start();
    const wrap = this.isWrapped();
    const tabSize = this.tabSize();
    return this.lines().map((tokens, index) => ({
      dim: marks[index]?.dim ?? false,
      indent: wrap ? leadingColumns(lineText(tokens), tabSize) : 0,
      mark: marks[index]?.mark,
      number: start + index,
      tokens,
    }));
  });

  protected readonly digits = computed(() => gutterDigits(this.lines().length, this.start()));
  protected readonly collapses = computed(() => {
    const after = this.collapseAfter();
    return after !== undefined && this.lines().length > after;
  });
  protected readonly hiddenCount = computed(() =>
    this.collapses() ? this.lines().length - (this.collapseAfter() ?? 0) : 0,
  );
  protected readonly hasHeader = computed(
    () =>
      this.title() !== undefined ||
      this.language() !== 'text' ||
      this.copyControl() ||
      this.action() !== undefined,
  );
  protected readonly icon = computed(() => {
    const name = this.fileName() ?? this.title();
    if (!name || this.title() === undefined) return undefined;
    return KIND_ICON[fileKind({ name, type: '' })] ?? 'file';
  });
  protected readonly regionName = computed(
    () => this.title() ?? this.ariaLabel ?? this.t('region'),
  );

  constructor() {
    /* The engine runs after the first paint and its lines are swapped in. */
    effect((onCleanup) => {
      const engine = this.engine();
      const code = this.code();
      const language = this.language();
      if (!engine || this.tokens()) return;
      let live = true;
      onCleanup(() => {
        live = false;
      });
      Promise.resolve()
        .then(() => engine(code, language))
        .then((lines) => {
          if (live) this.resolved.set({ code, lines });
        })
        .catch((error: unknown) => {
          if (live) this.highlightError.emit(error);
        });
    });
    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  protected onOverflow(state: ScrollEdgesState) {
    this.overflow.set(state.inline.overflowing);
  }

  /** `Enter` and `Space` both end in a click; whether a key came first decides the reason. */
  protected remember(event: KeyboardEvent) {
    this.keyed = event.key === 'Enter' || event.key === ' ';
  }

  private takeReason(): 'pointer' | 'keyboard' {
    const reason = this.keyed ? 'keyboard' : 'pointer';
    this.keyed = false;
    return reason;
  }

  protected toggleWrap(event?: Event) {
    this.requestWrap(!this.isWrapped(), this.takeReason(), event);
  }

  requestWrap(next: boolean, reason: CodeBlockWrapReason, source?: Event) {
    const state = createControllable<boolean>({
      initial: this.isWrapped(),
      onRequest: (request) => this.wrapChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.wrap.set(next);
  }

  protected toggleRevealed(event?: Event) {
    this.requestRevealed(!this.isRevealed(), this.takeReason(), event);
  }

  requestRevealed(next: boolean, reason: CodeBlockRevealedReason, source?: Event) {
    const state = createControllable<boolean>({
      initial: this.isRevealed(),
      onRequest: (request) => this.revealedChangeRequest.emit(request),
    });
    if (state.request(next, reason, source)) this.revealed.set(next);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.key !== 'Escape') return;
    if (!untracked(this.collapses) || !untracked(this.revealed)) return;
    event.preventDefault();
    this.requestRevealed(false, 'escape', event);
    this.body().focus();
  }

  protected copyFromControl(event: Event) {
    void this.write(this.takeReason(), event);
  }

  /** Writes the code to the clipboard, as the control does. */
  copyCode(): Promise<boolean> {
    return this.write('keyboard');
  }

  private async write(reason: 'pointer' | 'keyboard', source?: Event): Promise<boolean> {
    const value = copyText(this.code(), this.marks(), { includeRemoved: this.copyRemoved() });
    const done = (await writeToClipboard(value)) !== 'refused';
    if (done) {
      this.copied.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), COPIED_FOR);
    }
    getLiveAnnouncer(this.host.nativeElement.ownerDocument).announce(
      this.t(done ? 'copied' : 'copyFailed'),
    );
    this.copyRequest.emit({ copied: done, reason, source, value });
    return done;
  }

  /** Brings a one-based line into view. */
  scrollToLine(line: number) {
    const element = this.host.nativeElement.querySelector<HTMLElement>(`[data-line='${line}']`);
    if (element) this.body().reveal(element);
  }
}
