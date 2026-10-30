import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Grid } from './index';

describe('Grid', () => {
  it('renders a div, because a div claims nothing about the content', () => {
    render(<Grid data-testid="grid">Revenue</Grid>);

    const grid = screen.getByTestId('grid');
    expect(grid.tagName).toBe('DIV');
    expect(grid).toHaveAttribute('data-ui', 'grid');
    expect(grid).toHaveAttribute('data-part', 'root');
  });

  it('writes no axis the consumer did not decide', () => {
    render(<Grid data-testid="grid">Revenue</Grid>);

    const grid = screen.getByTestId('grid');
    for (const axis of ['gap', 'columns', 'min-item-width', 'align', 'justify']) {
      expect(grid).not.toHaveAttribute(`data-${axis}`);
    }
  });

  it('states each axis the consumer decided', () => {
    render(
      <Grid align="center" columns={3} data-testid="grid" gap={2} justify="end" minItemWidth="lg">
        Revenue
      </Grid>,
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveAttribute('data-gap', '2');
    expect(grid).toHaveAttribute('data-columns', '3');
    expect(grid).toHaveAttribute('data-min-item-width', 'lg');
    expect(grid).toHaveAttribute('data-align', 'center');
    expect(grid).toHaveAttribute('data-justify', 'end');
  });

  it('hands the count to the track function, which cannot read an attribute', () => {
    render(
      <Grid columns={4} data-testid="grid">
        Revenue
      </Grid>,
    );

    expect(screen.getByTestId('grid').style.getPropertyValue('--slotted-grid-columns')).toBe('4');
  });

  it('writes no count property when the grid fits as many tracks as it can', () => {
    render(<Grid data-testid="grid">Revenue</Grid>);

    expect(screen.getByTestId('grid').style.getPropertyValue('--slotted-grid-columns')).toBe('');
  });

  it('carries no role, because role=grid is a composite widget and this is a layout', () => {
    render(<Grid data-testid="grid">Revenue</Grid>);

    expect(screen.getByTestId('grid')).not.toHaveAttribute('role');
  });

  it('renders into the element the consumer named, keeping the wiring', () => {
    render(
      <Grid columns={2} data-testid="grid" render={(props) => <ul {...props} />}>
        <li>Revenue</li>
      </Grid>,
    );

    const grid = screen.getByTestId('grid');
    expect(grid.tagName).toBe('UL');
    expect(grid).toHaveAttribute('data-ui', 'grid');
    expect(grid).toHaveAttribute('data-columns', '2');
    expect(grid.style.getPropertyValue('--slotted-grid-columns')).toBe('2');
  });

  it('lets the consumer’s own style stand beside the count', () => {
    render(
      <Grid columns={2} data-testid="grid" style={{ marginBlockStart: '8px' }}>
        Revenue
      </Grid>,
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveStyle({ marginBlockStart: '8px' });
    expect(grid.style.getPropertyValue('--slotted-grid-columns')).toBe('2');
  });

  it('passes native attributes through to the element that owns them', () => {
    render(
      <Grid aria-label="Sections" data-testid="grid" id="sections" lang="pt-BR">
        Revenue
      </Grid>,
    );

    const grid = screen.getByTestId('grid');
    expect(grid).toHaveAttribute('id', 'sections');
    expect(grid).toHaveAttribute('lang', 'pt-BR');
    expect(grid).toHaveAccessibleName('Sections');
  });
});
