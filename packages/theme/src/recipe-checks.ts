import { contrast, type Oklch } from './color';
import type { Scheme } from './recipe';

/** The text ratio each scheme promises. `high-contrast` earns its name at AAA. */
export const CONTRAST_REQUIREMENT: Readonly<Record<Scheme, number>> = {
  light: 4.5,
  dark: 4.5,
  'high-contrast': 7,
};

const NON_TEXT = 3;
const CONTROL_EDGE = 1.5;
const HIGHLIGHT_STEP = 0.02;
/** The lightness a dark scheme's raised layer stands above the page: a shadow does not read there. */
const LAYER_STEP = 0.04;
const SURFACES = ['--slotted-surface', '--slotted-surface-raised', '--slotted-surface-sunken'];
const TONES = ['accent', 'secondary', 'neutral', 'success', 'info', 'warning', 'danger'];
const DATA_SLOTS = Array.from({ length: 8 }, (_, index) => `--slotted-data-${index + 1}`);

/**
 * The ratios of `theme-conformance` over evaluated colours, as messages. A
 * recipe passes when every seed of `seedGrid()` leaves this list empty.
 */
export function checkScheme(values: Readonly<Record<string, Oklch>>, scheme: Scheme): string[] {
  const failures: string[] = [];
  const text = CONTRAST_REQUIREMENT[scheme];
  const pair = (fore: string, ground: string, floor: number) => {
    const ratio = contrast(values[fore]!, values[ground]!);
    if (ratio < floor)
      failures.push(`${fore} on ${ground} is ${ratio.toFixed(2)}:1, below ${floor}:1`);
  };

  for (const surface of SURFACES) {
    pair('--slotted-text', surface, text);
    pair('--slotted-text-muted', surface, text);
    pair('--slotted-border-strong', surface, NON_TEXT);
    pair('--slotted-control-border-color', surface, CONTROL_EDGE);
    pair('--slotted-focus-ring-color', surface, NON_TEXT);
    for (const tone of TONES) pair(`--slotted-tone-${tone}-text`, surface, text);
    /* A mark is a non-text element; high contrast holds it to the text ratio. */
    for (const slot of DATA_SLOTS) pair(slot, surface, scheme === 'high-contrast' ? 4.5 : NON_TEXT);
  }
  for (const surface of ['--slotted-surface', '--slotted-surface-raised']) {
    const ground = values[surface]!.l;
    const hover = Math.abs(values['--slotted-tone-secondary-subtle-hover']!.l - ground);
    const active = Math.abs(values['--slotted-tone-secondary-subtle-active']!.l - ground);
    if (hover < HIGHLIGHT_STEP)
      failures.push(`the neutral highlight is ${hover.toFixed(3)} from ${surface}`);
    if (active <= hover)
      failures.push(`the pressed highlight is not beyond the hover on ${surface}`);
  }
  if (scheme === 'dark') {
    const step = values['--slotted-surface-raised']!.l - values['--slotted-surface']!.l;
    if (step < LAYER_STEP)
      failures.push(
        `the raised surface is ${step.toFixed(3)} above the surface, below ${LAYER_STEP}`,
      );
  }
  pair('--slotted-text-inverse', '--slotted-surface-inverse', text);
  pair('--slotted-text-inverse', '--slotted-surface-inverse-hover', text);
  pair('--slotted-text-inverse', '--slotted-surface-inverse-active', text);
  if (scheme !== 'high-contrast') {
    const edge = contrast(values['--slotted-surface']!, values['--slotted-control-border-color']!);
    const strong = contrast(values['--slotted-surface']!, values['--slotted-border-strong']!);
    const disabled = contrast(values['--slotted-surface']!, values['--slotted-disabled-border']!);
    if (edge >= strong) failures.push('the control edge is not lighter than the strong border');
    if (disabled >= edge) failures.push('the disabled border is not lighter than the control edge');
  }
  for (const tone of TONES) {
    for (const state of ['solid', 'solid-hover', 'solid-active']) {
      pair(`--slotted-tone-${tone}-on-solid`, `--slotted-tone-${tone}-${state}`, text);
    }
    pair(`--slotted-tone-${tone}-text`, `--slotted-tone-${tone}-surface`, text);
  }
  for (const tone of ['accent', 'info']) {
    pair(`--slotted-tone-${tone}-border`, '--slotted-surface', NON_TEXT);
    pair(`--slotted-tone-${tone}-border`, `--slotted-tone-${tone}-surface`, NON_TEXT);
  }
  pair('--slotted-disabled-foreground', '--slotted-disabled-background', NON_TEXT);
  /* An icon on a slot used as a ground: a mark, at the non-text ratio. */
  for (const slot of DATA_SLOTS) pair(`${slot}-on`, slot, NON_TEXT);
  return failures;
}

/** Hue 0–345 by 15, chroma 0–0.35 by 0.05, lightness 0.2–0.95 by 0.05: 3072 seeds. */
export function seedGrid(): Oklch[] {
  const seeds: Oklch[] = [];
  for (let h = 0; h < 360; h += 15) {
    for (const c of [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35]) {
      for (let step = 0; step < 16; step += 1) seeds.push({ l: 0.2 + step * 0.05, c, h });
    }
  }
  return seeds;
}
