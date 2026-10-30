/**
 * What was said to a screen reader, and when it may be said again.
 *
 * Three rules make this a module instead of a `div` with `aria-live` on it, and
 * every one of them was learned by a library that shipped without it.
 *
 * The first is ARIA 1.2 §6.4: a live region has to be in the accessibility tree
 * *before* the message enters it. A region created and filled in the same task
 * is silent, which is why the regions are built when the announcer is and the
 * first message is written a task later.
 *
 * The second is that a region whose text does not change is not re-announced.
 * "3 results" after "3 results" is silence, so each region holds two children
 * and alternates between them — React Aria's design, for React Aria's reason.
 *
 * The third is neither React Aria's nor the Angular CDK's: both write straight
 * into the node, so a component that announces a filter change and a result
 * count in one update loses the first. Here the second waits `ANNOUNCE_GAP` and
 * both are heard.
 *
 * It is not a toast API — `docs/component-features.md` §3 — and the message is
 * written with `textContent`, so a hostile or translated string is text and
 * there is no HTML path into the region.
 */

export type Politeness = 'polite' | 'assertive';

/** Marks the one container per document that holds both regions. */
export const ANNOUNCER_ATTRIBUTE = 'data-slotted-live-announcer';

/** The least time between two announcements of one politeness level. */
export const ANNOUNCE_GAP = 150;

/**
 * How long a message stays readable. Past it, a screen reader moving through
 * the page reads a message about something that already happened.
 */
export const DEFAULT_CLEAR_AFTER = 7000;

export interface AnnounceOptions {
  politeness?: Politeness;
  /** Milliseconds until the region is emptied. `0` keeps the message. */
  clearAfter?: number;
  /** Says a message identical to the previous one of its level. */
  repeat?: boolean;
}

export interface LiveAnnouncerHandle {
  announce: (message: string, options?: AnnounceOptions) => void;
  /** Empties one level, or both, and drops whatever was still queued. */
  clear: (politeness?: Politeness) => void;
  destroy: () => void;
}

interface Channel {
  region: HTMLElement;
  nodes: [HTMLElement, HTMLElement];
  /** Which of the two nodes holds the current message. */
  index: number;
  queue: { message: string; clearAfter: number }[];
  /** The last message put in the queue, which is what a repeat is compared against. */
  last: string;
  flushing: ReturnType<typeof setTimeout> | null;
  clearing: ReturnType<typeof setTimeout> | null;
}

/** Per document: two announcers make two regions, and every message is read twice. */
const shared = new WeakMap<Document, LiveAnnouncerHandle>();

/**
 * The same rule `visually-hidden` writes in CSS, written inline because a
 * module cannot depend on a stylesheet the application may not have loaded.
 */
function hide(element: HTMLElement) {
  const style = element.style;
  style.position = 'absolute';
  style.width = '1px';
  style.height = '1px';
  style.margin = '-1px';
  style.padding = '0';
  style.border = '0';
  style.overflow = 'hidden';
  style.clipPath = 'inset(50%)';
  style.whiteSpace = 'nowrap';
}

function buildChannel(doc: Document, politeness: Politeness): Channel {
  const region = doc.createElement('div');
  region.setAttribute('aria-live', politeness);
  /* Atomic, so the message is read as one sentence rather than as a diff. */
  region.setAttribute('aria-atomic', 'true');

  const first = doc.createElement('div');
  const second = doc.createElement('div');
  region.append(first, second);

  return {
    region,
    nodes: [first, second],
    /* The write flips first, so the second node holding nothing puts the first message in the first. */
    index: 1,
    queue: [],
    last: '',
    flushing: null,
    clearing: null,
  };
}

export function createLiveAnnouncer(doc?: Document): LiveAnnouncerHandle {
  const target = doc ?? (globalThis as { document?: Document }).document;
  if (!target?.body) {
    return { announce: () => {}, clear: () => {}, destroy: () => {} };
  }

  const container = target.createElement('div');
  container.setAttribute(ANNOUNCER_ATTRIBUTE, '');
  hide(container);

  const channels: Record<Politeness, Channel> = {
    polite: buildChannel(target, 'polite'),
    assertive: buildChannel(target, 'assertive'),
  };
  container.append(channels.polite.region, channels.assertive.region);
  target.body.append(container);

  const lastSpokenAt: Record<Politeness, number> = {
    polite: Number.NEGATIVE_INFINITY,
    assertive: Number.NEGATIVE_INFINITY,
  };
  let destroyed = false;

  function write(channel: Channel, politeness: Politeness) {
    const next = channel.queue.shift();
    if (!next) return;

    /* The other node is emptied, or an atomic region reads both. */
    channel.index = channel.index === 0 ? 1 : 0;
    const [spoken, silent] =
      channel.index === 0 ? channel.nodes : [channel.nodes[1], channel.nodes[0]];
    spoken.textContent = next.message;
    silent.textContent = '';
    lastSpokenAt[politeness] = Date.now();

    if (channel.clearing !== null) clearTimeout(channel.clearing);
    channel.clearing = null;
    if (next.clearAfter > 0) {
      channel.clearing = setTimeout(() => empty(channel), next.clearAfter);
    }

    schedule(channel, politeness);
  }

  function schedule(channel: Channel, politeness: Politeness) {
    if (channel.flushing !== null || channel.queue.length === 0) return;
    const waited = Date.now() - lastSpokenAt[politeness];
    const delay = Number.isFinite(waited) ? Math.max(0, ANNOUNCE_GAP - waited) : 0;
    channel.flushing = setTimeout(() => {
      channel.flushing = null;
      write(channel, politeness);
    }, delay);
  }

  function empty(channel: Channel) {
    for (const node of channel.nodes) node.textContent = '';
    if (channel.clearing !== null) clearTimeout(channel.clearing);
    channel.clearing = null;
  }

  return {
    announce(message, options = {}) {
      if (destroyed) return;
      const text = message.trim();
      if (text === '') return;

      const politeness = options.politeness ?? 'polite';
      const channel = channels[politeness];
      /* Compared against the last message queued, not the last one heard. */
      if (options.repeat !== true && text === channel.last) return;

      channel.last = text;
      channel.queue.push({ message: text, clearAfter: options.clearAfter ?? DEFAULT_CLEAR_AFTER });
      schedule(channel, politeness);
    },
    clear(politeness) {
      const levels: Politeness[] = politeness ? [politeness] : ['polite', 'assertive'];
      for (const level of levels) {
        const channel = channels[level];
        channel.queue.length = 0;
        channel.last = '';
        if (channel.flushing !== null) clearTimeout(channel.flushing);
        channel.flushing = null;
        empty(channel);
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const channel of Object.values(channels)) {
        channel.queue.length = 0;
        if (channel.flushing !== null) clearTimeout(channel.flushing);
        if (channel.clearing !== null) clearTimeout(channel.clearing);
      }
      container.remove();
    },
  };
}

/** The shared announcer of a document, built the first time it is asked for. */
export function getLiveAnnouncer(doc?: Document): LiveAnnouncerHandle {
  const target = doc ?? (globalThis as { document?: Document }).document;
  if (!target) return { announce: () => {}, clear: () => {}, destroy: () => {} };

  const existing = shared.get(target);
  if (existing) return existing;

  const announcer = createLiveAnnouncer(target);
  const wrapped: LiveAnnouncerHandle = {
    announce: announcer.announce,
    clear: announcer.clear,
    destroy() {
      announcer.destroy();
      if (shared.get(target) === wrapped) shared.delete(target);
    },
  };
  shared.set(target, wrapped);
  return wrapped;
}
