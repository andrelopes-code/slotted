/**
 * The one state model every family with mutable state uses.
 *
 * A family holds state in one of two modes, and the difference is not a
 * detail a binding may improvise: **controlled**, where the consumer owns the
 * value and the component only asks for a new one, and **uncontrolled**, where
 * the component owns it and starts from a value read once. A component that
 * moves its own state while the consumer believes it owns it produces the bug
 * that has no local explanation.
 *
 * Every move is a request rather than an announcement. A request carries the
 * value, the value it replaces, the reason it happened, and the event it came
 * from, and it can be cancelled before anything commits. A boolean cannot say
 * whether a menu closed because Escape was pressed or because focus left, and
 * a consumer that has to guess writes the wrong handler.
 *
 * Nothing here touches the DOM, React or Angular: `source` is opaque on
 * purpose, because the two frameworks do not share an event type.
 */

export type ChangeReason =
  | 'pointer'
  | 'keyboard'
  | 'clear'
  | 'remove'
  | 'select'
  | 'dismiss'
  | 'escape'
  | 'outsidePress'
  | 'blur'
  | 'submit'
  | 'programmatic'
  /**
   * The time the component was given ran out. Not `dismiss`, which is the
   * reader pressing the control, and not `programmatic`, which is the
   * application asking. `toast` is the first family with a timer of its own.
   */
  | 'timeout'
  /**
   * The reader scrolled past the thing and it answered. Not `pointer`: a wheel,
   * a trackpad, a scrollbar drag and a touch fling are one gesture and none of
   * them is a press on the control. Not `programmatic`: the application asked
   * for nothing. `page-header` is the first family whose state a scroll moves.
   */
  | 'scroll'
  /**
   * The space the thing was given changed and it answered. Not `pointer`:
   * dragging a window's corner, rotating a phone and zooming to 400% are three
   * gestures and none of them is a press on the control. Not `programmatic`:
   * the application asked for nothing. `app-shell` is the first family whose
   * state a width moves, and the reason is what lets a product persist the
   * reader's own choice and ignore the one the layout forced.
   */
  | 'resize'
  /**
   * The platform's own way back — a phone's gesture, a browser's button —
   * used while a modal layer stood over the page, and answered by the layer
   * rather than by the history. Not `escape`: a touch screen has no such key.
   * Not `dismiss`: the reader pressed nothing of the layer's own.
   */
  | 'back'
  /**
   * The reader spoke and the platform's speech recognition wrote the words.
   * Not `keyboard`: no key was pressed. Not `programmatic`: the application
   * asked for nothing. `prompt-composer` is the first family that takes speech.
   */
  | 'dictation';

export interface ChangeRequest<T> {
  readonly value: T;
  readonly previous: T;
  readonly reason: ChangeReason;
  /** The originating event, when one exists. Opaque: the frameworks disagree. */
  readonly source?: unknown;
  readonly cancelled: boolean;
  /** Refuses the request. Nothing commits and no consumer is notified. */
  cancel(): void;
}

export interface ControllableOptions<T> {
  /**
   * The consumer's value. Passing anything but `undefined` puts the state in
   * controlled mode for the lifetime of the component.
   */
  controlled?: T | undefined;
  /** The value an uncontrolled component starts from, read once. */
  initial: T;
  /** Called before a request commits, and able to cancel it. */
  onRequest?: (request: ChangeRequest<T>) => void;
  /** Value equality. Defaults to `Object.is`, which suits primitives. */
  equals?: (a: T, b: T) => boolean;
}

export interface Controllable<T> {
  readonly value: T;
  readonly controlled: boolean;
  /**
   * Asks to move to `next`. Returns whether the state actually moved, which is
   * true only in uncontrolled mode with the request neither redundant nor
   * cancelled. A controlled component reports and waits for `sync`.
   */
  request(next: T, reason: ChangeReason, source?: unknown): boolean;
  /** The consumer's new value, in controlled mode. Ignored when uncontrolled. */
  sync(controlled: T | undefined): void;
}

export function isControlled<T>(value: T | undefined): boolean {
  return value !== undefined;
}

export function createControllable<T>({
  controlled,
  initial,
  onRequest,
  equals = Object.is,
}: ControllableOptions<T>): Controllable<T> {
  /**
   * The mode is decided once. A component that switched modes mid-life would
   * change who owns its state without telling either side.
   */
  const isControlledMode = isControlled(controlled);
  let current = isControlledMode ? (controlled as T) : initial;

  return {
    get value() {
      return current;
    },
    get controlled() {
      return isControlledMode;
    },
    request(next, reason, source) {
      if (equals(next, current)) return false;

      let cancelled = false;
      const request: ChangeRequest<T> = {
        value: next,
        previous: current,
        reason,
        source,
        get cancelled() {
          return cancelled;
        },
        cancel() {
          cancelled = true;
        },
      };

      onRequest?.(request);
      if (cancelled) return false;
      if (isControlledMode) return false;

      current = next;
      return true;
    },
    sync(next) {
      if (!isControlledMode || next === undefined) return;
      current = next;
    },
  };
}
