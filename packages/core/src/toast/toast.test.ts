import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createToastStore } from './toast';
import type { ToastMessage, ToastPriority, ToastReason } from './toast';

interface Payload {
  title: string;
}

/** Every announcement the store made, in order, with the level it asked for. */
function recorder() {
  const said: { message: string; politeness: ToastPriority }[] = [];
  return {
    said,
    announce: (message: string, politeness: ToastPriority) => said.push({ message, politeness }),
  };
}

function store(options: Parameters<typeof createToastStore<Payload>>[0] = {}) {
  const spoken = recorder();
  const reasons: ToastReason[] = [];
  const handle = createToastStore<Payload>({
    announce: spoken.announce,
    onRequest: (request) => reasons.push(request.reason as ToastReason),
    ...options,
  });
  return { handle, spoken, reasons };
}

const titles = (list: readonly ToastMessage<Payload>[]) =>
  list.map((message) => message.data.title);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the queue', () => {
  it('puts the newest message first, which is where the reader is looking', () => {
    const { handle } = store();
    handle.show({ data: { title: 'first' } });
    handle.show({ data: { title: 'second' } });

    expect(titles(handle.snapshot.visible)).toEqual(['second', 'first']);
  });

  /**
   * The deduplication policy `docs/component-features.md` §14 asks for by name.
   * An upload that reaches a hundred per cent is the same message, not a second
   * one, and it must not move down the pile while it says so.
   */
  it('updates the message that already carries an id instead of adding a second', () => {
    const { handle } = store();
    handle.show({ id: 'upload', data: { title: 'Uploading' } });
    handle.show({ data: { title: 'other' } });
    handle.show({ id: 'upload', data: { title: 'Uploaded' } });

    expect(titles(handle.snapshot.visible)).toEqual(['other', 'Uploaded']);
    expect(handle.snapshot.visible[1]?.revision).toBe(2);
  });

  /**
   * Ark's answer rather than Base UI's: what arrives when the screen is full
   * waits, and what is already on the screen stays. A reader half way through
   * reading one message does not lose it to a message that arrived after.
   */
  it('shows the limit and keeps what arrives after it waiting', () => {
    const { handle } = store({ limit: 2 });
    handle.show({ data: { title: 'a' } });
    handle.show({ data: { title: 'b' } });
    handle.show({ data: { title: 'c' } });

    expect(titles(handle.snapshot.visible)).toEqual(['b', 'a']);
    expect(titles(handle.snapshot.queued)).toEqual(['c']);
  });
});

describe('the clock', () => {
  /**
   * Ark times the wait as well, so a message can be created, queue behind
   * others, and be shown after the thing it is about has changed. Here the five
   * seconds are five seconds of being on screen.
   */
  it('starts a message timer when it becomes visible, not when it is created', () => {
    const { handle } = store({ limit: 1, duration: 1000 });
    handle.show({ id: 'front', data: { title: 'front' } });
    handle.show({ id: 'behind', data: { title: 'behind' } });

    expect(handle.remaining('behind')).toBe(0);

    handle.dismiss('front');
    handle.remove('front');
    expect(handle.remaining('behind')).toBe(1000);

    vi.advanceTimersByTime(1000);
    expect(handle.snapshot.visible[0]?.status).toBe('closing');
  });

  it('holds every clock while the pointer is over the region, and resumes on what was left', () => {
    const { handle } = store({ duration: 1000 });
    handle.show({ id: 'one', data: { title: 'one' } });

    vi.advanceTimersByTime(400);
    handle.setInteracting(true);
    expect(handle.snapshot.paused).toBe(true);
    expect(handle.remaining('one')).toBe(600);

    vi.advanceTimersByTime(5000);
    expect(handle.snapshot.visible[0]?.status).toBe('visible');

    handle.setInteracting(false);
    expect(handle.remaining('one')).toBe(600);
    vi.advanceTimersByTime(600);
    expect(handle.snapshot.visible[0]?.status).toBe('closing');
  });

  it('leaves a message that carries an action on screen until it is answered', () => {
    const { handle } = store({ duration: 1000 });
    handle.show({ id: 'undo', action: true, data: { title: 'Message archived' } });

    expect(handle.snapshot.visible[0]?.duration).toBe(0);
    vi.advanceTimersByTime(60000);
    expect(handle.snapshot.visible[0]?.status).toBe('visible');
  });

  it('leaves a message waiting on a promise on screen, and states an explicit duration anyway', () => {
    const { handle } = store({ duration: 1000 });
    handle.show({ id: 'a', loading: true, data: { title: 'Publishing' } });
    handle.show({ id: 'b', action: true, duration: 200, data: { title: 'Archived' } });

    expect(handle.snapshot.visible.find((m) => m.id === 'a')?.duration).toBe(0);
    expect(handle.snapshot.visible.find((m) => m.id === 'b')?.duration).toBe(200);
  });

  it('names the expiry with a word that is not the word for a dismissal', () => {
    const { handle, reasons } = store({ duration: 100 });
    handle.show({ id: 'one', data: { title: 'one' } });
    vi.advanceTimersByTime(100);

    expect(reasons).toEqual(['programmatic', 'timeout']);

    handle.remove('one');
    handle.show({ id: 'two', data: { title: 'two' } });
    handle.dismiss('two', 'dismiss');
    expect(reasons.at(-1)).toBe('dismiss');
  });
});

describe('the announcement', () => {
  it('says a message once, at the level it declares', () => {
    const { handle, spoken } = store();
    handle.show({ announcement: 'Draft saved', data: { title: 'Draft saved' } });
    handle.show({ announcement: 'Upload failed', priority: 'assertive', data: { title: 'x' } });

    expect(spoken.said).toEqual([
      { message: 'Draft saved', politeness: 'polite' },
      { message: 'Upload failed', politeness: 'assertive' },
    ]);
  });

  it('says nothing for a message that carries no words for a reader', () => {
    const { handle, spoken } = store();
    handle.show({ data: { title: 'drawn only' } });

    expect(spoken.said).toEqual([]);
  });

  /**
   * A reader coming back after ten minutes meets everything at once. The screen
   * is there to be read; four sentences about it are not.
   */
  it('announces only the newest message when a hidden tab comes back', () => {
    let hidden = false;
    const listeners = new Set<() => void>();
    const doc = {
      get hidden() {
        return hidden;
      },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    } as unknown as Document;

    const { handle, spoken } = store({ document: doc, duration: 0 });
    hidden = true;
    for (const listener of listeners) listener();

    handle.show({ announcement: 'one', data: { title: 'one' } });
    handle.show({ announcement: 'two', data: { title: 'two' } });
    expect(spoken.said).toEqual([]);

    hidden = false;
    for (const listener of listeners) listener();

    expect(spoken.said).toEqual([{ message: 'two', politeness: 'polite' }]);
  });
});

describe('who owns the queue', () => {
  it('moves nothing when the request is refused', () => {
    const handle = createToastStore<Payload>({
      announce: () => {},
      onRequest: (request) => request.cancel(),
    });
    handle.show({ data: { title: 'refused' } });

    expect(handle.snapshot.visible).toEqual([]);
  });

  /**
   * Controlled: the consumer holds the array. The store asks and waits, which
   * is what `docs/state-and-events.md` requires of every mutable value.
   */
  it('never moves its own queue while the consumer owns it', () => {
    let owned: readonly ToastMessage<Payload>[] = [];
    const handle = createToastStore<Payload>({
      announce: () => {},
      toasts: owned,
      onRequest: (request) => {
        owned = request.value;
      },
    });

    handle.show({ id: 'one', data: { title: 'one' } });
    expect(handle.snapshot.visible).toEqual([]);
    expect(titles(owned)).toEqual(['one']);

    handle.sync(owned);
    expect(titles(handle.snapshot.visible)).toEqual(['one']);

    handle.dismiss('one', 'dismiss');
    expect(titles(owned)).toEqual([]);
    expect(titles(handle.snapshot.visible)).toEqual(['one']);
  });
});

describe('a message that follows a promise', () => {
  it('updates the message it started with rather than showing a second one', async () => {
    const { handle, spoken } = store({ duration: 100 });
    const settled = handle.promise(Promise.resolve('done'), {
      loading: { id: 'job', announcement: 'Publishing', data: { title: 'Publishing' } },
      success: (value) => ({ announcement: `Published ${value}`, data: { title: 'Published' } }),
      error: { announcement: 'Failed', data: { title: 'Failed' } },
    });

    expect(handle.snapshot.visible[0]?.loading).toBe(true);
    expect(handle.snapshot.visible[0]?.duration).toBe(0);

    await settled;

    expect(handle.snapshot.visible).toHaveLength(1);
    expect(handle.snapshot.visible[0]?.data.title).toBe('Published');
    expect(handle.snapshot.visible[0]?.duration).toBe(100);
    expect(spoken.said.map((entry) => entry.message)).toEqual(['Publishing', 'Published done']);
  });

  it('keeps the rejection the consumer has to handle', async () => {
    const { handle } = store();
    const failure = new Error('no');
    const settled = handle.promise(Promise.reject(failure), {
      loading: { id: 'job', data: { title: 'Publishing' } },
      success: { data: { title: 'Published' } },
      error: (cause) => ({ data: { title: String(cause) } }),
    });

    await expect(settled).rejects.toThrow('no');
    expect(handle.snapshot.visible[0]?.data.title).toBe('Error: no');
  });
});

describe('clearing', () => {
  it('asks for every message at once, with one reason', () => {
    const { handle, reasons } = store();
    handle.show({ data: { title: 'a' } });
    handle.show({ data: { title: 'b' } });
    handle.clear();

    expect(reasons.at(-1)).toBe('clear');
    expect(handle.snapshot.visible.every((message) => message.status === 'closing')).toBe(true);
  });

  it('stops listening and stops every clock when it is destroyed', () => {
    const { handle } = store({ duration: 100 });
    handle.show({ id: 'one', data: { title: 'one' } });
    handle.destroy();

    vi.advanceTimersByTime(1000);
    expect(handle.snapshot.visible[0]?.status).toBe('visible');
  });
});
