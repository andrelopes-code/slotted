import { describe, expect, it, vi } from 'vitest';

import { appendPhrase, createDictation } from './dictation';

/** The engine's surface the family uses: start, stop, and the result, end and error events. */
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  continuous = false;
  interimResults = true;
  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
  deliver(transcript: string, isFinal: boolean) {
    const result = Object.assign([{ transcript }], { isFinal });
    this.onresult?.({ resultIndex: 0, results: [result] });
  }
}

describe('createDictation', () => {
  it('is null without a recognition engine', () => {
    expect(createDictation({ onPhrase: () => {}, onListeningChange: () => {} }, {})).toBeNull();
  });

  it('listens in the language asked for, hands each final phrase on, and ends with the engine', () => {
    const phrases: string[] = [];
    const listening: boolean[] = [];
    const dictation = createDictation(
      {
        lang: 'pt-BR',
        onListeningChange: (value) => listening.push(value),
        onPhrase: (phrase) => phrases.push(phrase),
      },
      { webkitSpeechRecognition: FakeRecognition },
    );
    dictation?.start();
    const engine = FakeRecognition.last as FakeRecognition;
    expect(engine.lang).toBe('pt-BR');
    expect(engine.continuous).toBe(true);
    expect(engine.interimResults).toBe(false);
    expect(dictation?.listening).toBe(true);

    engine.deliver(' hello ', false);
    engine.deliver(' hello ', true);
    expect(phrases).toEqual(['hello']);

    engine.onend?.();
    expect(dictation?.listening).toBe(false);
    expect(listening).toEqual([true, false]);
  });

  it('stops on a second press', () => {
    const dictation = createDictation(
      { onListeningChange: () => {}, onPhrase: () => {} },
      { SpeechRecognition: FakeRecognition },
    );
    dictation?.start();
    dictation?.stop();
    expect(FakeRecognition.last?.stop).toHaveBeenCalled();
    expect(dictation?.listening).toBe(false);
  });
});

describe('appendPhrase', () => {
  it('joins a phrase to the value with one space', () => {
    expect(appendPhrase('', 'hello')).toBe('hello');
    expect(appendPhrase('hi', 'there')).toBe('hi there');
    expect(appendPhrase('hi ', 'there')).toBe('hi there');
  });
});
