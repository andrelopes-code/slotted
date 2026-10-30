import { defineTheme, recipes, renderTheme } from '@slotted/theme';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import values from '../../../themes/src/default/values.json';
import { ThemeScope } from './theme-scope';

const css = renderTheme(
  defineTheme({
    ...(values as object),
    name: 'variants-test',
    seeds: {
      accent: '#1d4ed8',
      neutral: '#64748b',
      success: '#15803d',
      info: 'oklch(0.6 0.15 255)',
      warning: '#facc15',
      danger: '#dc2626',
    },
    recipe: recipes.standard,
    variants: {
      depth: {
        oled: {
          dark: { '--slotted-surface': { seed: 'neutral', l: 0, c: { scale: 0, max: 0 } } },
        },
      },
    },
  } as never),
);

const BLACK = 'rgb(0, 0, 0)';

/**
 * The reader chooses a variant of the recipe as the corners: under an element
 * that names the value, or below it, the dark scheme derives its page again,
 * and what reads the page through `var()` follows; a scheme the value does not
 * change keeps its recipe.
 */
describe('data-slotted-variant-<axis>', () => {
  afterEach(() => {
    document.head.querySelector('style[data-variants-test]')?.remove();
  });

  it('derives the scheme again below the attribute, on an ancestor or inside the scope', () => {
    const style = document.createElement('style');
    style.setAttribute('data-variants-test', '');
    style.textContent = css;
    document.head.append(style);
    render(
      <>
        <div data-slotted-variant-depth="oled">
          <ThemeScope theme="variants-test" scheme="dark">
            <Probe id="ancestor" />
            <ThemeScope scheme="light">
              <Probe id="light" />
            </ThemeScope>
          </ThemeScope>
        </div>
        <ThemeScope theme="variants-test" scheme="dark">
          <Probe id="outside" />
          <div data-slotted-variant-depth="oled">
            <Probe id="inside" />
          </div>
        </ThemeScope>
      </>,
    );

    expect(paint('outside', '--slotted-surface')).not.toBe(BLACK);
    expect(paint('ancestor', '--slotted-surface')).toBe(BLACK);
    expect(paint('ancestor', '--slotted-control-surface')).toBe(BLACK);
    expect(paint('inside', '--slotted-surface')).toBe(BLACK);
    expect(paint('inside', '--slotted-control-surface')).toBe(BLACK);
    expect(paint('ancestor', '--slotted-text')).toBe(paint('outside', '--slotted-text'));
    expect(paint('light', '--slotted-surface')).not.toBe(BLACK);
    expect(paint('light', '--slotted-surface')).not.toBe(paint('outside', '--slotted-surface'));
  });
});

function Probe({ id }: { id: string }) {
  return <div data-testid={id} />;
}

/** The color a token paints, as the browser resolves it. */
function paint(id: string, token: string): string {
  const probe = document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  probe.style.backgroundColor = `var(${token})`;
  const color = getComputedStyle(probe).backgroundColor;
  probe.style.backgroundColor = 'rgb(1, 2, 3)';
  const swatch = getComputedStyle(probe).backgroundColor;
  probe.style.removeProperty('background-color');

  return color === swatch ? 'unresolved' : normalize(color);
}

/** `oklch(0 0 none)` and `rgb(0, 0, 0)` name one color; the canvas reads both as sRGB. */
function normalize(color: string): string {
  const context = document.createElement('canvas').getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

  return `rgb(${String(red)}, ${String(green)}, ${String(blue)})`;
}
