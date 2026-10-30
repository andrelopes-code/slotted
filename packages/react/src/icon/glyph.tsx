import { withSelectorKey } from '@slotted/core/selector-key';
import {
  GLYPH_VIEW_BOX,
  GLYPHS,
  isStatusGlyph,
  STATUS_GLYPH_GRIDS,
  STATUS_GLYPHS,
} from '@slotted/core/glyph';
import type { GlyphDrawing, StatusGlyphName } from '@slotted/core/glyph';
import { useId } from 'react';

import type { GlyphProps } from './icon.types';

/**
 * Glyph is the library's own artwork, drawn as a real `<svg>`: the Lucide
 * geometry `@slotted/core/glyph` holds, stroked or filled with `currentColor`.
 * It goes inside an `Icon`, which owns the size, the colour, the alignment and
 * the name; the glyph owns only the drawing. Every family draws its own icons
 * — a close button's cross, a pager's chevrons — with this element, and never
 * with a pseudo-element or a mask of its own.
 *
 * `solid` draws a status mark the way a tone's badge reads: the glyph's first
 * shape — the circle of `circle-alert`, the triangle of `triangle-alert` —
 * filled, and the symbol inside it cut out of the fill by an SVG `<mask>`, so
 * whatever lies behind shows through the symbol on any ground.
 *
 * A status mark (`status-*`) is always solid, and is drawn once per grid it
 * was drawn on; `icon.css` shows the grid the icon box is sized for.
 */
export function Glyph({ name, solid = false, ...nativeProps }: GlyphProps) {
  /* An id a `url()` can carry: React's own holds characters it cannot. */
  const maskId = `sl-glyph-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  if (isStatusGlyph(name)) {
    return <StatusGlyph maskId={maskId} name={name} nativeProps={nativeProps} />;
  }
  const drawing: GlyphDrawing = GLYPHS[name];
  const [dx, dy] = drawing.offset;
  const stroke = {
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: drawing.strokeWidth,
  };
  const paint =
    drawing.paint === 'fill'
      ? { fill: 'currentColor' }
      : { fill: 'none', stroke: 'currentColor', ...stroke };
  const [shape, ...symbol] = drawing.paths;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={GLYPH_VIEW_BOX}
      {...(solid ? {} : paint)}
      {...withSelectorKey(nativeProps, 'part', 'glyph')}
      data-glyph={name}

      data-solid={solid ? '' : undefined}
    >
      {solid ? (
        <defs>
          <mask height="28" id={maskId} maskUnits="userSpaceOnUse" width="28" x="-2" y="-2">
            <rect fill="#fff" height="28" width="28" x="-2" y="-2" />
            <g fill="none" stroke="#000" {...stroke}>
              {symbol.map((d, index) => (
                <path d={d} key={index} />
              ))}
            </g>
          </mask>
        </defs>
      ) : null}
      <g transform={dx === 0 && dy === 0 ? undefined : `translate(${dx} ${dy})`}>
        {solid ? (
          <path
            d={shape}
            fill="currentColor"
            mask={`url(#${maskId})`}
            stroke="currentColor"
            {...stroke}
          />
        ) : (
          drawing.paths.map((d, index) => <path d={d} key={index} />)
        )}
      </g>
    </svg>
  );
}

function StatusGlyph({
  maskId,
  name,
  nativeProps,
}: {
  maskId: string;
  name: StatusGlyphName;
  nativeProps: Omit<GlyphProps, 'name' | 'solid'>;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      {...withSelectorKey(nativeProps, 'part', 'glyph')}
      data-glyph={name}
      data-solid=""
    >
      {STATUS_GLYPH_GRIDS.map((grid) => {
        const drawing = STATUS_GLYPHS[name][grid];
        const id = `${maskId}-${String(grid)}`;
        return (
          <svg data-grid={grid} key={grid} viewBox={`0 0 ${String(grid)} ${String(grid)}`}>
            <defs>
              <mask height={grid} id={id} maskUnits="userSpaceOnUse" width={grid} x="0" y="0">
                <rect fill="#fff" height={grid} width={grid} />
                {drawing.holes.map((d, index) => (
                  <path d={d} fill="#000" key={index} />
                ))}
                {drawing.strokes.map((d, index) => (
                  <path
                    d={d}
                    fill="none"
                    key={index}
                    stroke="#000"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                ))}
              </mask>
            </defs>
            <path
              d={drawing.shape}
              fill="currentColor"
              mask={`url(#${id})`}
              {...(drawing.shapeStroke === 0
                ? {}
                : {
                    stroke: 'currentColor',
                    strokeLinejoin: 'round' as const,
                    strokeWidth: drawing.shapeStroke,
                  })}
            />
          </svg>
        );
      })}
    </svg>
  );
}
