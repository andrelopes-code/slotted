import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { fromMarkedTokens } from '@slotted/core/markdown';
import type { MarkdownNode } from '@slotted/core/markdown';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { marked } from 'marked';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/markdown/contract.json';
import { SlottedProvider } from '../i18n';
import { SkeletonDefaultsProvider } from '../skeleton';
import { Markdown, MarkdownDefaultsProvider } from './index';

const md = (source: string): MarkdownNode => fromMarkedTokens(marked.lexer(source));

/**
 * A language model's answer arrives as CommonMark text. The family took a tree
 * only, so every consumer brought a parser of its own.
 */
describe('Markdown from source', () => {
  it('parses the allowed subset and keeps any other syntax as text', () => {
    const allow = ['paragraph', 'text', 'list', 'listItem', 'strong', 'link'];
    const { container, rerender } = render(<Markdown allow={allow} source="- **a** [b](/c)" />);
    const item = container.querySelector('ul > li') as HTMLElement;
    expect(item.querySelector('strong')?.textContent).toBe('a');
    expect(item.querySelector('a')?.getAttribute('href')).toBe('/c');

    rerender(<Markdown allow={allow} source="# t" />);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('# t');
  });
});

describe('Markdown', () => {
  it('is selected by the family identifier and writes the contract defaults', () => {
    render(<Markdown data-testid="root" tree={md('Hello')} />);
    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-ui', contract.ui);
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root).toHaveAttribute('data-status', contract.members.markdown.defaults.status);
    expect(root.querySelector("[data-ui='prose']")).toContainHTML('<p>Hello</p>');
  });

  it('never writes raw HTML, and draws a refused link as its text', () => {
    const { container } = render(
      <Markdown
        tree={md('<img src=x onerror="alert(1)">\n\n[click](javascript:alert(1)) <b>x</b>')}
      />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container).toHaveTextContent('click x');
  });

  it('renders html only through a renderer the consumer names', () => {
    render(
      <Markdown
        extensions={{
          html: ({ element }) => <span data-testid="raw">{String(element.node.value)}</span>,
        }}
        tree={md('<kbd>K</kbd>')}
      />,
    );
    expect(screen.getAllByTestId('raw')[0]).toHaveTextContent('<kbd>');
  });

  it('gives headings stable ids through the prefix, and a permalink when asked', () => {
    render(<Markdown headingAnchors idPrefix="m-" tree={md('## Setup\n\n## Setup')} />);
    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first).toHaveAttribute('id', 'm-setup');
    expect(second).toHaveAttribute('id', 'm-setup-1');
    const anchors = screen.getAllByRole('link', { name: 'Link to section: Setup' });
    expect(anchors.map((anchor) => anchor.getAttribute('href'))).toEqual([
      '#m-setup',
      '#m-setup-1',
    ]);
  });

  it('moves the heading levels by the offset', () => {
    render(<Markdown headingOffset={1} tree={md('# Title')} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
  });

  it('opens an external link in a new tab, and says so; a local one stays a plain link', () => {
    render(<Markdown tree={md('[docs](https://example.com) and [home](/home)')} />);
    const external = screen.getByRole('link', { name: /docs/ });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(external).toHaveAttribute('data-ui', 'link');
    expect(screen.getByRole('link', { name: 'home' })).not.toHaveAttribute('target');
  });

  it('keeps an external link in the tab when the application says so', () => {
    render(
      <MarkdownDefaultsProvider external="same-tab">
        <Markdown tree={md('[docs](https://example.com)')} />
      </MarkdownDefaultsProvider>,
    );
    expect(screen.getByRole('link', { name: 'docs' })).not.toHaveAttribute('target');
  });

  it('draws a fence with code-block, carrying the title and the highlighted lines', () => {
    const { container } = render(
      <Markdown tree={md('```ts title="a.ts" {2}\nlet a;\nlet b;\n```')} />,
    );
    const block = container.querySelector("[data-part='embed'] > [data-ui='code-block']");
    expect(block).not.toBeNull();
    expect(block).toHaveTextContent('a.ts');
    expect(block?.querySelector("[data-line='2']")).toHaveAttribute('data-mark', 'highlight');
  });

  it('draws a table with column headers and logical alignment', () => {
    const { container } = render(<Markdown tree={md('| a | b |\n|:-|-:|\n| 1 | 2 |')} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    const cells = container.querySelectorAll('td');
    expect(cells[0]).toHaveAttribute('data-align', 'start');
    expect(cells[1]).toHaveAttribute('data-align', 'end');
  });

  it('reads a GitHub alert into an alert that does not announce itself', () => {
    const { container } = render(<Markdown tree={md('> [!WARNING]\n> Mind the gap.')} />);
    const alert = container.querySelector("[data-ui='alert']");
    expect(alert).toHaveAttribute('data-tone', 'warning');
    expect(alert).toHaveAttribute('data-live', 'off');
    expect(alert).toHaveTextContent('WarningMind the gap.');
  });

  describe('tasks', () => {
    const source = '- [x] Write\n- [ ] Review\n- Plain';

    it('are read-only checkboxes named by their text while nobody listens', () => {
      render(<Markdown tree={md(source)} />);
      const write = screen.getByRole('checkbox', { name: 'Write' });
      expect(write).toBeChecked();
      expect(write).toHaveAttribute('aria-readonly', 'true');
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });

    it('ask for the change with the task index and reason, and wait for the new tree', () => {
      const onTaskChange = vi.fn();
      render(<Markdown onTaskChange={onTaskChange} tree={md(source)} />);
      const review = screen.getByRole('checkbox', { name: 'Review' });
      fireEvent.click(review, { detail: 1 });
      expect(onTaskChange).toHaveBeenCalledTimes(1);
      const [change, request] = onTaskChange.mock.calls[0] ?? [];
      expect(change).toEqual({ checked: true, index: 1, offset: null });
      expect(request.reason).toBe('pointer');
      expect(review).not.toBeChecked();
    });
  });

  it('numbers footnotes and links each reference to its note and back', () => {
    const tree: MarkdownNode = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Claim' },
            { type: 'footnoteReference', identifier: 'a' },
          ],
        },
        {
          type: 'footnoteDefinition',
          identifier: 'a',
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Source' }] }],
        },
      ],
    };
    render(<Markdown tree={tree} />);
    const reference = screen.getByRole('link', { name: '1' });
    expect(reference).toHaveAttribute('href', '#fn-a');
    expect(reference).toHaveAttribute('aria-describedby', 'footnote-label');
    expect(screen.getByRole('heading', { name: 'Footnotes' })).toHaveAttribute(
      'id',
      'footnote-label',
    );
    const back = screen.getByRole('link', { name: 'Back to reference 1' });
    expect(back).toHaveAttribute('href', '#fnref-a');
    /* The arrow is the Glyph element, hidden, and the link keeps its own name. */
    const glyph = back.querySelector('[data-ui="icon"][aria-hidden="true"] > svg[data-glyph]');
    expect(glyph).toHaveAttribute('data-glyph', 'arrow-left');
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <Markdown
          headingAnchors
          messages={{ retry: 'Repetir' }}
          tree={md('> [!NOTE]\n> Leia.\n\n## Setup')}
        />
      </SlottedProvider>,
    );
    expect(screen.getByText('Nota')).toBeInTheDocument();
    expect(
      // language: pt-BR
      screen.getAllByRole('link', { name: 'Link para a seção: Setup' }).length,
      // language: en-US
    ).toBeGreaterThan(0);
  });

  it('writes a back link per reference, the second one counted', () => {
    const tree: MarkdownNode = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'footnoteReference', identifier: 'a' },
            { type: 'footnoteReference', identifier: 'a' },
          ],
        },
        {
          type: 'footnoteDefinition',
          identifier: 'a',
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Source' }] }],
        },
      ],
    };
    render(<Markdown tree={tree} />);
    expect(screen.getByRole('link', { name: 'Back to reference 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to reference 1-2' })).toBeInTheDocument();
  });

  it('draws the empty part for a document with nothing in it', () => {
    render(<Markdown data-testid="root" tree={md('   ')} />);
    expect(screen.getByTestId('root')).toHaveAttribute('data-empty');
    expect(screen.getByText('This document has no content yet.')).toHaveAttribute(
      'data-part',
      'empty',
    );
  });

  it('draws the error part, and a retry only when the consumer can retry', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<Markdown status="error" tree={null} />);
    expect(screen.getByText('The document could not be loaded.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<Markdown onRetry={onRetry} status="error" tree={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }), { detail: 1 });
    expect(onRetry).toHaveBeenCalledWith('pointer');
  });

  it('paints the placeholder only after skeleton’s delay, and is busy meanwhile', () => {
    vi.useFakeTimers();
    try {
      render(
        <SkeletonDefaultsProvider delay={200} minDuration={0}>
          <Markdown data-testid="root" loading tree={null} />
        </SkeletonDefaultsProvider>,
      );
      const root = screen.getByTestId('root');
      expect(root).not.toHaveAttribute('data-loading');
      expect(root).not.toHaveTextContent('This document has no content yet.');
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(root).toHaveAttribute('data-loading');
      expect(root).toHaveAttribute('aria-busy', 'true');
      expect(root.querySelector("[data-ui='skeleton'][data-part='text']")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps every block it already drew when streamed content is appended', () => {
    const { container, rerender } = render(<Markdown streaming tree={md('One.\n\nTwo')} />);
    const first = container.querySelector('p');
    rerender(<Markdown streaming tree={md('One.\n\nTwo and three.\n\nFour')} />);
    expect(container.querySelector('p')).toBe(first);
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });

  it('lets a renderer replace a kind, with the prepared element and its children', () => {
    render(
      <Markdown
        renderers={{
          link: ({ element, children }) => <button data-href={element.href}>{children}</button>,
        }}
        tree={md('[go](/x)')}
      />,
    );
    expect(screen.getByRole('button', { name: 'go' })).toHaveAttribute('data-href', '/x');
  });
});
