import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';
import { completeMarkdown, parseMarkdown, prepareMarkdown } from '@slotted/core/markdown';
import type {
  MarkdownAlertElement,
  MarkdownElement,
  MarkdownFootnote,
  MarkdownItemElement,
  MarkdownKind,
  MarkdownNode,
  MarkdownUrlKind,
} from '@slotted/core/markdown';
import type { ChangeRequest } from '@slotted/core/state';
import { injectMessages } from '@slotted/angular/i18n';
import { markdownMessages, type MarkdownMessages, type PartialMessages } from '@slotted/core/i18n';
import { SlAlert, SlAlertContent, SlAlertDescription, SlAlertTitle } from '@slotted/angular/alert';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlCodeBlock } from '@slotted/angular/code-block';
import { SlInlineMessage } from '@slotted/angular/inline-message';
import { SlLink } from '@slotted/angular/link';
import type { ProseFlow, ProseSize } from '@slotted/angular/prose';
import {
  injectProseDefaults,
  SlProse,
  SlProseAnchor,
  SlProseFootnotes,
  SlProseScroll,
} from '@slotted/angular/prose';
import {
  injectSkeletonDefaults,
  SlSkeletonRegion,
  SlSkeletonText,
} from '@slotted/angular/skeleton';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

import { injectMarkdownDefaults, type MarkdownExternal } from './markdown-defaults';

/** Whether the source arrived. `loading` is separate, because a refresh keeps what is on screen. */
export type MarkdownStatus = 'ready' | 'error';

/** What a task checkbox asks for; the box moves when the consumer's tree does. */
export interface MarkdownTaskChange {
  index: number;
  checked: boolean;
  offset: number | null;
  request: ChangeRequest<boolean>;
}

/** Whether the retry was a press with a pointer or with a key. */
export type MarkdownRetryReason = 'pointer' | 'keyboard';

type KeysOf<U> = U extends unknown ? keyof U : never;
type ValueOf<U, K extends PropertyKey> = U extends unknown
  ? K extends keyof U
    ? U[K]
    : never
  : never;

/**
 * A prepared element as a template reads it: every field any kind carries,
 * optional. A template names one kind, and Angular's type checker cannot
 * narrow a union on the string the directive was given, so the fields of the
 * kind it names have to be reachable without a cast.
 */
export type MarkdownTemplateElement = { readonly kind: MarkdownKind; readonly key: string } & {
  readonly [K in Exclude<KeysOf<MarkdownElement>, 'kind' | 'key'>]?: ValueOf<MarkdownElement, K>;
};

/** What a node template receives. */
export interface MarkdownNodeContext {
  $implicit: MarkdownTemplateElement;
}

/**
 * Replaces the family's element for one kind — `link`, `code`, `image` — or
 * renders a node type the family does not know — `math`, `html`, a directive
 * — by the node's own `type`. The template receives the prepared element; its
 * children are rendered with `slMarkdownChildren`.
 */
@Directive({ selector: 'ng-template[slMarkdownNode]', standalone: true })
export class SlMarkdownNode {
  readonly kind = input.required<string>({ alias: 'slMarkdownNode' });
  readonly template = inject<TemplateRef<MarkdownNodeContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: SlMarkdownNode,
    context: unknown,
  ): context is MarkdownNodeContext {
    return context !== null;
  }
}

/** The empty part's content, projected in place of `messages.empty`. */
@Directive({ selector: '[slMarkdownEmpty]', standalone: true })
export class SlMarkdownEmpty {}

const KINDS = new Set<string>([
  'heading',
  'paragraph',
  'blockquote',
  'alert',
  'list',
  'item',
  'code',
  'thematicBreak',
  'table',
  'text',
  'emphasis',
  'strong',
  'delete',
  'inlineCode',
  'break',
  'link',
  'image',
  'footnoteReference',
] satisfies MarkdownKind[]);

/**
 * A document rendered from a tree, in `prose`'s typography.
 *
 * The family never receives HTML. It takes mdast — remark's output as it is,
 * or marked's through `fromMarkedTokens` — and `prepareMarkdown` from
 * `@slotted/core/markdown` decides everything that is not an element. This
 * component maps each prepared kind to an element, or to the family that
 * already owns it: `slLink`, `slCodeBlock`, `slAlert`, `slCheckbox`.
 *
 * The document is one recursive `ng-template` rendered through
 * `NgTemplateOutlet`, never a recursive component: a component host between
 * a `ul` and its `li`, or between the region and its first block, would break
 * `prose`'s child combinators.
 */
@Component({
  selector: '[slMarkdown]',
  standalone: true,
  exportAs: 'slMarkdown',
  imports: [
    NgTemplateOutlet,
    SlAlert,
    SlAlertContent,
    SlAlertDescription,
    SlAlertTitle,
    SlButton,
    SlCheckbox,
    SlCodeBlock,
    SlGlyph,
    SlIcon,
    SlInlineMessage,
    SlLink,
    SlProse,
    SlProseAnchor,
    SlProseFootnotes,
    SlProseScroll,
    SlSkeletonRegion,
    SlSkeletonText,
    SlVisuallyHidden,
  ],
  template: `
    @if (status() === 'error') {
      <div data-part="error" data-part-error="">
        <p slInlineMessage tone="danger">{{ t('error') }}</p>
        @if (retryable()) {
          <button
            slButton
            type="button"
            size="sm"
            tone="secondary"
            variant="outline"
            (click)="retry.emit($event.detail === 0 ? 'keyboard' : 'pointer')"
          >
            {{ t('retry') }}
          </button>
        }
      </div>
    } @else if (painted()) {
      <div slSkeletonRegion [delay]="0" [minDuration]="0" [messages]="{ label: t('loading') }">
        <div slProse [flow]="resolvedFlow()" [size]="size()">
          <div slSkeletonText lastLineSize="62%" [lines]="3"></div>
        </div>
      </div>
    } @else if (document().empty) {
      @if (!loading()) {
        <p data-part="empty" data-part-empty="">
          <ng-content select="[slMarkdownEmpty]">{{ t('empty') }}</ng-content>
        </p>
      }
    } @else {
      <div slProse [flow]="resolvedFlow()" [size]="size()">
        <ng-container *ngTemplateOutlet="nodes; context: { $implicit: document().children }" />
        @if (document().footnotes.length > 0) {
          <section slProseFootnotes>
            <h2 slVisuallyHidden [id]="document().footnoteLabelId">
              {{ t('footnotes') }}
            </h2>
            <ol>
              @for (footnote of document().footnotes; track footnote.key) {
                <li [id]="footnote.id">
                  <ng-container
                    *ngTemplateOutlet="nodes; context: { $implicit: footnoteLead(footnote) }"
                  />
                  @if (footnoteTail(footnote); as last) {
                    <p>
                      <ng-container
                        *ngTemplateOutlet="nodes; context: { $implicit: last.children }"
                      /><ng-container
                        *ngTemplateOutlet="backrefs; context: { $implicit: footnote }"
                      />
                    </p>
                  } @else {
                    <ng-container *ngTemplateOutlet="backrefs; context: { $implicit: footnote }" />
                  }
                </li>
              }
            </ol>
          </section>
        }
      </div>
    }

    <ng-template #backrefs let-footnote>
      @for (reference of footnote.references; track reference; let index = $index) {
        <a
          data-part="backref"
          data-part-backref=""
          [href]="'#' + reference"
          [attr.aria-label]="t('backReference', { number: footnote.number, occurrence: index + 1 })"
          ><span slIcon><svg slGlyph name="arrow-left"></svg></span
        ></a>
      }
    </ng-template>

    <ng-template #nodes let-elements>
      @for (element of elements; track element.key) {
        @if (templateFor(element); as custom) {
          <ng-container *ngTemplateOutlet="custom; context: { $implicit: element }" />
        } @else {
          @switch (element.kind) {
            @case ('text') {
              <ng-container>{{ element.value }}</ng-container>
            }
            @case ('inlineCode') {
              <code>{{ element.value }}</code>
            }
            @case ('break') {
              <br />
            }
            @case ('thematicBreak') {
              <hr />
            }
            @case ('paragraph') {
              <p>
                <ng-container *ngTemplateOutlet="nodes; context: { $implicit: element.children }" />
              </p>
            }
            @case ('emphasis') {
              <em
                ><ng-container *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
              /></em>
            }
            @case ('strong') {
              <strong
                ><ng-container *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
              /></strong>
            }
            @case ('delete') {
              <del
                ><ng-container *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
              /></del>
            }
            @case ('blockquote') {
              <blockquote>
                <ng-container *ngTemplateOutlet="nodes; context: { $implicit: element.children }" />
              </blockquote>
            }
            @case ('heading') {
              @switch (element.level) {
                @case (1) {
                  <h1 [id]="element.id">
                    <ng-container *ngTemplateOutlet="heading; context: { $implicit: element }" />
                  </h1>
                }
                @case (2) {
                  <h2 [id]="element.id">
                    <ng-container *ngTemplateOutlet="heading; context: { $implicit: element }" />
                  </h2>
                }
                @case (3) {
                  <h3 [id]="element.id">
                    <ng-container *ngTemplateOutlet="heading; context: { $implicit: element }" />
                  </h3>
                }
                @case (4) {
                  <h4 [id]="element.id">
                    <ng-container *ngTemplateOutlet="heading; context: { $implicit: element }" />
                  </h4>
                }
                @case (5) {
                  <h5 [id]="element.id">
                    <ng-container *ngTemplateOutlet="heading; context: { $implicit: element }" />
                  </h5>
                }
                @default {
                  <h6 [id]="element.id">
                    <ng-container *ngTemplateOutlet="heading; context: { $implicit: element }" />
                  </h6>
                }
              }
            }
            @case ('alert') {
              <div data-part="embed" data-part-embed="">
                <section slAlert reach="section" live="off" [tone]="element.tone">
                  <div slAlertContent>
                    <div slAlertTitle>{{ alertTitle(element) }}</div>
                    <div slAlertDescription>
                      <div data-part="alert-body" data-part-alert-body="">
                        <ng-container
                          *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            }
            @case ('list') {
              @if (element.ordered) {
                <ol
                  [attr.data-part]="element.task ? 'task-list' : null"
                  [attr.data-part-task-list]="element.task ? '' : null"
                  [attr.start]="element.start"
                >
                  <ng-container
                    *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
                  />
                </ol>
              } @else {
                <ul
                  [attr.data-part]="element.task ? 'task-list' : null"
                  [attr.data-part-task-list]="element.task ? '' : null"
                >
                  <ng-container
                    *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
                  />
                </ul>
              }
            }
            @case ('item') {
              @if (element.checked === null) {
                <li>
                  <ng-container
                    *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
                  />
                </li>
              } @else {
                <li data-part="task" data-part-task="">
                  <div
                    slCheckbox
                    [checked]="element.checked"
                    [readOnly]="!editableTasks() || undefined"
                    (checkedChange)="onTask(element, $event)"
                  >
                    <span slVisuallyHidden>{{ element.label }}</span>
                  </div>
                  <div data-part="task-body" data-part-task-body="">
                    <ng-container
                      *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
                    />
                  </div>
                </li>
              }
            }
            @case ('code') {
              <div data-part="embed" data-part-embed="">
                <div
                  slCodeBlock
                  [code]="element.code"
                  [language]="element.language ?? 'text'"
                  [title]="element.title ?? undefined"
                  [lineNumbers]="element.lineNumbers || undefined"
                  [marks]="
                    element.highlight === null ? undefined : { highlight: element.highlight }
                  "
                ></div>
              </div>
            }
            @case ('table') {
              <div slProseScroll>
                <table>
                  <thead>
                    <tr>
                      @for (cell of element.head; track cell.key) {
                        <th scope="col" [attr.data-align]="cell.align">
                          <ng-container
                            *ngTemplateOutlet="nodes; context: { $implicit: cell.children }"
                          />
                        </th>
                      }
                    </tr>
                  </thead>
                  @if (element.rows.length > 0) {
                    <tbody>
                      @for (row of element.rows; track $index) {
                        <tr>
                          @for (cell of row; track cell.key) {
                            <td [attr.data-align]="cell.align">
                              <ng-container
                                *ngTemplateOutlet="nodes; context: { $implicit: cell.children }"
                              />
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  }
                </table>
              </div>
            }
            @case ('link') {
              @if (element.external && resolvedExternal() === 'new-tab') {
                <a slLink external [href]="element.href" [attr.title]="element.title"
                  ><ng-container
                    *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
                /></a>
              } @else {
                <a [href]="element.href" [attr.title]="element.title"
                  ><ng-container
                    *ngTemplateOutlet="nodes; context: { $implicit: element.children }"
                /></a>
              }
            }
            @case ('image') {
              <img
                [src]="element.src"
                [alt]="element.alt"
                [attr.title]="element.title"
                loading="lazy"
                decoding="async"
              />
            }
            @case ('footnoteReference') {
              <sup
                ><a
                  data-footnote-ref=""
                  [id]="element.id"
                  [href]="'#' + element.target"
                  [attr.aria-describedby]="document().footnoteLabelId"
                  >{{ element.number }}</a
                ></sup
              >
            }
            @case ('custom') {
              <ng-container *ngTemplateOutlet="nodes; context: { $implicit: element.children }" />
            }
          }
        }
      }
    </ng-template>

    <ng-template #heading let-element>
      <ng-container *ngTemplateOutlet="nodes; context: { $implicit: element.children }" />
      @if (resolvedHeadingAnchors()) {
        <a
          slProseAnchor
          [href]="'#' + element.id"
          [attr.aria-label]="t('anchor', { heading: element.text })"
          >#</a
        >
      }
    </ng-template>
  `,
  styleUrl: '../../../styles/src/markdown/markdown.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'markdown',
    'data-ui-markdown': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-status]': 'status()',
    '[attr.data-flow]': 'resolvedFlow()',
    '[attr.data-loading]': "painted() ? '' : null",
    '[attr.data-empty]': "status() === 'ready' && !painted() && document().empty ? '' : null",
    '[attr.data-streaming]': "streaming() ? '' : null",
    '[attr.aria-busy]': "streaming() || painted() ? 'true' : null",
  },
})
export class SlMarkdown {
  /** The document, as mdast — remark's `fromMarkdown`, or `fromMarkedTokens(marked.lexer(source))`. */
  readonly tree = input<MarkdownNode | null | undefined>(undefined);
  /**
   * The document as CommonMark text, read by `parseMarkdown` from `@slotted/core/markdown`: the
   * syntax of the types in `allow` is read and any other stays text. Takes the place of `tree`.
   */
  readonly source = input<string | undefined>(undefined);
  readonly size = input<ProseSize | undefined>(undefined);
  readonly flow = input<ProseFlow | undefined>(undefined);
  readonly status = input<MarkdownStatus>('ready');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly streaming = input(false, { transform: booleanAttribute });
  readonly external = input<MarkdownExternal | undefined>(undefined);
  readonly headingAnchors = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly headingOffset = input(0, { transform: numberAttribute });
  readonly idPrefix = input('');
  readonly alerts = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly allow = input<readonly string[] | undefined>(undefined);
  readonly unwrapDisallowed = input(false, { transform: booleanAttribute });
  readonly transformUrl = input<
    ((url: string, kind: MarkdownUrlKind, node: MarkdownNode) => string | null) | undefined
  >(undefined);
  readonly isExternal = input<((href: string) => boolean) | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * empty, error, retry and loading texts, the footnotes heading, the back
   * link, the heading permalink, and each alert's title (`alerts.note`).
   */
  readonly messages = input<PartialMessages<MarkdownMessages> | undefined>(undefined);
  /**
   * Enables the task checkboxes. React reads the presence of its handler; an
   * Angular output cannot tell whether anyone listens, so the template says so.
   */
  readonly editableTasks = input(false, { transform: booleanAttribute });
  /** Draws the retry button in the error part, for the same reason. */
  readonly retryable = input(false, { transform: booleanAttribute });

  /** A task the reader ticked, with its index; the box moves when the tree does. */
  readonly taskChange = output<MarkdownTaskChange>();
  readonly retry = output<MarkdownRetryReason>();

  private readonly templates = contentChildren(SlMarkdownNode);
  private readonly nodesTemplate = viewChild.required<TemplateRef<unknown>>('nodes');

  private readonly defaults = injectMarkdownDefaults();
  private readonly proseDefaults = injectProseDefaults();
  private readonly skeletonDefaults = injectSkeletonDefaults();

  protected readonly resolvedFlow = computed(() => this.flow() ?? this.proseDefaults.flow);
  protected readonly resolvedExternal = computed(
    () => this.external() ?? this.defaults.external ?? 'new-tab',
  );
  protected readonly resolvedHeadingAnchors = computed(
    () => this.headingAnchors() ?? this.defaults.headingAnchors ?? false,
  );
  /** The family's words in the language in force, with this document's `messages` laid over them. */
  readonly t = injectMessages(markdownMessages, this.messages);

  private readonly templateMap = computed(() => {
    const map = new Map<string, TemplateRef<MarkdownNodeContext>>();
    for (const node of this.templates()) map.set(node.kind(), node.template);
    return map;
  });

  /** The prepared document: headings, footnotes and the outline a table of contents reads. */
  readonly document = computed(() => {
    const allow = this.allow() ?? this.defaults.allow;
    const source = this.source();
    /* A source still arriving is closed where it was cut before it is read. */
    const tree =
      source === undefined
        ? this.tree()
        : parseMarkdown(this.streaming() ? completeMarkdown(source) : source, { allow });
    return prepareMarkdown(tree, {
      alerts: this.alerts() ?? this.defaults.alerts ?? true,
      allow,
      custom: [...this.templateMap().keys()].filter((kind) => !KINDS.has(kind)),
      headingOffset: this.headingOffset(),
      idPrefix: this.idPrefix(),
      isExternal: this.isExternal() ?? this.defaults.isExternal,
      transformUrl: this.transformUrl() ?? this.defaults.transformUrl,
      unwrapDisallowed: this.unwrapDisallowed(),
    });
  });

  /*
   * The placeholder and the document are two different trees, so the family
   * decides which one is on screen with the machine `skeleton` uses, reading
   * `skeleton`'s own defaults for how long to wait and how long to hold.
   */
  protected readonly painted = signal(false);
  private visibility = initialLoadingVisibility;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const loading = this.loading();
      untracked(() => this.tick(loading));
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** @internal The template a node's children render through, for `slMarkdownChildren`. */
  childrenTemplate(): TemplateRef<unknown> {
    return this.nodesTemplate();
  }

  protected alertTitle(element: MarkdownAlertElement): string {
    return this.t(`alerts.${element.type}`);
  }

  protected templateFor(element: MarkdownElement): TemplateRef<MarkdownNodeContext> | undefined {
    return this.templateMap().get(element.kind === 'custom' ? element.type : element.kind);
  }

  protected footnoteLead(footnote: MarkdownFootnote): readonly MarkdownElement[] {
    return footnote.children.at(-1)?.kind === 'paragraph'
      ? footnote.children.slice(0, -1)
      : footnote.children;
  }

  protected footnoteTail(footnote: MarkdownFootnote) {
    const last = footnote.children.at(-1);
    return last?.kind === 'paragraph' ? last : null;
  }

  protected onTask(element: MarkdownItemElement, request: ChangeRequest<boolean>): void {
    this.taskChange.emit({
      checked: request.value,
      index: element.task ?? 0,
      offset: element.offset,
      request,
    });
  }

  private tick(loading: boolean): void {
    const answer = nextLoadingVisibility({
      delay: this.skeletonDefaults.delay ?? 0,
      loading,
      minDuration: this.skeletonDefaults.minDuration ?? 0,
      now: Date.now(),
      state: this.visibility,
    });
    this.visibility = answer.state;
    this.painted.set(answer.state.visible);
    clearTimeout(this.timer);
    if (answer.wait !== null) {
      this.timer = setTimeout(() => this.tick(this.loading()), answer.wait);
    }
  }
}

/**
 * Renders an element's children inside a node template, adding no element of
 * its own: `<ng-container [slMarkdownChildren]="element" />`.
 */
@Directive({ selector: '[slMarkdownChildren]', standalone: true })
export class SlMarkdownChildren {
  readonly element = input.required<{ readonly children?: readonly MarkdownElement[] }>({
    alias: 'slMarkdownChildren',
  });
  private readonly markdown = inject(SlMarkdown);
  private readonly container = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      const children = this.element().children ?? [];
      untracked(() => {
        this.container.clear();
        this.container.createEmbeddedView(this.markdown.childrenTemplate(), {
          $implicit: children,
        });
      });
    });
  }
}
