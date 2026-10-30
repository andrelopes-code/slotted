import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  GLYPH_VIEW_BOX,
  GLYPHS,
  isStatusGlyph,
  STATUS_GLYPH_GRIDS,
  STATUS_GLYPHS,
} from '@slotted/core/glyph';
import type { GlyphDrawing, GlyphName, StatusGlyphGrid } from '@slotted/core/glyph';

let sequence = 0;

/**
 * Glyph is the library's own artwork, drawn as a real `<svg>`: the Lucide
 * geometry `@slotted/core/glyph` holds, stroked or filled with `currentColor`.
 * It goes inside a `slIcon` box, which owns the size, the color, the
 * alignment and the name; the glyph owns only the drawing. Every family draws
 * its own icons — a close button's cross, a pager's chevrons — with this
 * element, and never with a pseudo-element or a mask of its own.
 *
 * `solid` draws a status mark the way a tone's badge reads: the glyph's first
 * shape filled, and the symbol inside it cut out of the fill by an SVG
 * `<mask>`, so whatever lies behind shows through the symbol on any ground.
 *
 * A status mark (`status-*`) is always solid, and is drawn once per grid it
 * was drawn on; `icon.css` shows the grid the icon box is sized for.
 *
 * The children carry the `svg:` namespace because the template is parsed apart
 * from its host: an unprefixed `<path>` would be created as an HTML element.
 */
@Component({
  selector: 'svg[slGlyph]',
  standalone: true,
  template: `@if (grids(); as grids) {
      @for (grid of grids; track grid.size) {
        <svg:svg [attr.data-grid]="grid.size" [attr.viewBox]="'0 0 ' + grid.size + ' ' + grid.size">
          <svg:defs>
            <svg:mask
              [attr.id]="maskId + '-' + grid.size"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              [attr.width]="grid.size"
              [attr.height]="grid.size"
            >
              <svg:rect fill="#fff" [attr.width]="grid.size" [attr.height]="grid.size" />
              @for (d of grid.drawing.holes; track $index) {
                <svg:path [attr.d]="d" fill="#000" />
              }
              @for (d of grid.drawing.strokes; track $index) {
                <svg:path
                  [attr.d]="d"
                  fill="none"
                  stroke="#000"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              }
            </svg:mask>
          </svg:defs>
          <svg:path
            [attr.d]="grid.drawing.shape"
            fill="currentColor"
            [attr.mask]="'url(#' + maskId + '-' + grid.size + ')'"
            [attr.stroke]="grid.drawing.shapeStroke === 0 ? null : 'currentColor'"
            [attr.stroke-linejoin]="grid.drawing.shapeStroke === 0 ? null : 'round'"
            [attr.stroke-width]="grid.drawing.shapeStroke === 0 ? null : grid.drawing.shapeStroke"
          />
        </svg:svg>
      }
    } @else {
      @if (solid()) {
        <svg:defs>
          <svg:mask
            [attr.id]="maskId"
            maskUnits="userSpaceOnUse"
            x="-2"
            y="-2"
            width="28"
            height="28"
          >
            <svg:rect x="-2" y="-2" width="28" height="28" fill="#fff" />
            <svg:g
              fill="none"
              stroke="#000"
              stroke-linecap="round"
              stroke-linejoin="round"
              [attr.stroke-width]="drawing().strokeWidth"
            >
              @for (d of symbol(); track $index) {
                <svg:path [attr.d]="d" />
              }
            </svg:g>
          </svg:mask>
        </svg:defs>
      }
      <svg:g [attr.transform]="transform()">
        @if (solid()) {
          <svg:path
            [attr.d]="drawing().paths[0]"
            fill="currentColor"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            [attr.stroke-width]="drawing().strokeWidth"
            [attr.mask]="'url(#' + maskId + ')'"
          />
        } @else {
          @for (d of drawing().paths; track $index) {
            <svg:path [attr.d]="d" />
          }
        }
      </svg:g>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    focusable: 'false',
    'data-part': 'glyph',
    'data-part-glyph': '',
    '[attr.data-glyph]': 'name()',
    '[attr.viewBox]': "grids() ? '0 0 16 16' : viewBox",
    '[attr.data-solid]': "painted() ? null : ''",
    '[attr.fill]': "painted() ? (stroked() ? 'none' : 'currentColor') : null",
    '[attr.stroke]': "painted() && stroked() ? 'currentColor' : null",
    '[attr.stroke-width]': 'painted() && stroked() ? drawing().strokeWidth : null',
    '[attr.stroke-linecap]': "painted() && stroked() ? 'round' : null",
    '[attr.stroke-linejoin]': "painted() && stroked() ? 'round' : null",
  },
})
export class SlGlyph {
  /** One of the library's own icons: its glyph token without `--slotted-icon-`. */
  readonly name = input.required<GlyphName>();
  /**
   * The first shape filled and the symbol cut out of it — a tone's status
   * mark. For glyphs whose first shape encloses the rest (`circle-*`,
   * `triangle-alert`).
   */
  readonly solid = input(false, { transform: booleanAttribute });

  protected readonly maskId = `sl-glyph-${String((sequence += 1))}`;

  protected readonly viewBox = GLYPH_VIEW_BOX;
  /** A status mark's drawing on each of its grids; `null` for a Lucide glyph. */
  protected readonly grids = computed<readonly { size: number; drawing: StatusGlyphGrid }[] | null>(
    () => {
      const name = this.name();
      return isStatusGlyph(name)
        ? STATUS_GLYPH_GRIDS.map((size) => ({ size, drawing: STATUS_GLYPHS[name][size] }))
        : null;
    },
  );
  /** Painted by the root's own fill or stroke rather than by a solid shape. */
  protected readonly painted = computed(() => !this.solid() && this.grids() === null);
  /* A status mark has no Lucide drawing, and reads none: `dot` only keeps the signal typed. */
  protected readonly drawing = computed<GlyphDrawing>(() => {
    const name = this.name();
    return isStatusGlyph(name) ? GLYPHS.dot : GLYPHS[name];
  });
  protected readonly symbol = computed(() => this.drawing().paths.slice(1));
  protected readonly stroked = computed(() => this.drawing().paint === 'stroke');
  protected readonly transform = computed(() => {
    const [dx, dy] = this.drawing().offset;
    return dx === 0 && dy === 0 ? null : `translate(${dx} ${dy})`;
  });
}
