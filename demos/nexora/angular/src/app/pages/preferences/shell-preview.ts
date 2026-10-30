import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { ShellPreset } from '../../core/shell/shell-presets';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

type Ground = 'frame' | 'surface' | 'tone' | 'dark' | 'none';

interface Region extends Box {
  readonly ground: Ground;
  /** A card: an edge, a radius. */
  readonly card?: boolean;
}

interface Seam {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** The miniature's own geometry, in view-box units: a 120 × 76 screen. */
const W = 120;
const H = 76;
const G = 4;
const BAR = 11;
const NAV = 30;
const RAIL = 9;

/**
 * A picture of one arrangement, drawn from the same axes the shell reads: where
 * the bar is, which regions are cards, what separates them. Every fill is a
 * theme token, so the picture follows the scheme the reader is choosing in.
 * Decorative: the option's label and description carry the meaning.
 */
@Component({
  selector: 'app-shell-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
    svg {
      block-size: auto;
      border-radius: var(--slotted-radius-md);
      display: block;
      inline-size: 100%;
      outline: 1px solid var(--slotted-border-subtle);
    }
    .frame {
      fill: var(--slotted-surface-sunken);
    }
    .surface {
      fill: var(--slotted-surface);
    }
    .tone {
      fill: color-mix(in oklab, var(--slotted-surface), var(--slotted-text) 7%);
    }
    .dark {
      fill: var(--slotted-surface-inverse);
    }
    .none {
      fill: transparent;
    }
    .card {
      stroke: var(--slotted-border-subtle);
      stroke-width: 0.6;
    }
    .seam {
      stroke: var(--slotted-border-subtle);
      stroke-width: 0.6;
    }
    .row {
      fill: var(--slotted-text-muted);
      opacity: 0.35;
    }
    .row.on-dark {
      fill: var(--slotted-text-inverse);
      opacity: 0.55;
    }
    .current {
      fill: var(--slotted-tone-accent-solid);
      opacity: 0.85;
    }
    .block {
      fill: var(--slotted-surface-sunken);
      stroke: var(--slotted-border-subtle);
      stroke-width: 0.4;
    }
    .wash {
      fill: url(#wash);
    }
  `,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="wash" cx="0" cy="0" r="1.1">
          <stop offset="0" stop-color="var(--slotted-tone-accent-surface)" />
          <stop offset="1" stop-color="var(--slotted-surface-sunken)" />
        </radialGradient>
      </defs>
      <rect
        [class]="preset().wash ? 'wash' : 'frame'"
        x="0"
        y="0"
        [attr.width]="width"
        [attr.height]="height"
      />
      @for (region of regions(); track $index) {
        <rect
          [class]="region.ground + (region.card ? ' card' : '')"
          [attr.x]="region.x"
          [attr.y]="region.y"
          [attr.width]="region.w"
          [attr.height]="region.h"
          [attr.rx]="region.card ? 2.5 : 0"
        />
      }
      @for (seam of seams(); track $index) {
        <line
          class="seam"
          [attr.x1]="seam.x1"
          [attr.y1]="seam.y1"
          [attr.x2]="seam.x2"
          [attr.y2]="seam.y2"
        />
      }
      @for (row of rows(); track $index) {
        <rect
          [class]="row.current ? 'current' : 'row' + (row.dark ? ' on-dark' : '')"
          [attr.x]="row.x"
          [attr.y]="row.y"
          [attr.width]="row.w"
          [attr.height]="row.h"
          rx="1"
        />
      }
      @for (block of blocks(); track $index) {
        <rect
          class="block"
          [attr.x]="block.x"
          [attr.y]="block.y"
          [attr.width]="block.w"
          [attr.height]="block.h"
          rx="1.2"
        />
      }
    </svg>
  `,
})
export class ShellPreview {
  readonly preset = input.required<ShellPreset>();

  protected readonly width = W;
  protected readonly height = H;

  /**
   * The bar, the column and the page, as boxes on the screen. `pad` is the
   * panel's air around its one card; `off` is the gutter a region keeps from
   * the frame on the inset and floating planes; `gap` is the gutter between the
   * column and the page card on those planes.
   */
  private readonly layout = computed(() => {
    const p = this.preset();
    const navFirst = p.primary !== 'banner';
    const inCard = p.canvas === 'inset' || p.canvas === 'floating';
    const pad = p.canvas === 'panel' ? G : 0;
    const off = inCard ? G : 0;
    const navW = NAV + (p.twoLevel ? RAIL : 0);

    const navY = navFirst ? pad + off : BAR + off;
    const bottom = H - pad - off;
    const nav: Box = { x: pad + off, y: navY, w: navW, h: bottom - navY };
    const contentX = nav.x + nav.w + off;
    const contentW = W - pad - off - contentX;
    const bar: Box = navFirst
      ? { x: contentX, y: navY, w: contentW, h: BAR }
      : { x: 0, y: 0, w: W, h: BAR };
    const mainY = navFirst ? navY + BAR : BAR + off;
    const main: Box = { x: contentX, y: mainY, w: contentW, h: bottom - mainY };
    return { bar, nav, main, navFirst };
  });

  protected readonly regions = computed<Region[]>(() => {
    const p = this.preset();
    const { bar, nav, main, navFirst } = this.layout();
    const tone = p.separation === 'tone';
    const regions: Region[] = [];

    if (p.canvas === 'panel') {
      const top = navFirst ? G : BAR;
      regions.push({ x: G, y: top, w: W - 2 * G, h: H - top - G, ground: 'surface', card: true });
    }
    if (p.canvas === 'inset' || p.canvas === 'floating') {
      const top = navFirst ? bar.y : main.y;
      regions.push({
        x: main.x,
        y: top,
        w: main.w,
        h: main.y + main.h - top,
        ground: 'surface',
        card: true,
      });
    }
    if (p.canvas === 'floating') {
      regions.push({ ...nav, ground: p.darkNav ? 'dark' : 'surface', card: true });
    } else {
      const navGround: Ground = p.darkNav
        ? 'dark'
        : tone && (p.canvas === 'flush' || p.canvas === 'panel')
          ? 'tone'
          : p.canvas === 'flush'
            ? 'surface'
            : 'none';
      regions.push({ ...nav, ground: navGround, card: p.darkNav === true && p.canvas === 'inset' });
    }
    if (p.twoLevel) {
      regions.push({ x: nav.x, y: nav.y, w: RAIL, h: nav.h, ground: tone ? 'tone' : 'none' });
    }
    if (!navFirst) {
      const barGround: Ground = p.darkBanner
        ? 'dark'
        : p.canvas === 'flush'
          ? tone
            ? 'tone'
            : 'surface'
          : 'none';
      regions.push({ ...bar, ground: barGround });
    }
    if (p.canvas === 'flush') {
      regions.push({ ...main, ground: tone ? 'surface' : 'frame' });
    }
    return regions;
  });

  protected readonly seams = computed<Seam[]>(() => {
    const p = this.preset();
    if (p.separation === 'tone') return [];
    const { bar, nav, navFirst } = this.layout();
    const seams: Seam[] = [];
    const flushOrPanel = p.canvas === 'flush' || p.canvas === 'panel';
    if (flushOrPanel)
      seams.push({ x1: nav.x + nav.w, y1: nav.y, x2: nav.x + nav.w, y2: nav.y + nav.h });
    if (p.canvas === 'flush' && !navFirst) seams.push({ x1: 0, y1: BAR, x2: W, y2: BAR });
    if (navFirst) seams.push({ x1: bar.x, y1: bar.y + BAR, x2: bar.x + bar.w, y2: bar.y + BAR });
    if (p.twoLevel)
      seams.push({ x1: nav.x + RAIL, y1: nav.y + 2, x2: nav.x + RAIL, y2: nav.y + nav.h - 2 });
    return seams;
  });

  /** The destinations in the column, and the one the reader is on. */
  protected readonly rows = computed(() => {
    const p = this.preset();
    const { nav } = this.layout();
    const dark = p.darkNav === true;
    const rows: { x: number; y: number; w: number; h: number; current: boolean; dark: boolean }[] =
      [];
    const left = nav.x + (p.twoLevel ? RAIL : 0) + 3;
    const width = nav.w - (p.twoLevel ? RAIL : 0) - 6;
    for (let i = 0; i < 5; i++) {
      rows.push({
        x: left,
        y: nav.y + 5 + i * 6,
        w: i === 0 ? width * 0.7 : width,
        h: 3,
        current: i === 2,
        dark,
      });
    }
    if (p.twoLevel) {
      for (let i = 0; i < 4; i++) {
        rows.push({
          x: nav.x + 2.5,
          y: nav.y + 4 + i * 6,
          w: RAIL - 5,
          h: 4,
          current: i === 1,
          dark,
        });
      }
    }
    return rows;
  });

  /** A title and three cards in the page, so the page reads as a page. */
  protected readonly blocks = computed<Box[]>(() => {
    const { bar, main, navFirst } = this.layout();
    const x = main.x + 4;
    const y = main.y + 4;
    const w = main.w - 8;
    const third = (w - 4) / 3;
    const blocks: Box[] = [
      { x, y, w: w * 0.45, h: 3 },
      { x, y: y + 6, w: third, h: 10 },
      { x: x + third + 2, y: y + 6, w: third, h: 10 },
      { x: x + 2 * (third + 2), y: y + 6, w: third, h: 10 },
      { x, y: y + 19, w, h: Math.max(6, main.y + main.h - (y + 19) - 4) },
    ];
    if (navFirst) blocks.push({ x: bar.x + 4, y: bar.y + 4, w: bar.w * 0.3, h: 3 });
    return blocks;
  });
}
