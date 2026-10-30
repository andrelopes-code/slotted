import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/prose/contract.json';
import { SlottedProvider } from '../i18n';
import {
  Prose,
  ProseAnchor,
  ProseDefaultsProvider,
  ProseExclude,
  ProseFootnotes,
  ProseLead,
  ProseScroll,
} from './index';
import type { ProseScrollHandle } from './index';

const defaults = contract.members.prose.defaults;

/**
 * `jsdom` lays nothing out: every element measures zero, so a scroller is
 * never overflowing there and the family would be untestable at exactly the
 * point where it does something. Sizing the two properties the module reads is
 * what makes the decision observable.
 */
function measure(element: Element, { client, scroll }: { client: number; scroll: number }) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: client });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scroll });
}

describe('Prose', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Prose data-testid="root">
        <ProseLead data-testid="lead" />
        <h2>
          A title
          <ProseAnchor data-testid="anchor" href="#a-title" />
        </h2>
        <ProseScroll data-testid="scroll" />
        <ProseExclude data-testid="exclude" />
        <ProseFootnotes data-testid="footnotes" />
      </Prose>,
    );

    expect(screen.getByTestId('root')).toHaveAttribute('data-ui', 'prose');
    for (const part of contract.members.prose.parts) {
      const id = part === 'root' ? 'root' : part;
      expect(screen.getByTestId(id)).toHaveAttribute('data-part', part);
    }
  });

  it('writes the contract defaults when the consumer states nothing', () => {
    render(<Prose data-testid="root" />);

    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-size', defaults.size);
    expect(root).toHaveAttribute('data-flow', defaults.flow);
  });

  it("claims no semantics, because the claim is the page's to make", () => {
    render(<Prose data-testid="root">text</Prose>);

    expect(screen.getByTestId('root').tagName).toBe('DIV');
    expect(screen.getByTestId('root')).not.toHaveAttribute('role');
  });

  it('lets the consumer make the claim through render', () => {
    render(<Prose render={(props) => <article {...props} data-testid="root" />} />);

    expect(screen.getByTestId('root').tagName).toBe('ARTICLE');
    expect(screen.getByTestId('root')).toHaveAttribute('data-ui', 'prose');
  });

  it('takes an application default and still loses to an explicit value', () => {
    render(
      <ProseDefaultsProvider flow="tight" size="md">
        <Prose data-testid="inherited" />
        <Prose data-testid="stated" size="xl" />
      </ProseDefaultsProvider>,
    );

    expect(screen.getByTestId('inherited')).toHaveAttribute('data-size', 'md');
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-flow', 'tight');
    expect(screen.getByTestId('stated')).toHaveAttribute('data-size', 'xl');
    expect(screen.getByTestId('stated')).toHaveAttribute('data-flow', 'tight');
  });

  it("passes native attributes and the consumer's own handler through", async () => {
    const onClick = vi.fn();
    render(<Prose data-testid="root" id="body" lang="pt-BR" onClick={onClick} />);

    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('id', 'body');
    expect(root).toHaveAttribute('lang', 'pt-BR');

    root.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('reaches the native element through a ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Prose ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('ProseAnchor', () => {
  /**
   * A word joiner — U+2060 — forbids a break without occupying anything, so
   * the last word of a title and its permalink wrap together. `Link` uses the
   * same device for its external marker.
   */
  it('writes a word joiner before the permalink', () => {
    render(
      <h2 data-testid="heading">
        A title
        <ProseAnchor href="#a-title">#</ProseAnchor>
      </h2>,
    );

    expect(screen.getByTestId('heading').textContent).toBe(`A title${'\u2060'}#`);
  });

  it('stays an anchor the consumer wrote the destination of', () => {
    render(<ProseAnchor data-testid="anchor" aria-label="Link to this section" href="#a-title" />);

    const anchor = screen.getByTestId('anchor');
    expect(anchor.tagName).toBe('A');
    expect(anchor).toHaveAttribute('href', '#a-title');
    expect(anchor).toHaveAccessibleName('Link to this section');
  });
});

describe('ProseScroll', () => {
  it('takes no role and no tab stop while the block fits', () => {
    render(<ProseScroll data-testid="scroll" />);

    const scroll = screen.getByTestId('scroll');
    expect(scroll).not.toHaveAttribute('role');
    expect(scroll).not.toHaveAttribute('tabindex');
    expect(scroll).not.toHaveAttribute('aria-label');
  });

  /**
   * Anything that takes focus needs a name and a role, or it fails SC 4.1.2.
   * A block that fits needs neither, which is why the wiring is a measurement
   * rather than a prop.
   */
  it('becomes a named region with a tab stop once the block overflows', () => {
    const handle = createRef<ProseScrollHandle>();
    const { rerender } = render(<ProseScroll data-testid="scroll" handleRef={handle} />);

    const scroll = screen.getByTestId('scroll');
    measure(scroll, { client: 320, scroll: 900 });
    act(() => handle.current?.refresh());
    rerender(<ProseScroll data-testid="scroll" handleRef={handle} />);

    expect(scroll).toHaveAttribute('role', 'region');
    expect(scroll).toHaveAttribute('tabindex', '0');
    expect(scroll).toHaveAccessibleName('Scrollable content');
    expect(handle.current?.overflowing()).toBe(true);
  });

  it('prefers the caption the consumer named over every default', () => {
    const handle = createRef<ProseScrollHandle>();
    render(
      <>
        <span id="caption">Environments and their gates</span>
        <ProseScroll
          aria-label="ignored"
          data-testid="scroll"
          handleRef={handle}
          labelledBy="caption"
        />
      </>,
    );

    const scroll = screen.getByTestId('scroll');
    measure(scroll, { client: 320, scroll: 900 });
    act(() => handle.current?.refresh());

    expect(scroll).toHaveAccessibleName('Environments and their gates');
  });

  it('speaks the language in force, and lays its own messages over it', () => {
    const handle = createRef<ProseScrollHandle>();
    const { rerender } = render(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <ProseScroll data-testid="scroll" handleRef={handle} />
      </SlottedProvider>,
    );

    const scroll = screen.getByTestId('scroll');
    measure(scroll, { client: 320, scroll: 900 });
    act(() => handle.current?.refresh());
    // language: pt-BR
    expect(scroll).toHaveAccessibleName('Conteúdo rolável');
    // language: en-US

    rerender(
      <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
        <ProseScroll
          data-testid="scroll"
          handleRef={handle}
          messages={{ scroll: 'Tabela larga' }}
        />
      </SlottedProvider>,
    );
    expect(scroll).toHaveAccessibleName('Tabela larga');
  });

  it("answers the consumer's ref and the family's observer from one element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ProseScroll data-testid="scroll" ref={ref} />);

    expect(ref.current).toBe(screen.getByTestId('scroll'));
  });
});
