import { fromPrismTokens } from '@slotted/core/code';
import type { CodeLine } from '@slotted/core/code';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/code-block/contract.json';
import { SlottedProvider } from '../i18n';
import { CodeBlock } from './code-block';
import { CodeBlockDefaultsProvider } from './code-block-defaults';

const CODE = [
  'const a = 1;',
  'const b = 2;',
  'export const sum = a + b;',
  'console.log(sum);',
].join('\n');

const tokenise = (code: string): CodeLine[] =>
  code.split('\n').map((line) =>
    line
      .split(/(\bconst\b|\bexport\b|\d+)/)
      .filter((piece) => piece !== '')
      .map((piece) =>
        /^\d+$/.test(piece)
          ? { scope: 'number' as const, text: piece }
          : piece === 'const' || piece === 'export'
            ? { scope: 'keyword' as const, text: piece }
            : { text: piece },
      ),
  );

const root = () => document.querySelector('[data-ui="code-block"]') as HTMLElement;
const part = (name: string) => root().querySelector(`[data-part="${name}"]`) as HTMLElement;
/** The glyph a part draws, read from the `Icon` inside it. */
const glyph = (name: string) =>
  part(name).querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph');
const lines = () => [...root().querySelectorAll('[data-part="line"]')] as HTMLElement[];

describe('CodeBlock', () => {
  it('is selected in public by the family identifier, and draws the fence parts from text', () => {
    render(<CodeBlock code={CODE} language="ts" lineNumbers title="sum.ts" />);
    expect(root().dataset['ui']).toBe(contract.ui);
    expect(root().dataset['language']).toBe('ts');
    for (const name of [
      'header',
      'icon',
      'title',
      'language',
      'actions',
      'copy',
      'body',
      'pre',
      'code',
      'line',
      'number',
      'marker',
      'text',
    ]) {
      expect(part(name)).not.toBeNull();
    }
    /* A `.ts` name is no kind the upload map knows: the plain file glyph. */
    expect(glyph('icon')).toBe('file');
    expect(part('code').className).toBe('language-ts');
    expect(lines()).toHaveLength(4);
    expect(lines()[2]!.dataset['line']).toBe('3');
    expect(part('text').textContent).toBe('const a = 1;');
    expect(root().hasAttribute('data-line-numbers')).toBe(true);
    expect(root().style.getPropertyValue('--slotted-code-block-digits')).toBe('1');
  });

  it('never writes HTML: a script tag in the sample is six characters', () => {
    render(<CodeBlock code="<script>alert(1)</script>" language="html" />);
    expect(root().querySelector('script')).toBeNull();
    expect(part('text').textContent).toBe('<script>alert(1)</script>');
  });

  it('draws plain text first and swaps the engine’s tokens in when they arrive', async () => {
    const highlight = vi.fn(async (code: string) => tokenise(code));
    render(<CodeBlock code={CODE} highlight={highlight} language="ts" />);
    expect(root().querySelector('[data-part="token"]')).toBeNull();
    await waitFor(() => expect(root().querySelectorAll('[data-token="keyword"]').length).toBe(4));
    expect(highlight).toHaveBeenCalledWith(CODE, 'ts');
    expect(lines()).toHaveLength(4);
    expect(root().querySelector('[data-token="number"]')?.textContent).toBe('1');
  });

  it('takes the engine from the provider, and reports a rejected one', async () => {
    const onHighlightError = vi.fn();
    const highlight = vi.fn(() => Promise.reject(new Error('no grammar')));
    render(
      <CodeBlockDefaultsProvider highlight={highlight} lineNumbers>
        <CodeBlock code={CODE} onHighlightError={onHighlightError} />
      </CodeBlockDefaultsProvider>,
    );
    await waitFor(() => expect(onHighlightError).toHaveBeenCalled());
    expect(part('text').textContent).toBe('const a = 1;');
    expect(root().hasAttribute('data-line-numbers')).toBe(true);
  });

  it('accepts Prism’s tokens through the mapping', () => {
    const tokens = fromPrismTokens([{ type: 'keyword', content: 'const' }, ' a;']);
    render(<CodeBlock code="const a;" tokens={tokens} />);
    expect(root().querySelector('[data-token="keyword"]')?.textContent).toBe('const');
  });

  it('marks lines in one precedence and dims outside the focus', () => {
    render(
      <CodeBlock code={CODE} marks={{ add: '2', focus: '2-3', highlight: '1-2', remove: [3] }} />,
    );
    expect(root().hasAttribute('data-marks')).toBe(true);
    expect(lines().map((line) => line.dataset['mark'])).toEqual([
      'highlight',
      'add',
      'remove',
      undefined,
    ]);
    expect(lines().map((line) => line.hasAttribute('data-dim'))).toEqual([
      true,
      false,
      false,
      true,
    ]);
  });

  it('copies the code the consumer gave, without the removed lines, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    const onCopy = vi.fn();
    try {
      render(<CodeBlock code={CODE} lineNumbers marks={{ remove: '2' }} onCopy={onCopy} />);
      expect(glyph('copy')).toBe('copy');
      fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
      await waitFor(() => expect(onCopy).toHaveBeenCalled());
      expect(writeText).toHaveBeenCalledWith(
        ['const a = 1;', 'export const sum = a + b;', 'console.log(sum);'].join('\n'),
      );
      expect(onCopy.mock.calls[0]![0].copied).toBe(true);
      expect(onCopy.mock.calls[0]![0].reason).toBe('pointer');
      expect(part('copy').hasAttribute('data-complete')).toBe(true);
      expect(glyph('copy')).toBe('check');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps the removed lines when asked, and draws no control when copy is off', () => {
    const { rerender } = render(<CodeBlock code={CODE} copy={false} />);
    expect(root().querySelector('[data-part="copy"]')).toBeNull();
    rerender(<CodeBlock code={CODE} copyRemoved marks={{ remove: '2' }} />);
    expect(root().querySelector('[data-part="copy"]')).not.toBeNull();
  });

  it('wraps as a pressed control, carrying the reason, and indents the continuation', () => {
    const onWrapChange = vi.fn();
    render(<CodeBlock code={'  indented();\nplain();'} defaultWrap onWrapChange={onWrapChange} />);
    expect(root().hasAttribute('data-wrap')).toBe(true);
    const wrap = screen.getByRole('button', { name: 'Unwrap lines' });
    expect(wrap.getAttribute('aria-pressed')).toBe('true');
    expect(glyph('wrap')).toBe('text-wrap');
    expect(lines()[0]!.style.getPropertyValue('--slotted-code-block-indent')).toBe('2');
    expect(lines()[1]!.style.getPropertyValue('--slotted-code-block-indent')).toBe('');
    fireEvent.click(wrap);
    expect(onWrapChange.mock.calls[0]![0]).toBe(false);
    expect(onWrapChange.mock.calls[0]![1].reason).toBe('pointer');
    expect(root().hasAttribute('data-wrap')).toBe(false);
  });

  it('draws the wrap control only while a line overflows, unless already wrapped', () => {
    render(<CodeBlock code={CODE} />);
    expect(root().querySelector('[data-part="wrap"]')).toBeNull();
  });

  it('collapses after the given lines, reveals on request, and collapses again on Escape', () => {
    const onRevealedChange = vi.fn();
    render(<CodeBlock code={CODE} collapseAfter={2} onRevealedChange={onRevealedChange} />);
    expect(root().hasAttribute('data-collapse')).toBe(true);
    expect(root().style.getPropertyValue('--slotted-code-block-collapse')).toBe('2');
    const reveal = screen.getByRole('button', { name: 'Show 2 more lines' });
    expect(lines()).toHaveLength(4);
    fireEvent.click(reveal);
    expect(onRevealedChange.mock.calls[0]![0]).toBe(true);
    expect(root().hasAttribute('data-revealed')).toBe(true);
    expect(reveal.textContent).toBe('Show less');
    fireEvent.keyDown(part('body'), { key: 'Escape' });
    expect(onRevealedChange.mock.calls[1]![0]).toBe(false);
    expect(onRevealedChange.mock.calls[1]![1].reason).toBe('escape');
    expect(root().hasAttribute('data-revealed')).toBe(false);
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <CodeBlock code={CODE} collapseAfter={3} messages={{ copy: 'Copiar' }} />
      </SlottedProvider>,
    );
    // language: pt-BR
    expect(screen.getByRole('button', { name: 'Mostrar mais 1 linha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument();
    // language: en-US
  });

  it('keeps a controlled value where the consumer put it', () => {
    render(<CodeBlock code={CODE} collapseAfter={1} revealed={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more lines' }));
    expect(root().hasAttribute('data-revealed')).toBe(false);
  });

  it('bounds the body with maxLines and names the region after the title', () => {
    render(<CodeBlock code={CODE} maxLines={2} title="sum.ts" />);
    expect(root().style.getPropertyValue('--slotted-code-block-max-lines')).toBe('2');
    expect(part('body').hasAttribute('data-max-lines')).toBe(true);
    expect(part('body').dataset['ui']).toBe('scroll-area');
  });

  /*
   * A block with no height of its own scrolls only along the line: a body
   * that scrolled both ways was a vertical scroll container with nothing to
   * scroll, and with the scroll-area's `contain` it kept the page's wheel.
   */
  it('scrolls only inline unless maxLines bounds it, so the page keeps its wheel', () => {
    const { rerender } = render(<CodeBlock code={CODE} />);
    expect(part('body').dataset['axis']).toBe('inline');
    rerender(<CodeBlock code={CODE} maxLines={2} />);
    expect(part('body').dataset['axis']).toBe('both');
  });

  it('draws skeleton lines while loading and one empty line for an empty string', () => {
    const { rerender } = render(<CodeBlock code="" />);
    expect(root().hasAttribute('data-empty')).toBe(true);
    expect(lines()).toHaveLength(1);
    rerender(<CodeBlock code="" loading />);
    expect(root().getAttribute('aria-busy')).toBe('true');
    expect(root().querySelector('[data-ui="skeleton"]')).not.toBeNull();
    expect(root().querySelector('[data-part="copy"]')).toBeNull();
  });

  it('numbers from start and widens the gutter to the last number', () => {
    render(<CodeBlock code={CODE} lineNumbers start={98} />);
    expect(lines()[0]!.querySelector('[data-part="number"]')?.textContent).toBe('98');
    expect(root().style.getPropertyValue('--slotted-code-block-digits')).toBe('3');
  });

  it('lets a consumer draw a line or a token of its own', () => {
    render(
      <CodeBlock
        code={CODE}
        renderToken={(token, index) => <mark key={index}>{token.text}</mark>}
      />,
    );
    expect(root().querySelectorAll('mark')).toHaveLength(4);
  });

  it('passes native props to the root and composes a consumer handler', () => {
    const onKeyDown = vi.fn();
    render(<CodeBlock code={CODE} id="sum" onKeyDown={onKeyDown} />);
    expect(root().id).toBe('sum');
    fireEvent.keyDown(root(), { key: 'a' });
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('exposes copy and scrollToLine on the handle', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    try {
      const handle = {
        current: null as null | { copy: () => Promise<boolean>; scrollToLine: (n: number) => void },
      };
      render(<CodeBlock code={CODE} ref={handle as never} />);
      let done = false;
      await act(async () => {
        done = (await handle.current!.copy()) === true;
      });
      expect(done).toBe(true);
      expect(writeText).toHaveBeenCalledWith(CODE);
      expect(() => handle.current!.scrollToLine(3)).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
