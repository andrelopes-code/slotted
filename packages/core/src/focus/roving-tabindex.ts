export type Orientation = 'horizontal' | 'vertical';

export interface RovingTabindexOptions {
  /** Selects the items the tab stop moves between, within the container. */
  itemSelector: string;
  /** Wrap past the ends. Defaults to true. */
  loop?: boolean;
  /** Reports movement. The caller decides what movement means. */
  onMove?: (index: number, item: HTMLElement) => void;
  /** Read at the time of each key, so a consumer may change it at runtime. */
  orientation?: () => Orientation;
}

export interface RovingTabindexHandle {
  /** Removes the listener and leaves every item as it stands. */
  destroy: () => void;
  /** Re-reads the item list after one is added or removed. */
  refresh: () => void;
  /** Moves the tab stop without moving focus. */
  setActive: (index: number) => void;
}

const HORIZONTAL_KEYS = { next: 'ArrowRight', previous: 'ArrowLeft' } as const;
const VERTICAL_KEYS = { next: 'ArrowDown', previous: 'ArrowUp' } as const;

function isDisabled(item: HTMLElement) {
  return item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true';
}

export function createRovingTabindex(
  container: HTMLElement,
  options: RovingTabindexOptions,
): RovingTabindexHandle {
  const loop = options.loop ?? true;
  const orientation = options.orientation ?? (() => 'horizontal' as const);

  let items: HTMLElement[] = [];
  let activeIndex = 0;

  function readItems() {
    items = [...container.querySelectorAll<HTMLElement>(options.itemSelector)];
  }

  function applyTabindex() {
    for (const [index, item] of items.entries()) {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
    }
  }

  function firstEnabled() {
    const index = items.findIndex((item) => !isDisabled(item));
    return index === -1 ? 0 : index;
  }

  function step(from: number, delta: number) {
    const count = items.length;
    if (count === 0) return -1;

    let index = from;
    for (let taken = 0; taken < count; taken += 1) {
      index += delta;
      if (index < 0 || index >= count) {
        if (!loop) return -1;
        index = (index + count) % count;
      }
      if (!isDisabled(items[index]!)) return index;
    }
    return -1;
  }

  function edge(delta: 1 | -1) {
    const from = delta === 1 ? -1 : items.length;
    let index = from;
    for (let taken = 0; taken < items.length; taken += 1) {
      index += delta;
      if (index < 0 || index >= items.length) return -1;
      if (!isDisabled(items[index]!)) return index;
    }
    return -1;
  }

  function moveTo(index: number) {
    if (index === -1 || index === activeIndex) return;
    activeIndex = index;
    applyTabindex();
    const item = items[index]!;
    item.focus();
    options.onMove?.(index, item);
  }

  function handleKeydown(event: KeyboardEvent) {
    readItems();
    const keys = orientation() === 'vertical' ? VERTICAL_KEYS : HORIZONTAL_KEYS;
    const from = items.findIndex((item) => item.contains(event.target as Node));
    const origin = from === -1 ? activeIndex : from;

    if (event.key === keys.next) moveTo(step(origin, 1));
    else if (event.key === keys.previous) moveTo(step(origin, -1));
    else if (event.key === 'Home') moveTo(edge(1));
    else if (event.key === 'End') moveTo(edge(-1));
    else return;

    event.preventDefault();
  }

  readItems();
  activeIndex = firstEnabled();
  applyTabindex();
  container.addEventListener('keydown', handleKeydown);

  return {
    destroy: () => container.removeEventListener('keydown', handleKeydown),
    refresh: () => {
      readItems();
      if (activeIndex >= items.length) activeIndex = firstEnabled();
      applyTabindex();
    },
    setActive: (index) => {
      readItems();
      if (index < 0 || index >= items.length) return;
      activeIndex = index;
      applyTabindex();
    },
  };
}
