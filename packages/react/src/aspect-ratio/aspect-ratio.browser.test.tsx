import { render } from '@testing-library/react';
import type { CSSProperties, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { AspectRatio } from './index';

const PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000'/%3E";

const PARENTS: Record<string, CSSProperties> = {
  block: { display: 'block' },
  column: { display: 'flex', flexDirection: 'column' },
  grid: { display: 'grid' },
};

/** A flex column resolves the automatic minimum of its items through their ratio. */
describe.each(Object.keys(PARENTS))('a frame inside a %s', (parent) => {
  it('keeps the ratio while the content fits', () => {
    expect(frameHeight(parent, <div style={{ minBlockSize: 50 }} />)).toBeCloseTo(180, 0);
  });

  it('grows around content taller than the ratio', () => {
    expect(frameHeight(parent, <div style={{ blockSize: 300 }} />)).toBeCloseTo(300, 0);
  });

  it('is not grown by a replaced child', async () => {
    const { container } = renderFrame(parent, <img alt="" src={PICTURE} />);
    const picture = container.querySelector('img')!;
    await picture.decode();

    expect(frameOf(container).height).toBeCloseTo(180, 0);
    expect(picture.getBoundingClientRect().height).toBeCloseTo(180, 0);
  });
});

/** A frame beside a taller sibling keeps its ratio, as a box with a ratio does. */
describe('a frame in a row beside taller content', () => {
  it('keeps its ratio', () => {
    const { container } = render(
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', inlineSize: 640 }}>
        <AspectRatio ratio="video">
          <span>Dock 4</span>
        </AspectRatio>
        <div style={{ blockSize: 400 }} />
      </div>,
    );

    expect(frameOf(container).height).toBeCloseTo(180, 0);
  });
});

function frameHeight(parent: string, child: ReactElement) {
  return frameOf(renderFrame(parent, child).container).height;
}

function renderFrame(parent: string, child: ReactElement) {
  return render(
    <div style={{ ...PARENTS[parent], inlineSize: 320 }}>
      <AspectRatio ratio="video">{child}</AspectRatio>
    </div>,
  );
}

function frameOf(container: HTMLElement) {
  return container.querySelector('[data-ui="aspect-ratio"]')!.getBoundingClientRect();
}
