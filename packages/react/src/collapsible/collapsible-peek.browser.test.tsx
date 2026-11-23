import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsibleMore,
  CollapsiblePanel,
  CollapsibleTrigger,
  type CollapsibleMoreProps,
} from './index';

const LINES = Array.from({ length: 30 }, (_, index) => `Line ${index + 1} of the long content`);

/* The package loads no theme, so the two grounds are stated. */
const SCHEMES = {
  light: { background: '#fff', '--slotted-text': '#111' },
  dark: { background: '#111', '--slotted-text': '#f5f5f5' },
} as const;

describe('the control of a closed peek', () => {
  it('stands in one place drawn by the family and drawn as a Button', async () => {
    render(
      <>
        <Peek />

        <Peek
          render={({ children, ...props }) => (
            <Button size="sm" variant="outline" {...props}>
              {children}
            </Button>
          )}
        />
      </>,
    );
    await document.fonts.ready;
    const [own, button] = screen.getAllByRole('button', { name: 'Show more' }).map(placeIn);

    expect(button!.top).toBeCloseTo(own!.top, 0);
    expect(Math.abs(button!.top - own!.top)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(button!.center - own!.center)).toBeLessThanOrEqual(0.5);
  });

  it.each([
    ['light', 'default', undefined],
    ['light', 'Button', undefined],
    ['light', 'Button', '1rem'],
    ['dark', 'default', undefined],
    ['dark', 'Button', undefined],
    ['dark', 'Button', '1rem'],
  ] as const)('covers no legible text (%s, %s, fade %s)', async (scheme, kind, fade) => {
    const button: CollapsibleMoreProps['render'] = ({ children, ...props }) => (
      <Button size="lg" variant="outline" {...props}>
        {children}
      </Button>
    );
    render(<Peek fade={fade} render={kind === 'Button' ? button : undefined} scheme={scheme} />);
    await document.fonts.ready;

    expect(await contrastUnder(screen.getByRole('button', { name: 'Show more' }))).toBeLessThan(
      1.5,
    );
  });

  it('gives the whole peek to the content when no control is drawn', () => {
    const { container } = render(<Peek more={false} />);
    const content = container.querySelector('[data-part="content"]')!;

    expect(getComputedStyle(content).maskImage).toMatch(/rgba\(0, 0, 0, 0\) 100%\)$/);
  });
});

interface PeekProps {
  readonly fade?: string | undefined;
  readonly more?: boolean;
  readonly render?: CollapsibleMoreProps['render'];
  readonly scheme?: keyof typeof SCHEMES;
}

function Peek({ fade, more = true, render: draw, scheme = 'light' }: PeekProps) {
  const style = fade === undefined ? {} : { '--slotted-collapsible-peek-fade': fade };

  return (
    <div style={{ ...SCHEMES[scheme], ...style } as CSSProperties}>
      <Collapsible peek="9rem">
        <CollapsibleHeader>
          <CollapsibleTrigger>Fixed income</CollapsibleTrigger>
        </CollapsibleHeader>

        <CollapsiblePanel>
          {LINES.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </CollapsiblePanel>

        {more && (
          <CollapsibleMore {...(draw === undefined ? {} : { render: draw })}>
            Show more
          </CollapsibleMore>
        )}
      </Collapsible>
    </div>
  );
}

/** The control's top and inline center from the panel it stands at the end of. */
function placeIn(control: HTMLElement) {
  const panel = control.closest('[data-ui="collapsible"]')!.querySelector('[data-part="panel"]')!;
  const box = control.getBoundingClientRect();
  const from = panel.getBoundingClientRect();

  return { top: box.top - from.bottom, center: box.left + box.width / 2 - from.left };
}

/** The contrast of the strongest ink under a control with the ground it stands on. */
async function contrastUnder(control: HTMLElement) {
  const box = control.getBoundingClientRect();
  control.style.visibility = 'hidden';
  const base64 = await page.screenshot({ element: document.documentElement, save: false });
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const scale = image.width / document.documentElement.clientWidth;

  /* The full width of the panel: a word lies under the control or beside it by the text alone. */
  const { data } = context.getImageData(
    0,
    Math.round(box.top * scale),
    image.width,
    Math.round(box.height * scale),
  );
  let lightest = 0;
  let darkest = 1;
  for (let at = 0; at < data.length; at += 4) {
    const luminance =
      0.2126 * linear(data[at]!) + 0.7152 * linear(data[at + 1]!) + 0.0722 * linear(data[at + 2]!);
    lightest = Math.max(lightest, luminance);
    darkest = Math.min(darkest, luminance);
  }

  return (lightest + 0.05) / (darkest + 0.05);
}

function linear(channel: number) {
  const value = channel / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
