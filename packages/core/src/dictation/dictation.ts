/**
 * Dictation through the platform's speech recognition (the Web Speech API's
 * `SpeechRecognition`, prefixed `webkitSpeechRecognition` in Chrome and
 * Safari). The engine listens in one language until it ends or is stopped,
 * and hands on each final phrase; interim guesses are not written. Nothing
 * here touches a framework: the bindings write the phrase into their value.
 */

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string } | undefined;
}

interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResult>;
}

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => Recognition;

export interface DictationOptions {
  /** A BCP 47 tag. Defaults to the engine's own, which is the document's language. */
  readonly lang?: string | undefined;
  readonly onPhrase: (phrase: string) => void;
  readonly onListeningChange: (listening: boolean) => void;
}

export interface Dictation {
  readonly listening: boolean;
  start(): void;
  stop(): void;
  /** Ends a session without handing on what it heard. */
  destroy(): void;
}

/** The engine's constructor in `view`, or `null` where the platform has none. */
function engine(view: object): RecognitionConstructor | null {
  const scope = view as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** Whether the platform has a recognition engine. */
export function dictationSupported(view: object = globalThis): boolean {
  return engine(view) !== null;
}

/** A dictation session, or `null` where the platform has no recognition engine. */
export function createDictation(
  options: DictationOptions,
  view: object = globalThis,
): Dictation | null {
  const Engine = engine(view);
  if (Engine === null) return null;
  let current: Recognition | null = null;

  const settle = () => {
    if (current === null) return;
    current = null;
    options.onListeningChange(false);
  };

  return {
    get listening() {
      return current !== null;
    },
    start() {
      if (current !== null) return;
      const recognition = new Engine();
      if (options.lang) recognition.lang = options.lang;
      recognition.continuous = true;
      recognition.interimResults = false;
      /* The final phrases of one event are handed on together, so a binding writes them in one change. */
      recognition.onresult = (event) => {
        const phrases: string[] = [];
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const phrase = result?.isFinal ? result[0]?.transcript.trim() : '';
          if (phrase) phrases.push(phrase);
        }
        if (phrases.length > 0) options.onPhrase(phrases.join(' '));
      };
      recognition.onend = settle;
      recognition.onerror = settle;
      current = recognition;
      options.onListeningChange(true);
      recognition.start();
    },
    stop() {
      const recognition = current;
      recognition?.stop();
      settle();
    },
    destroy() {
      const recognition = current;
      if (recognition === null) return;
      recognition.onresult = null;
      recognition.abort();
      settle();
    },
  };
}

/** The value with a phrase written at its end, one space between them. */
export function appendPhrase(value: string, phrase: string): string {
  return value === '' || /\s$/.test(value) ? `${value}${phrase}` : `${value} ${phrase}`;
}
