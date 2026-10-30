import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ANNOUNCER_ATTRIBUTE,
  ANNOUNCE_GAP,
  DEFAULT_CLEAR_AFTER,
  createLiveAnnouncer,
  getLiveAnnouncer,
} from './live-announcer';

function region(politeness: 'polite' | 'assertive') {
  return document.querySelector(`[${ANNOUNCER_ATTRIBUTE}] [aria-live="${politeness}"]`);
}

function spoken(politeness: 'polite' | 'assertive' = 'polite') {
  return [...(region(politeness)?.children ?? [])].map((child) => child.textContent);
}

function said(politeness: 'polite' | 'assertive' = 'polite') {
  return spoken(politeness)
    .filter((text) => text !== '')
    .join('');
}

describe('createLiveAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * ARIA 1.2 §6.4 requires the region to be in the accessibility tree before
   * the message enters it. A region created and filled in one task is silent,
   * and that single rule is what makes this a module rather than a `div`.
   */
  it('puts both regions in the document before anything is announced', () => {
    const announcer = createLiveAnnouncer();

    expect(region('polite')?.getAttribute('aria-live')).toBe('polite');
    expect(region('assertive')?.getAttribute('aria-live')).toBe('assertive');
    expect(region('polite')?.getAttribute('aria-atomic')).toBe('true');
    announcer.destroy();
  });

  it('leaves the layout alone', () => {
    const announcer = createLiveAnnouncer();
    const container = document.querySelector(`[${ANNOUNCER_ATTRIBUTE}]`) as HTMLElement;

    expect(container.style.position).toBe('absolute');
    expect(container.style.width).toBe('1px');
    expect(container.style.overflow).toBe('hidden');
    announcer.destroy();
  });

  it('says a message politely by default', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('3 results');
    vi.advanceTimersByTime(ANNOUNCE_GAP);

    expect(said('polite')).toBe('3 results');
    expect(said('assertive')).toBe('');
    announcer.destroy();
  });

  it('says an urgent message in the assertive region', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('connection lost', { politeness: 'assertive' });
    vi.advanceTimersByTime(ANNOUNCE_GAP);

    expect(said('assertive')).toBe('connection lost');
    announcer.destroy();
  });

  it('ignores a message that is nothing but space', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('   ');
    vi.advanceTimersByTime(ANNOUNCE_GAP);

    expect(said()).toBe('');
    announcer.destroy();
  });

  /**
   * A region whose text does not change is not re-announced, so the same text
   * goes into the other of two children. React Aria's reason for the same
   * design.
   */
  it('alternates the two nodes so an identical message is still a change', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('3 results');
    vi.advanceTimersByTime(ANNOUNCE_GAP);
    expect(spoken()).toEqual(['3 results', '']);

    announcer.announce('3 results', { repeat: true });
    vi.advanceTimersByTime(ANNOUNCE_GAP);
    expect(spoken()).toEqual(['', '3 results']);
    announcer.destroy();
  });

  it('drops a message identical to the one before it', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('saved');
    vi.advanceTimersByTime(ANNOUNCE_GAP);
    announcer.announce('saved');
    vi.advanceTimersByTime(ANNOUNCE_GAP);

    expect(spoken()).toEqual(['saved', '']);
    announcer.destroy();
  });

  /** "5", then "6", then "5" is three announcements, not two. */
  it('says a message again once something else was said between', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('5');
    announcer.announce('6');
    announcer.announce('5');
    vi.advanceTimersByTime(ANNOUNCE_GAP * 3);

    expect(said()).toBe('5');
    announcer.destroy();
  });

  /**
   * The capability neither React Aria nor the Angular CDK has: both write
   * straight into the node, so a component announcing a filter change and a
   * result count in one update loses the first.
   */
  it('says both messages sent in one task, a gap apart', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('filter applied');
    announcer.announce('3 results');

    vi.advanceTimersByTime(0);
    expect(said()).toBe('filter applied');

    vi.advanceTimersByTime(ANNOUNCE_GAP);
    expect(said()).toBe('3 results');
    announcer.destroy();
  });

  it('keeps the two politeness levels on their own channels', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('3 results');
    announcer.announce('connection lost', { politeness: 'assertive' });
    vi.advanceTimersByTime(0);

    expect(said('polite')).toBe('3 results');
    expect(said('assertive')).toBe('connection lost');
    announcer.destroy();
  });

  describe('clearing', () => {
    it('empties the region after the default delay', () => {
      const announcer = createLiveAnnouncer();

      announcer.announce('saved');
      vi.advanceTimersByTime(ANNOUNCE_GAP);
      expect(said()).toBe('saved');

      vi.advanceTimersByTime(DEFAULT_CLEAR_AFTER);
      expect(said()).toBe('');
      announcer.destroy();
    });

    it('holds the message where the caller asked it to', () => {
      const announcer = createLiveAnnouncer();

      announcer.announce('saved', { clearAfter: 0 });
      vi.advanceTimersByTime(ANNOUNCE_GAP + DEFAULT_CLEAR_AFTER * 2);

      expect(said()).toBe('saved');
      announcer.destroy();
    });

    it('retracts a message on demand, and drops what was still queued', () => {
      const announcer = createLiveAnnouncer();

      announcer.announce('first');
      announcer.announce('second');
      vi.advanceTimersByTime(0);
      announcer.clear();

      expect(said()).toBe('');
      vi.advanceTimersByTime(ANNOUNCE_GAP * 3);
      expect(said()).toBe('');
      announcer.destroy();
    });

    it('clears one level without touching the other', () => {
      const announcer = createLiveAnnouncer();

      announcer.announce('polite one');
      announcer.announce('urgent one', { politeness: 'assertive' });
      vi.advanceTimersByTime(0);

      announcer.clear('polite');
      expect(said('polite')).toBe('');
      expect(said('assertive')).toBe('urgent one');
      announcer.destroy();
    });
  });

  /** A message is text. There is no interpolation and no HTML path into the region. */
  it('writes a hostile string as the string it is', () => {
    const announcer = createLiveAnnouncer();

    announcer.announce('<img src=x onerror="alert(1)">');
    vi.advanceTimersByTime(ANNOUNCE_GAP);

    expect(region('polite')?.querySelector('img')).toBe(null);
    expect(said()).toBe('<img src=x onerror="alert(1)">');
    announcer.destroy();
  });

  it('takes its regions with it when it is destroyed', () => {
    const announcer = createLiveAnnouncer();
    announcer.announce('saved');

    announcer.destroy();
    vi.advanceTimersByTime(ANNOUNCE_GAP * 4);

    expect(document.querySelector(`[${ANNOUNCER_ATTRIBUTE}]`)).toBe(null);
  });
});

describe('getLiveAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    getLiveAnnouncer().destroy();
    vi.useRealTimers();
  });

  /** Two announcers make two regions, and a screen reader reads everything twice. */
  it('is one announcer per document', () => {
    const first = getLiveAnnouncer();
    const second = getLiveAnnouncer();

    expect(second).toBe(first);
    expect(document.querySelectorAll(`[${ANNOUNCER_ATTRIBUTE}]`)).toHaveLength(1);
  });

  it('builds a new one after the shared one is destroyed', () => {
    const first = getLiveAnnouncer();
    first.destroy();

    const second = getLiveAnnouncer();
    expect(second).not.toBe(first);
    expect(document.querySelectorAll(`[${ANNOUNCER_ATTRIBUTE}]`)).toHaveLength(1);
  });

  it('keeps a second document to itself', () => {
    const other = document.implementation.createHTMLDocument('other');
    const here = getLiveAnnouncer();
    const there = getLiveAnnouncer(other);

    expect(there).not.toBe(here);
    expect(other.querySelectorAll(`[${ANNOUNCER_ATTRIBUTE}]`)).toHaveLength(1);
    there.destroy();
  });
});
