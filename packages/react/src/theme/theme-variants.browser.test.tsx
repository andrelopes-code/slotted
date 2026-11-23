import { defineTheme, recipes, renderTheme } from '@slotted/theme';
import { render } from '@testing-library/react';
import { cdp } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
        tinted: {
          dark: { '--slotted-surface': { seed: 'accent', l: 0.2, c: { scale: 1, max: 0.2 } } },
        },
      },
      shadows: { flat: { dark: { '--slotted-shadow-md': 'none' } } },
      ink: {
        strong: {
          light: { '--slotted-text': { seed: 'neutral', l: 0, c: { scale: 0, max: 0 } } },
        },
      },
    },
  } as never),
);

const BLACK = 'rgb(0, 0, 0)';

/**
 * The reader chooses a variant of the theme as the corners: under an element
 * that names the value, or below it, the dark scheme derives its page again,
 * and what reads the page through `var()` follows; a scheme the value does not
 * change keeps its recipe.
 */
describe('data-slotted-variant-<axis>', () => {
  beforeEach(() => {
    const style = document.createElement('style');
    style.setAttribute('data-variants-test', '');
    style.textContent = css;
    document.head.append(style);
  });

  afterEach(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [] });
    document.head.querySelector('style[data-variants-test]')?.remove();
  });

  it('derives the scheme again below the attribute, on an ancestor or inside the scope', () => {
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

  it('states a scheme value, on the root of the scheme and on an element under it', () => {
    render(
      <>
        <ThemeScope
          data-slotted-variant-shadows="flat"
          data-testid="root"
          scheme="dark"
          theme="variants-test"
        >
          <Probe id="below" />
        </ThemeScope>
        <ThemeScope data-testid="plain" scheme="dark" theme="variants-test">
          <div data-slotted-variant-shadows="flat" data-testid="named">
            <Probe id="under-named" />
          </div>
        </ThemeScope>
        <div data-slotted-variant-shadows="flat">
          <ThemeScope data-testid="light" scheme="light" theme="variants-test" />
        </div>
      </>,
    );

    for (const id of ['root', 'below', 'named', 'under-named'])
      expect(value(id, '--slotted-shadow-md')).toBe('none');
    expect(value('plain', '--slotted-shadow-md')).toMatch(/px/);
    expect(value('light', '--slotted-shadow-md')).toMatch(/px/);
  });

  it('follows the nearest element of each axis', () => {
    render(
      <ThemeScope data-slotted-variant-depth="tinted" scheme="dark" theme="variants-test">
        <Probe id="tinted" />
        <div data-slotted-variant-shadows="flat">
          <Probe id="other-axis" />
        </div>
        <div data-slotted-variant-depth="oled">
          <Probe id="nested" />
          <ThemeScope scheme="dark">
            <Probe id="nested-scheme" />
          </ThemeScope>
          <div data-slotted-variant-depth="tinted">
            <Probe id="nested-back" />
          </div>
        </div>
        <div data-slotted-variant-depth="none">
          <Probe id="off" />
        </div>
      </ThemeScope>,
    );
    const tinted = paint('tinted', '--slotted-surface');

    expect(paint('other-axis', '--slotted-surface')).toBe(tinted);
    expect(value('other-axis', '--slotted-shadow-md')).toBe('none');
    expect(paint('nested', '--slotted-surface')).toBe(BLACK);
    expect(paint('nested-scheme', '--slotted-surface')).toBe(BLACK);
    expect(paint('nested-back', '--slotted-surface')).toBe(tinted);
    expect([BLACK, tinted]).not.toContain(paint('off', '--slotted-surface'));
  });

  it.each(['light', 'dark'])('follows the system scheme that prefers %s', async (preferred) => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: preferred }],
    });
    render(
      <ThemeScope
        data-slotted-variant-depth="oled"
        data-slotted-variant-ink="strong"
        scheme="system"
        theme="variants-test"
      >
        <Probe id="system" />
      </ThemeScope>,
    );

    expect(paint('system', '--slotted-surface') === BLACK).toBe(preferred === 'dark');
    expect(paint('system', '--slotted-text') === BLACK).toBe(preferred === 'light');
  });

  it('derives a value from the seeds of the element it reaches', () => {
    render(
      <ThemeScope data-slotted-variant-depth="tinted" scheme="dark" theme="variants-test">
        <Probe id="blue" />
        <ThemeScope seeds={{ accent: '#dc2626' }}>
          <Probe id="red" />
        </ThemeScope>
      </ThemeScope>,
    );

    expect(paint('red', '--slotted-surface')).not.toBe(paint('blue', '--slotted-surface'));
  });
});

function Probe({ id }: { id: string }) {
  return <div data-testid={id} />;
}

function value(id: string, token: string): string {
  const element = document.querySelector(`[data-testid="${id}"]`)!;

  return getComputedStyle(element).getPropertyValue(token);
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
