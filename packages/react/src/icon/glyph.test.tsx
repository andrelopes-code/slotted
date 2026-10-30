import { GLYPHS, STATUS_GLYPH_GRIDS, STATUS_GLYPHS } from '@slotted/core/glyph';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Glyph, Icon } from './index';

describe('Glyph', () => {
  it('draws the library’s geometry as a real svg inside the icon box', () => {
    const { container } = render(
      <Icon>
        <Glyph name="x" />
      </Icon>,
    );
    const svg = container.querySelector('svg');
    expect(svg?.parentElement).toHaveAttribute('data-ui', 'icon');
    expect(svg).toHaveAttribute('data-part', 'glyph');
    expect(svg).toHaveAttribute('data-glyph', 'x');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(
      [...(svg?.querySelectorAll('path') ?? [])].map((path) => path.getAttribute('d')),
    ).toEqual(GLYPHS.x.paths);
  });

  /** Edit is a record's most common action; `file-text` and `ellipsis` do not name it. */
  it('draws a pencil for an edit action on the shared view box', () => {
    expect(Object.keys(GLYPHS)).toContain('pencil');
    const { container } = render(<Glyph name="pencil" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(
      [...(svg?.querySelectorAll('path') ?? [])].map((path) => path.getAttribute('d')),
    ).toEqual(GLYPHS.pencil.paths);
  });

  /** A viewer saves the file it shows and turns a picture a quarter at a time. */
  it.each(['download', 'rotate-cw'] as const)('draws %s on the shared view box', (name) => {
    expect(Object.keys(GLYPHS)).toContain(name);
    const { container } = render(<Glyph name={name} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(
      [...(svg?.querySelectorAll('path') ?? [])].map((path) => path.getAttribute('d')),
    ).toEqual(GLYPHS[name].paths);
  });

  it('strokes with the color it inherits, at the manifest’s weight, or fills', () => {
    const { container } = render(
      <>
        <Glyph name="check" />
        <Glyph name="dot" />
      </>,
    );
    const [check, dot] = [...container.querySelectorAll('svg')];
    expect(check).toHaveAttribute('stroke', 'currentColor');
    expect(check).toHaveAttribute('stroke-width', String(GLYPHS.check.strokeWidth));
    expect(check).toHaveAttribute('fill', 'none');
    expect(dot).toHaveAttribute('fill', 'currentColor');
    expect(dot).not.toHaveAttribute('stroke');
  });

  it('moves the ink onto the center the mask centerd it on', () => {
    const { container } = render(<Glyph name="check" />);
    const [dx, dy] = GLYPHS.check.offset;
    expect(container.querySelector('g')).toHaveAttribute('transform', `translate(${dx} ${dy})`);
  });

  it('fills the enclosing shape and cuts the symbol out of it when solid', () => {
    const { container } = render(<Glyph name="circle-alert" solid />);
    const svg = container.querySelector('svg');
    const mask = svg?.querySelector('mask');
    const shape = svg?.querySelector(':scope > g > path');
    expect(svg).toHaveAttribute('data-solid');
    expect(svg).not.toHaveAttribute('stroke');
    expect(shape).toHaveAttribute('d', GLYPHS['circle-alert'].paths[0]);
    expect(shape).toHaveAttribute('fill', 'currentColor');
    expect(shape?.getAttribute('mask')).toBe(`url(#${mask?.id ?? ''})`);
    expect(
      [...(mask?.querySelectorAll('path') ?? [])].map((path) => path.getAttribute('d')),
    ).toEqual(GLYPHS['circle-alert'].paths.slice(1));
  });
  it('draws a status mark once per grid, each with its own mask', () => {
    const { container } = render(<Glyph name="status-warning" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-solid');
    expect(svg).not.toHaveAttribute('fill');
    const grids = [...(svg?.querySelectorAll(':scope > svg[data-grid]') ?? [])];
    expect(grids.map((grid) => Number(grid.getAttribute('data-grid')))).toEqual([
      ...STATUS_GLYPH_GRIDS,
    ]);
    for (const grid of grids) {
      const size = Number(grid.getAttribute('data-grid')) as 12 | 14 | 16;
      const drawing = STATUS_GLYPHS['status-warning'][size];
      const shape = grid.querySelector(':scope > path');
      expect(grid).toHaveAttribute('viewBox', `0 0 ${String(size)} ${String(size)}`);
      expect(shape).toHaveAttribute('d', drawing.shape);
      expect(shape).toHaveAttribute('stroke-width', String(drawing.shapeStroke));
      expect(shape?.getAttribute('mask')).toBe(`url(#${grid.querySelector('mask')?.id ?? ''})`);
    }
    expect(new Set(grids.map((grid) => grid.querySelector('mask')?.id)).size).toBe(3);
  });

  /**
   * A previous and next pair — a month, a period, a page — is drawn from one
   * set: every chevron and every arrow exists in all four directions, at the
   * same weight.
   */
  it('draws chevrons and arrows in all four directions, at one weight', () => {
    for (const shape of ['chevron', 'arrow'] as const) {
      for (const direction of ['left', 'right', 'up', 'down'] as const) {
        const glyph = GLYPHS[`${shape}-${direction}`];
        expect(glyph.paint).toBe('stroke');
        expect(glyph.strokeWidth).toBe(GLYPHS[`${shape}-right`].strokeWidth);
      }
    }
  });
});
