import { render, screen } from '@testing-library/react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { Glyph, Icon } from '../icon';
import {
  PromptComposer,
  PromptComposerAction,
  PromptComposerAttach,
  PromptComposerFooter,
  PromptComposerInput,
  PromptComposerSubmit,
} from './index';

const MOTION = { '--slotted-duration-loop-slow': '4s' } as CSSProperties;

/**
 * An AI input marked by a ring of turning hues. An application drew it behind
 * the composer and zeroed the focus outline through tokens, which also took
 * the focus mark from the buttons inside.
 */
describe('a composer with the emphasis ring', () => {
  it('turns the ring by a transform and leaves the actions their focus ring', async () => {
    render(
      <div style={MOTION}>
        <PromptComposer emphasis="ring">
          <PromptComposerInput aria-label="Prompt" />
          <PromptComposerFooter>
            <PromptComposerAction aria-label="Attach">+</PromptComposerAction>
          </PromptComposerFooter>
        </PromptComposer>
      </div>,
    );
    const ring = document.querySelector('[data-part="ring"]') as HTMLElement;
    const [turn] = ring.getAnimations({ subtree: true });
    const properties = (turn?.effect as KeyframeEffect)
      .getKeyframes()
      .flatMap((frame) => Object.keys(frame));

    expect(turn?.playState).toBe('running');
    expect(properties).toContain('transform');
    expect(properties.some((name) => name.startsWith('--'))).toBe(false);

    await userEvent.click(screen.getByRole('textbox', { name: 'Prompt' }));
    await userEvent.keyboard('{Tab}');
    const action = screen.getByRole('button', { name: 'Attach' });
    expect(document.activeElement).toBe(action);
    expect(getComputedStyle(action).outlineStyle).toBe('solid');
  });
});

/**
 * The glow is a soft halo. It was a box the reach larger than the composer,
 * blurred and then cut by a hard-edged mask: a band with sharp edges, and a
 * box that gave a scrolling ancestor overflow. The halo is the blur's ink
 * around a box the composer's own size, which adds nothing to a layout and
 * fades with nothing to cut it.
 */
describe('the glow of the emphasis ring', () => {
  it('adds no overflow to a scrolling container and draws no hard-edged mask', () => {
    render(
      <div
        data-testid="scroller"
        style={{ overflow: 'auto', blockSize: 200, display: 'grid', alignContent: 'end' }}
      >
        <PromptComposer emphasis="ring" style={MOTION}>
          <PromptComposerInput aria-label="m" />
        </PromptComposer>
      </div>,
    );
    const scroller = screen.getByTestId('scroller');
    const root = document.querySelector('[data-ui="prompt-composer"]') as HTMLElement;
    const glow = root.querySelector('[data-part="glow"]') as HTMLElement;

    expect(scroller.scrollHeight).toBe(scroller.clientHeight);
    expect(getComputedStyle(glow).maskImage).toBe('none');
    expect(getComputedStyle(glow).filter).toMatch(/^blur\(/);
    const outer = root.getBoundingClientRect();
    const halo = glow.getBoundingClientRect();
    expect(halo.top).toBeGreaterThanOrEqual(outer.top - 2);
    expect(halo.bottom).toBeLessThanOrEqual(outer.bottom + 2);
  });
});

describe('a text action named by aria-label', () => {
  it('keeps the padding, color and weight of a text action', () => {
    render(
      <PromptComposer>
        <PromptComposerInput aria-label="Message" />
        <PromptComposerFooter>
          <PromptComposerAction aria-label="Model: gpt-5">gpt-5</PromptComposerAction>
          <PromptComposerAction>gpt-4</PromptComposerAction>
          <PromptComposerAction aria-label="Search">
            <Icon>
              <Glyph name="search-x" />
            </Icon>
          </PromptComposerAction>
        </PromptComposerFooter>
      </PromptComposer>,
    );
    const named = getComputedStyle(screen.getByRole('button', { name: 'Model: gpt-5' }));
    const plain = getComputedStyle(screen.getByRole('button', { name: 'gpt-4' }));
    const icon = getComputedStyle(screen.getByRole('button', { name: 'Search' }));

    expect(parseFloat(named.paddingInlineStart)).toBeGreaterThan(0);
    expect(named.paddingInlineStart).toBe(plain.paddingInlineStart);
    expect(named.color).toBe(plain.color);
    expect(named.fontWeight).toBe(plain.fontWeight);
    expect(icon.paddingInlineStart).toBe('0px');
  });
});

describe('the round buttons of the footer at a root other than 16px', () => {
  it.each(['14px', '15px'])('measure whole pixels at a %s root', (size) => {
    document.documentElement.style.fontSize = size;
    try {
      render(
        <PromptComposer value="">
          <PromptComposerInput aria-label="Message" />
          <PromptComposerFooter>
            <PromptComposerAttach />
            <PromptComposerSubmit />
          </PromptComposerFooter>
        </PromptComposer>,
      );
      for (const part of ['submit', 'attach']) {
        const box = document.querySelector(`[data-part="${part}"]`)!.getBoundingClientRect();
        expect(Number.isInteger(box.width), `${part} width ${box.width}`).toBe(true);
        expect(Number.isInteger(box.height), `${part} height ${box.height}`).toBe(true);
      }
    } finally {
      document.documentElement.style.fontSize = '';
    }
  });
});

describe('content beside the input', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    'starts on the edge of the value text through the published inset at %s',
    (size) => {
      render(
        <PromptComposer size={size} value="">
          <PromptComposerInput aria-label="Message" />
          <div
            data-testid="line"
            style={{ paddingInline: 'var(--slotted-prompt-composer-content-inset)' }}
          >
            One line under the input
          </div>
          <PromptComposerFooter>
            <PromptComposerSubmit />
          </PromptComposerFooter>
        </PromptComposer>,
      );
      const input = screen.getByRole('textbox', { name: 'Message' });
      const line = screen.getByTestId('line');
      const start = (element: HTMLElement) =>
        element.getBoundingClientRect().left +
        parseFloat(getComputedStyle(element).paddingInlineStart) +
        parseFloat(getComputedStyle(element).borderInlineStartWidth);

      expect(parseFloat(getComputedStyle(line).paddingInlineStart)).toBeGreaterThan(0);
      expect(start(line)).toBeCloseTo(start(input), 2);
    },
  );
});
