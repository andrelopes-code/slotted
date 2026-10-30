/**
 * The arrival of streamed text, with no framework and no DOM in it.
 *
 * A reply arrives from its transport in bursts: one token, then nothing for
 * 200 ms, then forty words at once. Painted as received, the words land in
 * blocks and the eye reads the blocks, not the sentence. The state below
 * splits every arrival into words and gives each word a delay, so a burst
 * enters as a short wave, word after word, and a single token enters at once.
 *
 * Nothing is withheld. Every word is in the text, and in the accessibility
 * tree, the moment it arrives; the delay is only on its paint. The wave is
 * bounded: no word waits more than `spread` milliseconds after it arrived,
 * however fast the transport runs, so the paint never falls behind the
 * transport by more than one wave.
 *
 * A binding renders `settled` as plain text and each chunk as an element that
 * animates in after its delay, and calls `settleStream` when a chunk's
 * animation ends, so the number of elements stays the number of words still
 * entering, not the number of words in the reply.
 */

export interface StreamChunk {
  /** Stable for the life of the chunk; a binding keys the element by it. */
  readonly key: number;
  /** One word with the spaces and punctuation that follow it. */
  readonly text: string;
  /** Milliseconds between the arrival and the start of the chunk's entrance. */
  readonly delay: number;
}

export interface StreamState {
  /** The full text received so far. */
  readonly text: string;
  /** The text whose entrance is over, painted as one run. */
  readonly settled: string;
  /** The words still entering, in order, after `settled`. */
  readonly chunks: readonly StreamChunk[];
  /** The time at which the last scheduled chunk starts its entrance. */
  readonly releaseAt: number;
  readonly nextKey: number;
}

export interface StreamStepOptions {
  /** Animate this arrival. False writes it straight into `settled`. */
  animate: boolean;
  /** The current time, in milliseconds, from the same clock on every call. */
  now: number;
  /** Milliseconds between two words of one burst. */
  stagger?: number | undefined;
  /** The longest a word waits after it arrived, in milliseconds. */
  spread?: number | undefined;
  locale?: string | undefined;
}

/**
 * 28 ms between words is a wave the eye follows as a reading direction; at the
 * 50 ms of a typewriter effect the words start to read as being typed. 320 ms
 * is `--slotted-duration-long`: a burst of any size finishes entering within
 * one long transition of its arrival.
 */
export const STREAM_STAGGER = 28;
export const STREAM_SPREAD = 320;

export const EMPTY_STREAM: StreamState = {
  text: '',
  settled: '',
  chunks: [],
  releaseAt: Number.NEGATIVE_INFINITY,
  nextKey: 0,
};

/** A stream that starts with `text` already painted, as a finished reply does. */
export function initialStream(text: string): StreamState {
  return { ...EMPTY_STREAM, text, settled: text };
}

const WORD_LIKE = /[\p{L}\p{N}]/u;

/**
 * Splits text into words, each carrying the spaces and punctuation after it.
 * Text before the first word is carried by the first word. A continuation of
 * the previous arrival's last word is a word of its own here; it enters as
 * the rest of that word.
 */
export function splitWords(text: string, locale?: string): string[] {
  if (text === '') return [];
  const segments =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? Array.from(new Intl.Segmenter(locale, { granularity: 'word' }).segment(text), (s) => ({
          text: s.segment,
          word: s.isWordLike ?? WORD_LIKE.test(s.segment),
        }))
      : text.split(/(\s+)/).map((segment) => ({ text: segment, word: WORD_LIKE.test(segment) }));
  const words: string[] = [];
  let lead = '';
  for (const segment of segments) {
    if (segment.text === '') continue;
    if (segment.word) {
      words.push(lead + segment.text);
      lead = '';
    } else if (words.length === 0) {
      lead += segment.text;
    } else {
      words[words.length - 1] += segment.text;
    }
  }
  if (lead !== '') words.push(lead);
  return words;
}

/**
 * The state after the text has become `text`.
 *
 * Text that extends what was received enters word by word. Text that does not
 * — a regenerated reply, a cleared one — replaces everything at once: there is
 * no arrival to show, only a different reply.
 */
export function advanceStream(
  state: StreamState,
  text: string,
  options: StreamStepOptions,
): StreamState {
  if (text === state.text) return state;
  if (!text.startsWith(state.text)) return { ...EMPTY_STREAM, text, settled: text };

  const fresh = text.slice(state.text.length);
  if (!options.animate) {
    const entering = state.chunks.map((chunk) => chunk.text).join('');
    return { ...state, text, settled: state.settled + entering + fresh, chunks: [] };
  }

  const stagger = options.stagger ?? STREAM_STAGGER;
  const spread = options.spread ?? STREAM_SPREAD;
  const words = splitWords(fresh, options.locale);
  /* A burst starts after the one still entering, and never later than `spread`. */
  const start = Math.min(Math.max(0, state.releaseAt - options.now + stagger), spread);
  const step = words.length > 1 ? Math.min(stagger, (spread - start) / (words.length - 1)) : 0;
  let key = state.nextKey;
  const chunks = words.map((word, index) => ({
    key: key++,
    text: word,
    delay: Math.round(start + index * step),
  }));
  const last = chunks.at(-1);
  return {
    text,
    settled: state.settled,
    chunks: [...state.chunks, ...chunks],
    releaseAt: last === undefined ? state.releaseAt : options.now + last.delay,
    nextKey: key,
  };
}

/**
 * The state after the chunk `key` has finished entering. The chunks before it
 * are settled with it: they started earlier, and a chunk is never painted
 * settled while one before it is still entering.
 */
export function settleStream(state: StreamState, key: number): StreamState {
  const index = state.chunks.findIndex((chunk) => chunk.key === key);
  if (index === -1) return state;
  const done = state.chunks.slice(0, index + 1);
  return {
    ...state,
    settled: state.settled + done.map((chunk) => chunk.text).join(''),
    chunks: state.chunks.slice(index + 1),
  };
}

/** Every chunk settled: the stream has ended, or motion is reduced. */
export function settleAll(state: StreamState): StreamState {
  const last = state.chunks.at(-1);
  return last === undefined ? state : settleStream(state, last.key);
}

/** Whether the reader asked for reduced motion. */
export function prefersReducedMotion(view: Window | null | undefined): boolean {
  if (view === null || view === undefined || typeof view.matchMedia !== 'function') return false;
  return view.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
