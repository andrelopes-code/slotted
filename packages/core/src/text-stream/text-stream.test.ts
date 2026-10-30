import { describe, expect, it } from 'vitest';

import {
  advanceStream,
  EMPTY_STREAM,
  initialStream,
  settleAll,
  settleStream,
  splitWords,
  STREAM_SPREAD,
  STREAM_STAGGER,
} from './text-stream';

const painted = (state: ReturnType<typeof advanceStream>) =>
  state.settled + state.chunks.map((chunk) => chunk.text).join('');

describe('splitWords', () => {
  it('gives each word the spaces and punctuation after it', () => {
    expect(splitWords('O p95 voltou, a 400 ms.')).toEqual([
      'O ',
      'p95 ',
      'voltou, ',
      'a ',
      '400 ',
      'ms.',
    ]);
  });

  it('lets the first word carry what comes before it', () => {
    expect(splitWords(' — e depois')).toEqual([' — e ', 'depois']);
  });

  it('keeps text with no word in it as one piece', () => {
    expect(splitWords(' ')).toEqual([' ']);
    expect(splitWords('')).toEqual([]);
  });
});

describe('advanceStream', () => {
  it('puts every received word in the text at once, and staggers only the paint', () => {
    const state = advanceStream(EMPTY_STREAM, 'The tax service office', { animate: true, now: 0 });
    expect(state.text).toBe('The tax service office');
    expect(painted(state)).toBe('The tax service office');
    expect(state.chunks.map((chunk) => chunk.delay)).toEqual([
      0,
      STREAM_STAGGER,
      STREAM_STAGGER * 2,
      STREAM_STAGGER * 3,
    ]);
  });

  it('compresses a large burst so no word waits more than the spread', () => {
    const burst = Array.from({ length: 60 }, (_, index) => `w${index}`).join(' ');
    const state = advanceStream(EMPTY_STREAM, burst, { animate: true, now: 0 });
    expect(state.chunks).toHaveLength(60);
    expect(Math.max(...state.chunks.map((chunk) => chunk.delay))).toBe(STREAM_SPREAD);
  });

  it('starts a burst after the one still entering, so words never overtake each other', () => {
    const first = advanceStream(EMPTY_STREAM, 'one two three ', { animate: true, now: 0 });
    const second = advanceStream(first, 'one two three four', { animate: true, now: 10 });
    const lastOfFirst = 0 + STREAM_STAGGER * 2;
    const fourth = second.chunks.at(-1);
    expect(fourth?.text).toBe('four');
    expect(10 + (fourth?.delay ?? 0)).toBeGreaterThan(lastOfFirst);
  });

  it('never lets the paint fall more than the spread behind a fast transport', () => {
    let state = EMPTY_STREAM;
    let text = '';
    for (let tick = 0; tick < 200; tick += 1) {
      text += 'word other more ';
      state = advanceStream(state, text, { animate: true, now: tick * 5 });
      for (const chunk of state.chunks) expect(chunk.delay).toBeLessThanOrEqual(STREAM_SPREAD);
    }
  });

  it('writes straight into the settled run when not animating', () => {
    const entering = advanceStream(EMPTY_STREAM, 'a b ', { animate: true, now: 0 });
    const state = advanceStream(entering, 'a b c', { animate: false, now: 5 });
    expect(state.chunks).toEqual([]);
    expect(state.settled).toBe('a b c');
  });

  it('replaces a reply that does not extend the one received', () => {
    const state = advanceStream(initialStream('First version'), 'Another', {
      animate: true,
      now: 0,
    });
    expect(state).toMatchObject({ text: 'Another', settled: 'Another', chunks: [] });
  });

  it('returns the same state when nothing arrived', () => {
    const state = initialStream('same');
    expect(advanceStream(state, 'same', { animate: true, now: 0 })).toBe(state);
  });
});

describe('settleStream', () => {
  it('settles a chunk and every chunk before it, in order', () => {
    const state = advanceStream(EMPTY_STREAM, 'one two three', { animate: true, now: 0 });
    const second = state.chunks[1];
    const settled = settleStream(state, second?.key ?? -1);
    expect(settled.settled).toBe('one two ');
    expect(settled.chunks.map((chunk) => chunk.text)).toEqual(['three']);
    expect(painted(settled)).toBe('one two three');
  });

  it('ignores a key it no longer holds', () => {
    const state = settleAll(advanceStream(EMPTY_STREAM, 'um dois', { animate: true, now: 0 }));
    expect(settleStream(state, 0)).toBe(state);
    expect(state.settled).toBe('um dois');
  });
});
