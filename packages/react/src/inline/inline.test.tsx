import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Inline } from './index';

describe('Inline', () => {
  it('renders a div, because a div claims nothing about the content', () => {
    render(<Inline data-testid="inline">Draft</Inline>);

    const inline = screen.getByTestId('inline');
    expect(inline.tagName).toBe('DIV');
    expect(inline).toHaveAttribute('data-ui', 'inline');
    expect(inline).toHaveAttribute('data-part', 'root');
  });

  it('writes no axis the consumer did not decide, because the base rule holds the defaults', () => {
    render(<Inline data-testid="inline">Draft</Inline>);

    const inline = screen.getByTestId('inline');
    for (const axis of ['gap', 'align', 'justify', 'wrap']) {
      expect(inline).not.toHaveAttribute(`data-${axis}`);
    }
  });

  it('states each axis the consumer decided', () => {
    render(
      <Inline align="baseline" data-testid="inline" gap={2} justify="end" wrap="nowrap">
        Draft
      </Inline>,
    );

    const inline = screen.getByTestId('inline');
    expect(inline).toHaveAttribute('data-gap', '2');
    expect(inline).toHaveAttribute('data-align', 'baseline');
    expect(inline).toHaveAttribute('data-justify', 'end');
    expect(inline).toHaveAttribute('data-wrap', 'nowrap');
  });

  it('treats no separation as a decision, not as an absent one', () => {
    render(
      <Inline data-testid="inline" gap={0}>
        Draft
      </Inline>,
    );

    expect(screen.getByTestId('inline')).toHaveAttribute('data-gap', '0');
  });

  it('carries no role of its own, so the items keep their semantics', () => {
    render(<Inline data-testid="inline">Draft</Inline>);

    expect(screen.getByTestId('inline')).not.toHaveAttribute('role');
  });

  it('renders into the element the consumer named, keeping the wiring', () => {
    render(
      <Inline data-testid="inline" gap={2} render={(props) => <ul {...props} />}>
        <li>Draft</li>
      </Inline>,
    );

    const inline = screen.getByTestId('inline');
    expect(inline.tagName).toBe('UL');
    expect(inline).toHaveAttribute('data-ui', 'inline');
    expect(inline).toHaveAttribute('data-gap', '2');
  });

  it('passes native attributes through to the element that owns them', () => {
    render(
      <Inline aria-label="Statuses" data-testid="inline" id="statuses" lang="pt-BR">
        Draft
      </Inline>,
    );

    const inline = screen.getByTestId('inline');
    expect(inline).toHaveAttribute('id', 'statuses');
    expect(inline).toHaveAttribute('lang', 'pt-BR');
    expect(inline).toHaveAccessibleName('Statuses');
  });
});
