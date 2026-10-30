import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stack } from './index';

describe('Stack', () => {
  it('renders a div, because a div claims nothing about the content', () => {
    render(<Stack data-testid="stack">Workspace</Stack>);

    const stack = screen.getByTestId('stack');
    expect(stack.tagName).toBe('DIV');
    expect(stack).toHaveAttribute('data-ui', 'stack');
    expect(stack).toHaveAttribute('data-part', 'root');
  });

  it('writes no axis the consumer did not decide', () => {
    render(<Stack data-testid="stack">Workspace</Stack>);

    const stack = screen.getByTestId('stack');
    for (const axis of ['gap', 'align', 'justify']) {
      expect(stack).not.toHaveAttribute(`data-${axis}`);
    }
  });

  it('states each axis the consumer decided', () => {
    render(
      <Stack align="center" data-testid="stack" gap={9} justify="between">
        Workspace
      </Stack>,
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('data-gap', '9');
    expect(stack).toHaveAttribute('data-align', 'center');
    expect(stack).toHaveAttribute('data-justify', 'between');
  });

  it('treats no separation as a decision, not as an absent one', () => {
    render(
      <Stack data-testid="stack" gap={0}>
        Workspace
      </Stack>,
    );

    expect(screen.getByTestId('stack')).toHaveAttribute('data-gap', '0');
  });

  it('carries no role of its own, so the children keep their semantics', () => {
    render(<Stack data-testid="stack">Workspace</Stack>);

    expect(screen.getByTestId('stack')).not.toHaveAttribute('role');
  });

  it('renders into the element the consumer named, keeping the wiring', () => {
    render(
      <Stack data-testid="stack" gap={4} render={(props) => <ul {...props} />}>
        <li>First</li>
      </Stack>,
    );

    const stack = screen.getByTestId('stack');
    expect(stack.tagName).toBe('UL');
    expect(stack).toHaveAttribute('data-ui', 'stack');
    expect(stack).toHaveAttribute('data-gap', '4');
  });

  it('passes native attributes and events through to the element that owns them', () => {
    render(
      <Stack aria-label="Sections" data-testid="stack" id="sections" lang="pt-BR">
        Workspace
      </Stack>,
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveAttribute('id', 'sections');
    expect(stack).toHaveAttribute('lang', 'pt-BR');
    expect(stack).toHaveAccessibleName('Sections');
  });

  it('lets the consumer’s own style stand', () => {
    render(
      <Stack data-testid="stack" style={{ blockSize: '100%' }}>
        Workspace
      </Stack>,
    );

    expect(screen.getByTestId('stack')).toHaveStyle({ blockSize: '100%' });
  });
});
