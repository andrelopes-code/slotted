/**
 * Where the focus of a scroll region came from: the keyboard or the pointer.
 *
 * A region that scrolls carries `tabindex="0"`, so a keyboard user can reach
 * it and scroll it (WCAG 2.1.1). The same attribute makes a click on any text
 * inside it focus the region, and the browser's `:focus-visible` heuristic
 * then matches on the next key pressed, a lone Shift included (CSS Selectors 4
 * §9.4): the ring is drawn around the whole region after a click. WCAG 2.4.7
 * asks for the ring when the region is reached by keyboard.
 *
 * The region carries `data-focus-origin` while it is focused: `keyboard` when
 * the focus arrived after a key press, or with no input yet; `pointer` when
 * it arrived after a pointer press. A navigation key pressed on the region
 * (arrows, Page Up, Page Down, Home, End, Space) turns `pointer` into
 * `keyboard`, because the reader has started to scroll by keyboard; a modifier
 * alone turns nothing. Blur removes the attribute. A stylesheet draws the ring
 * for `:focus-visible[data-focus-origin='keyboard']`.
 *
 * Controls — buttons, inputs, tabs — keep plain `:focus-visible`: focus is
 * their whole purpose, and the heuristic is right for them.
 */

export type FocusOrigin = 'keyboard' | 'pointer';

export const FOCUS_ORIGIN_ATTRIBUTE = 'data-focus-origin';

export interface FocusOriginHandle {
  /** The origin of the current focus, or `null` while the region is not focused. */
  origin: () => FocusOrigin | null;
  /** Removes the listeners and the attribute. */
  destroy: () => void;
}

const MODIFIERS = new Set(['Alt', 'AltGraph', 'CapsLock', 'Control', 'Fn', 'Meta', 'Shift']);
const NAVIGATION = new Set([
  ' ',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
]);

interface Modality {
  last: FocusOrigin;
  users: number;
  release: () => void;
}

/** One pair of listeners per document, shared by every region in it. */
const modalities = new WeakMap<Document, Modality>();

function track(doc: Document): Modality {
  const existing = modalities.get(doc);
  if (existing !== undefined) {
    existing.users += 1;
    return existing;
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!MODIFIERS.has(event.key)) modality.last = 'keyboard';
  };
  const onPointerDown = () => {
    modality.last = 'pointer';
  };
  /* Capture, so the input is recorded before the focus it causes moves. */
  doc.addEventListener('keydown', onKeyDown, true);
  doc.addEventListener('pointerdown', onPointerDown, true);
  doc.addEventListener('mousedown', onPointerDown, true);

  const modality: Modality = {
    last: 'keyboard',
    users: 1,
    release: () => {
      doc.removeEventListener('keydown', onKeyDown, true);
      doc.removeEventListener('pointerdown', onPointerDown, true);
      doc.removeEventListener('mousedown', onPointerDown, true);
      modalities.delete(doc);
    },
  };
  modalities.set(doc, modality);
  return modality;
}

export function createFocusOrigin(element: HTMLElement): FocusOriginHandle {
  const modality = track(element.ownerDocument);
  let current: FocusOrigin | null = null;

  const write = (origin: FocusOrigin | null) => {
    current = origin;
    if (origin === null) element.removeAttribute(FOCUS_ORIGIN_ATTRIBUTE);
    else element.setAttribute(FOCUS_ORIGIN_ATTRIBUTE, origin);
  };

  const onFocus = () => write(modality.last);
  const onBlur = () => write(null);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target === element && current === 'pointer' && NAVIGATION.has(event.key)) {
      write('keyboard');
    }
  };

  element.addEventListener('focus', onFocus);
  element.addEventListener('blur', onBlur);
  element.addEventListener('keydown', onKeyDown);
  if (element.ownerDocument.activeElement === element) onFocus();

  return {
    origin: () => current,
    destroy: () => {
      element.removeEventListener('focus', onFocus);
      element.removeEventListener('blur', onBlur);
      element.removeEventListener('keydown', onKeyDown);
      write(null);
      modality.users -= 1;
      if (modality.users === 0) modality.release();
    },
  };
}
