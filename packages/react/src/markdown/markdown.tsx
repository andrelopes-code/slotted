import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/markdown/markdown.css';

import { markdownMessages } from '@slotted/core/i18n';
import type { FamilyTranslator, MarkdownMessages } from '@slotted/core/i18n';
import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';
import type { LoadingVisibilityState } from '@slotted/core/loading';
import {
  completeMarkdown,
  MARKDOWN_KINDS,
  parseMarkdown,
  prepareMarkdown,
} from '@slotted/core/markdown';
import type {
  MarkdownDocument,
  MarkdownElement,
  MarkdownFootnote,
  MarkdownItemElement,
} from '@slotted/core/markdown';
import { Fragment, createElement, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Alert, AlertContent, AlertDescription, AlertTitle } from '../alert';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { CodeBlock } from '../code-block';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { InlineMessage } from '../inline-message';
import { Link } from '../link';
import { Prose, ProseAnchor, ProseFootnotes, ProseScroll, useProseDefaults } from '../prose';
import { SkeletonRegion, SkeletonText, useSkeletonDefaults } from '../skeleton';
import { VisuallyHidden } from '../visually-hidden';
import { useMarkdownDefaults } from './markdown-defaults';
import type {
  MarkdownExtensions,
  MarkdownExternal,
  MarkdownProps,
  MarkdownRenderer,
  MarkdownRenderers,
  MarkdownRootProps,
  MarkdownTaskChange,
} from './markdown.types';

const KINDS = new Set<string>(MARKDOWN_KINDS);

/**
 * A document rendered from a tree, in `prose`'s typography.
 *
 * The family never receives HTML. It takes mdast — remark's output as it is,
 * or marked's through `fromMarkedTokens` — and `prepareMarkdown` from
 * `@slotted/core/markdown` decides everything that is not an element: which
 * types render, which URLs survive, the heading ids, the footnote numbers, the
 * alerts. This component maps each prepared kind to an element, or to the
 * family that already owns it: `Link`, `CodeBlock`, `Alert`, `Checkbox`.
 *
 * Nothing here is state. A task the reader ticks is a request against the
 * consumer's source, and the box moves when the new tree arrives.
 */
export function Markdown({
  alerts,
  allow,
  empty,
  extensions,
  external,
  flow,
  headingAnchors,
  headingOffset,
  idPrefix,
  isExternal,
  loading = false,
  messages,
  onRetry,
  onTaskChange,
  render,
  renderers,
  size,
  source,
  status = 'ready',
  streaming = false,
  transformUrl,
  tree,
  unwrapDisallowed,
  ...nativeProps
}: MarkdownProps) {
  const defaults = useMarkdownDefaults();
  const prose = useProseDefaults();
  const skeleton = useSkeletonDefaults();

  const t = useMessages(markdownMessages, messages);
  const resolvedFlow = flow ?? prose.flow;
  const resolvedTransform = transformUrl ?? defaults.transformUrl;
  const resolvedIsExternal = isExternal ?? defaults.isExternal;
  const resolvedAllow = allow ?? defaults.allow;
  const resolvedAlerts = alerts ?? defaults.alerts ?? true;
  const customTypes = useMemo(() => Object.keys(extensions ?? {}).join('\n'), [extensions]);

  /* A source still arriving is closed where it was cut before it is read. */
  const parsed = useMemo(
    () =>
      source === undefined
        ? tree
        : parseMarkdown(streaming ? completeMarkdown(source) : source, { allow: resolvedAllow }),
    [source, streaming, tree, resolvedAllow],
  );

  const document = useMemo(
    () =>
      prepareMarkdown(parsed, {
        alerts: resolvedAlerts,
        allow: resolvedAllow,
        custom: customTypes ? customTypes.split('\n') : [],
        headingOffset,
        idPrefix,
        isExternal: resolvedIsExternal,
        transformUrl: resolvedTransform,
        unwrapDisallowed,
      }),
    [
      parsed,
      resolvedAlerts,
      resolvedAllow,
      customTypes,
      headingOffset,
      idPrefix,
      resolvedIsExternal,
      resolvedTransform,
      unwrapDisallowed,
    ],
  );

  const painted = useLoadingVisibility({
    delay: skeleton.delay ?? 0,
    loading,
    minDuration: skeleton.minDuration ?? 0,
  });

  const context: RenderContext = {
    document,
    extensions: extensions ?? {},
    external: external ?? defaults.external ?? 'new-tab',
    headingAnchors: headingAnchors ?? defaults.headingAnchors ?? false,
    onTaskChange,
    t,
    renderers: renderers ?? {},
  };

  let body: ReactNode;
  if (status === 'error') {
    body = (
      <div data-part="error" data-part-error="">
        <InlineMessage tone="danger">{t('error')}</InlineMessage>
        {onRetry === undefined ? null : (
          <Button
            onClick={(event) => onRetry(event.detail === 0 ? 'keyboard' : 'pointer')}
            size="sm"
            tone="secondary"
            variant="outline"
          >
            {t('retry')}
          </Button>
        )}
      </div>
    );
  } else if (painted) {
    body = (
      <SkeletonRegion delay={0} messages={{ label: t('loading') }} loading minDuration={0}>
        <Prose flow={resolvedFlow} size={size}>
          <SkeletonText lastLineSize="62%" lines={3} />
        </Prose>
      </SkeletonRegion>
    );
  } else if (document.empty) {
    body = loading ? null : (
      <p data-part="empty" data-part-empty="">
        {empty ?? t('empty')}
      </p>
    );
  } else {
    body = (
      <Prose flow={resolvedFlow} size={size}>
        {renderElements(document.children, context)}
        {renderFootnotes(document, context)}
      </Prose>
    );
  }

  const rootProps: MarkdownRootProps = keyedProps({
    ...nativeProps,
    'aria-busy': streaming || painted || undefined,
    children: body,
    'data-empty': (status === 'ready' && !painted && document.empty) || undefined,
    'data-flow': resolvedFlow,
    'data-loading': painted || undefined,
    'data-part': 'root',
    'data-status': status,
    'data-streaming': streaming || undefined,
    'data-ui': 'markdown',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/*
 * ── Rendering the prepared document ──────────────────────────────────────
 */

interface RenderContext {
  document: MarkdownDocument;
  extensions: MarkdownExtensions;
  external: MarkdownExternal;
  headingAnchors: boolean;
  onTaskChange: MarkdownProps['onTaskChange'];
  renderers: MarkdownRenderers;
  /** The family's words in the language in force, with this document's `messages` laid over them. */
  t: FamilyTranslator<MarkdownMessages>;
}

function renderElements(elements: readonly MarkdownElement[], context: RenderContext): ReactNode[] {
  return elements.map((element) => (
    <Fragment key={element.key}>{renderElement(element, context)}</Fragment>
  ));
}

function renderElement(element: MarkdownElement, context: RenderContext): ReactNode {
  const children = 'children' in element ? renderChildren(element, context) : null;

  if (element.kind === 'custom') {
    const extension = context.extensions[element.type];
    return extension === undefined ? children : extension({ children, element });
  }
  if (KINDS.has(element.kind)) {
    const renderer = context.renderers[element.kind] as MarkdownRenderer | undefined;
    if (renderer !== undefined) return renderer({ children, element });
  }
  return renderDefault(element, children, context);
}

function renderChildren(element: MarkdownElement, context: RenderContext): ReactNode {
  if (element.kind === 'list') return renderElements(element.children, context);
  if ('children' in element) return renderElements(element.children, context);
  return null;
}

function renderDefault(
  element: MarkdownElement,
  children: ReactNode,
  context: RenderContext,
): ReactNode {
  switch (element.kind) {
    case 'text':
      return element.value;
    case 'inlineCode':
      return <code>{element.value}</code>;
    case 'break':
      return <br />;
    case 'thematicBreak':
      return <hr />;
    case 'paragraph':
      return <p>{children}</p>;
    case 'emphasis':
      return <em>{children}</em>;
    case 'strong':
      return <strong>{children}</strong>;
    case 'delete':
      return <del>{children}</del>;
    case 'blockquote':
      return <blockquote>{children}</blockquote>;
    case 'heading':
      return createElement(
        `h${element.level}`,
        { id: element.id },
        children,
        context.headingAnchors ? (
          <ProseAnchor
            aria-label={context.t('anchor', { heading: element.text })}
            href={`#${element.id}`}
          >
            #
          </ProseAnchor>
        ) : null,
      );
    case 'alert':
      return (
        <div data-part="embed" data-part-embed="">
          <Alert live="off" reach="section" tone={element.tone}>
            <AlertContent>
              <AlertTitle>{context.t(`alerts.${element.type}`)}</AlertTitle>
              <AlertDescription
                render={({ children: body, ...props }) => <div {...props}>{body}</div>}
              >
                <div data-part="alert-body" data-part-alert-body="">
                  {children}
                </div>
              </AlertDescription>
            </AlertContent>
          </Alert>
        </div>
      );
    case 'list': {
      const taskList = element.task ? 'task-list' : undefined;
      return element.ordered ? (
        <ol
          data-part={taskList}
          {...selectorKeyProps('part', taskList)}
          start={element.start ?? undefined}
        >
          {children}
        </ol>
      ) : (
        <ul data-part={taskList} {...selectorKeyProps('part', taskList)}>
          {children}
        </ul>
      );
    }
    case 'item':
      return element.checked === null ? (
        <li>{children}</li>
      ) : (
        renderTask(element, children, context)
      );
    case 'code':
      return (
        <div data-part="embed" data-part-embed="">
          <CodeBlock
            code={element.code}
            language={element.language ?? undefined}
            lineNumbers={element.lineNumbers || undefined}
            marks={element.highlight === null ? undefined : { highlight: element.highlight }}
            title={element.title ?? undefined}
          />
        </div>
      );
    case 'table':
      return (
        <ProseScroll>
          <table>
            <thead>
              <tr>
                {element.head.map((cell) => (
                  <th data-align={cell.align ?? undefined} key={cell.key} scope="col">
                    {renderElements(cell.children, context)}
                  </th>
                ))}
              </tr>
            </thead>
            {element.rows.length === 0 ? null : (
              <tbody>
                {element.rows.map((row, index) => (
                  <tr key={row[0]?.key ?? index}>
                    {row.map((cell) => (
                      <td data-align={cell.align ?? undefined} key={cell.key}>
                        {renderElements(cell.children, context)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </ProseScroll>
      );
    case 'link':
      return element.external && context.external === 'new-tab' ? (
        <Link external href={element.href} title={element.title ?? undefined}>
          {children}
        </Link>
      ) : (
        <a href={element.href} title={element.title ?? undefined}>
          {children}
        </a>
      );
    case 'image':
      return (
        <img
          alt={element.alt}
          decoding="async"
          loading="lazy"
          src={element.src}
          title={element.title ?? undefined}
        />
      );
    case 'footnoteReference':
      return (
        <sup>
          <a
            aria-describedby={context.document.footnoteLabelId}
            data-footnote-ref=""
            href={`#${element.target}`}
            id={element.id}
          >
            {element.number}
          </a>
        </sup>
      );
    case 'custom':
      return children;
  }
}

function renderTask(
  element: MarkdownItemElement,
  children: ReactNode,
  context: RenderContext,
): ReactNode {
  const { onTaskChange } = context;
  const task = element.task ?? 0;

  return (
    <li data-part="task" data-part-task="">
      <Checkbox
        aria-label={element.label}
        checked={element.checked === true}
        onCheckedChange={
          onTaskChange === undefined
            ? undefined
            : (checked, request) => {
                const change: MarkdownTaskChange = { checked, index: task, offset: element.offset };
                onTaskChange(change, request);
              }
        }
        readOnly={onTaskChange === undefined || undefined}
      />
      <div data-part="task-body" data-part-task-body="">
        {children}
      </div>
    </li>
  );
}

/**
 * The section GitHub's renderer writes at the end of a document. Each
 * footnote's back links go inside its last paragraph, so a one-line note
 * reads as one line.
 */
function renderFootnotes(document: MarkdownDocument, context: RenderContext): ReactNode {
  if (document.footnotes.length === 0) return null;

  return (
    <ProseFootnotes>
      <VisuallyHidden id={document.footnoteLabelId} render={(props) => <h2 {...props} />}>
        {context.t('footnotes')}
      </VisuallyHidden>
      <ol>
        {document.footnotes.map((footnote) => (
          <li id={footnote.id} key={footnote.key}>
            {renderFootnoteBody(footnote, context)}
          </li>
        ))}
      </ol>
    </ProseFootnotes>
  );
}

function renderFootnoteBody(footnote: MarkdownFootnote, context: RenderContext): ReactNode {
  const backrefs = footnote.references.map((reference, index) => (
    <a
      aria-label={context.t('backReference', { number: footnote.number, occurrence: index + 1 })}
      data-part="backref"
      data-part-backref=""
      href={`#${reference}`}
      key={reference}
    >
      {/* Turned a quarter by the sheet, so it points up the page to the reference. */}
      <Icon>
        <Glyph name="arrow-left" />
      </Icon>
    </a>
  ));
  const last = footnote.children.at(-1);
  if (last?.kind !== 'paragraph') {
    return (
      <>
        {renderElements(footnote.children, context)}
        {backrefs}
      </>
    );
  }
  return (
    <>
      {renderElements(footnote.children.slice(0, -1), context)}
      <p key={last.key}>
        {renderElements(last.children, context)}
        {backrefs}
      </p>
    </>
  );
}

/*
 * ── Loading ──────────────────────────────────────────────────────────────
 *
 * The placeholder and the document are two different trees, so the family
 * decides which one is on screen with the machine `skeleton` uses, reading
 * `skeleton`'s own defaults for how long to wait and how long to hold.
 */

function useLoadingVisibility({
  delay,
  loading,
  minDuration,
}: {
  delay: number;
  loading: boolean;
  minDuration: number;
}): boolean {
  const state = useRef<LoadingVisibilityState>(initialLoadingVisibility);
  const [, retick] = useState(0);
  const answer = nextLoadingVisibility({
    delay,
    loading,
    minDuration,
    now: Date.now(),
    state: state.current,
  });
  state.current = answer.state;

  const { wait } = answer;
  useEffect(() => {
    if (wait === null) return undefined;
    const timer = setTimeout(() => retick((tick) => tick + 1), wait);
    return () => clearTimeout(timer);
  }, [wait, loading]);

  return answer.state.visible;
}
