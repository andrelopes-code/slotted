import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createRef } from 'react';

import contract from '../../../../specs/components/container/contract.json';
import { Container, ContainerBreakout, ContainerDefaultsProvider } from './index';

const defaults = contract.members.container.defaults;

describe('Container', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(
      <Container data-testid="root">
        <ContainerBreakout data-testid="breakout" />
      </Container>,
    );

    expect(screen.getByTestId('root')).toHaveAttribute('data-ui', 'container');
    expect(screen.getByTestId('root')).toHaveAttribute('data-part', 'root');
    expect(screen.getByTestId('breakout')).toHaveAttribute('data-part', 'breakout');
  });

  it('adds no role, because a box that bounds a region claims nothing', () => {
    render(
      <Container data-testid="root">
        <ContainerBreakout data-testid="breakout" />
      </Container>,
    );

    for (const id of ['root', 'breakout']) {
      expect(screen.getByTestId(id)).not.toHaveAttribute('role');
      expect(screen.getByTestId(id)).not.toHaveAttribute('aria-label');
    }
  });

  it('writes the contract defaults when the consumer states nothing', () => {
    render(<Container data-testid="root" />);

    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-size', defaults.size);
    expect(root).toHaveAttribute('data-inset', defaults.inset);
    expect(root).toHaveAttribute('data-align', defaults.align);
  });

  it('writes each axis the consumer states', () => {
    render(<Container align="start" data-testid="root" inset={0} size="measure" />);

    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-size', 'measure');
    expect(root).toHaveAttribute('data-inset', '0');
    expect(root).toHaveAttribute('data-align', 'start');
  });

  it('takes an application-wide default rather than repeating three props', () => {
    render(
      <ContainerDefaultsProvider align="end" inset={9} size="wide">
        <Container data-testid="root" />
      </ContainerDefaultsProvider>,
    );

    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('data-size', 'wide');
    expect(root).toHaveAttribute('data-inset', '9');
    expect(root).toHaveAttribute('data-align', 'end');
  });

  it('lets an explicit value win over the provider, never the other way round', () => {
    render(
      <ContainerDefaultsProvider inset={9} size="wide">
        <Container data-testid="root" size="measure" />
      </ContainerDefaultsProvider>,
    );

    expect(screen.getByTestId('root')).toHaveAttribute('data-size', 'measure');
    expect(screen.getByTestId('root')).toHaveAttribute('data-inset', '9');
  });

  it('lets a nested provider narrow only what it states', () => {
    render(
      <ContainerDefaultsProvider inset={9} size="wide">
        <ContainerDefaultsProvider size="measure">
          <Container data-testid="root" />
        </ContainerDefaultsProvider>
      </ContainerDefaultsProvider>,
    );

    expect(screen.getByTestId('root')).toHaveAttribute('data-size', 'measure');
    expect(screen.getByTestId('root')).toHaveAttribute('data-inset', '9');
  });

  it('substitutes the rendered element of both parts without losing the wiring', () => {
    render(
      <Container render={(props) => <main {...props} data-testid="root" />} size="measure">
        <ContainerBreakout render={(props) => <figure {...props} data-testid="breakout" />} />
      </Container>,
    );

    const root = screen.getByTestId('root');
    expect(root.tagName).toBe('MAIN');
    expect(root).toHaveAttribute('data-ui', 'container');
    expect(root).toHaveAttribute('data-size', 'measure');

    const breakout = screen.getByTestId('breakout');
    expect(breakout.tagName).toBe('FIGURE');
    expect(breakout).toHaveAttribute('data-part', 'breakout');
  });

  it('passes native attributes and the consumer’s own handler through', async () => {
    const seen: string[] = [];
    render(
      <Container
        aria-label="Settings"
        data-testid="root"
        id="page"
        lang="pt-BR"
        onClick={() => seen.push('clicked')}
      />,
    );

    const root = screen.getByTestId('root');
    expect(root).toHaveAttribute('id', 'page');
    expect(root).toHaveAttribute('lang', 'pt-BR');
    expect(root).toHaveAttribute('aria-label', 'Settings');

    root.click();
    expect(seen).toEqual(['clicked']);
  });

  it('reaches the native element through a ref', () => {
    const root = createRef<HTMLDivElement>();
    const breakout = createRef<HTMLDivElement>();
    render(
      <Container ref={root}>
        <ContainerBreakout ref={breakout} />
      </Container>,
    );

    expect(root.current).toBeInstanceOf(HTMLDivElement);
    expect(breakout.current).toBeInstanceOf(HTMLDivElement);
  });

  it('nests, so bounded content returns inside a breakout', () => {
    render(
      <Container data-testid="outer" size="measure">
        <ContainerBreakout data-testid="breakout">
          <Container data-testid="inner" size="full" />
        </ContainerBreakout>
      </Container>,
    );

    expect(screen.getByTestId('outer')).toHaveAttribute('data-size', 'measure');
    expect(screen.getByTestId('inner')).toHaveAttribute('data-size', 'full');
    expect(screen.getByTestId('breakout')).toContainElement(screen.getByTestId('inner'));
  });

  it('offers every step the contract declares, and no other', () => {
    for (const size of contract.axes.size) {
      render(<Container data-testid={size} size={size as never} />);
      expect(screen.getByTestId(size)).toHaveAttribute('data-size', size);
    }
  });
});
