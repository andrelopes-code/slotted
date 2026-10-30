import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRef } from 'react';

import { Highlight, HighlightDefaultsProvider } from './index';

const shape = (root: HTMLElement) =>
  [...root.childNodes].map((node) =>
    node.nodeType === node.ELEMENT_NODE
      ? `<${(node as Element).tagName.toLowerCase()}${(node as Element).hasAttribute('data-current') ? ' current' : ''}>${node.textContent}`
      : node.textContent,
  );

const marks = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-part="match"]')].map((node) => node.textContent);

describe('Highlight', () => {
  it('is selected in public by the family identifier, and its marks by the part', () => {
    render(<Highlight data-testid="root" text="Blueberry" query="berr" />);

    const root = screen.getByTestId('root');
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveAttribute('data-ui', 'highlight');
    expect(root).toHaveAttribute('data-part', 'root');
    expect(root.textContent).toBe('Blueberry');
    expect(shape(root)).toEqual(['Blue', '<mark>berr', 'y']);
    expect(root.querySelector('mark')).toHaveAttribute('data-part', 'match');
    expect(root.querySelector('mark')).not.toHaveAttribute('data-ui');
  });

  it('renders the text alone for an empty query, and never parses it', () => {
    const { rerender } = render(<Highlight data-testid="root" text="a <b>bold</b> claim" />);
    const root = screen.getByTestId('root');
    expect(shape(root)).toEqual(['a <b>bold</b> claim']);
    expect(root.querySelector('b')).toBeNull();

    rerender(<Highlight data-testid="root" text="a <b>bold</b> claim" query="   " />);
    expect(shape(root)).toEqual(['a <b>bold</b> claim']);

    rerender(<Highlight data-testid="root" text="a <b>bold</b> claim" query="<b>" />);
    expect(marks(root)).toEqual(['<b>']);
    expect(root.querySelector('b')).toBeNull();
  });

  it('marks every occurrence by default, in the reader’s locale, and the first on request', () => {
    const { rerender } = render(<Highlight data-testid="root" text="Ana Banana" query="an" />);
    const root = screen.getByTestId('root');
    expect(marks(root)).toEqual(['An', 'anan']);

    rerender(<Highlight data-testid="root" text="Ana Banana" query="an" occurrences="first" />);
    expect(marks(root)).toEqual(['An']);

    rerender(<Highlight data-testid="root" text="Resumé" query="resume" />);
    expect(marks(root)).toEqual(['Resumé']);
  });

  it('takes ranges over a matcher over the default', () => {
    const matcher = () => [[0, 1]] as const;
    const { rerender } = render(
      <Highlight data-testid="root" text="Blueberry" query="berry" matcher={matcher} />,
    );
    const root = screen.getByTestId('root');
    expect(marks(root)).toEqual(['B']);

    rerender(
      <Highlight
        data-testid="root"
        text="Blueberry"
        query="berry"
        matcher={matcher}
        ranges={[[4, 40]]}
      />,
    );
    expect(marks(root)).toEqual(['berry']);
  });

  it('puts data-current on the match at the stated index, counting matches only', () => {
    const { rerender } = render(
      <Highlight data-testid="root" text="one two one two one" query="one" current={1} />,
    );
    const root = screen.getByTestId('root');
    expect(shape(root)).toEqual(['<mark>one', ' two ', '<mark current>one', ' two ', '<mark>one']);

    rerender(<Highlight data-testid="root" text="one two one two one" query="one" current={7} />);
    expect(root.querySelector('[data-current]')).toBeNull();
  });

  it('writes disabled on the root and nowhere else', () => {
    render(<Highlight data-testid="root" text="Blueberry" query="berr" disabled />);
    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-disabled', '');
    expect(root.querySelector('mark')).not.toHaveAttribute('data-disabled');
  });

  it('reads its defaults from the provider, and lets the instance win', () => {
    render(
      <HighlightDefaultsProvider occurrences="first" sensitivity="accent">
        <Highlight data-testid="inherited" text="Ana Banana Résumé" query={['an', 'resume']} />
        <Highlight
          data-testid="own"
          text="Ana Banana Résumé"
          query={['an', 'resume']}
          occurrences="all"
          sensitivity="base"
        />
      </HighlightDefaultsProvider>,
    );
    expect(marks(screen.getByTestId('inherited'))).toEqual(['An']);
    expect(marks(screen.getByTestId('own'))).toEqual(['An', 'anan', 'Résumé']);
  });

  it('passes native props and the ref to the root, and lets render replace it', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Highlight
        aria-label="match"
        className="mine"
        data-testid="root"
        lang="pt-BR"
        query="berr"
        ref={ref}
        text="Blueberry"
      />,
    );
    const root = screen.getByTestId('root');
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('lang', 'pt-BR');
    expect(root).toHaveAttribute('aria-label', 'match');
    expect(root).toHaveClass('mine');

    render(
      <Highlight
        text="Blueberry"
        query="berr"
        render={(props) => <p data-testid="own" {...props} />}
      />,
    );
    const own = screen.getByTestId('own');
    expect(own.tagName).toBe('P');
    expect(own).toHaveAttribute('data-ui', 'highlight');
    expect(marks(own)).toEqual(['berr']);
  });
});
