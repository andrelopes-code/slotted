import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ENTERING_FRAME_LIMIT, createPresence } from './presence';

/**
 * The module schedules on `requestAnimationFrame`, which Vitest does not fake
 * by default, and completes an unanimated exit on a timer. Both are faked here
 * so a test states the passage of time instead of waiting for it.
 */
function useFrames() {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'],
  });
}

function mount(styles: Record<string, string> = {}) {
  document.body.innerHTML = '<div id="layer"><span id="child"></span></div>';
  const node = document.getElementById('layer') as HTMLElement;
  for (const [property, value] of Object.entries(styles)) node.style.setProperty(property, value);
  return node;
}

const FADE = { 'animation-duration': '200ms', 'animation-name': 'fade-out' };

describe('createPresence', () => {
  beforeEach(() => {
    useFrames();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts unmounted when nothing is present', () => {
    const presence = createPresence();

    expect(presence.status).toBe('unmounted');
    expect(presence.mounted).toBe(false);
    expect(presence.present).toBe(false);
    presence.destroy();
  });

  /**
   * The reason the status has four values rather than two: a node that mounts
   * already open has no frame in which a transition could start from the
   * closed style.
   */
  it('mounts through entering and settles open one frame later', () => {
    const status: string[] = [];
    const presence = createPresence({ onStatusChange: (next) => status.push(next) });

    presence.request(true, 'pointer');
    expect(presence.status).toBe('entering');
    expect(presence.mounted).toBe(true);
    presence.setNode(mount());

    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('open');
    expect(status).toEqual(['entering', 'open']);
    presence.destroy();
  });

  /**
   * DG3. The framework renders `entering` on its own schedule, and a frame
   * that fired before the render had committed reported `open` into the same
   * style update as the mount: the layer appeared at full opacity with no
   * transition. `open` now waits for the node the family rendered, and reads
   * its style so the browser computes the closed one before the open one.
   */
  describe('the entering frame', () => {
    it('holds entering until the family has registered its node', () => {
      const presence = createPresence();
      presence.request(true, 'pointer');

      vi.advanceTimersToNextFrame();
      expect(presence.status).toBe('entering');

      presence.setNode(mount());
      vi.advanceTimersToNextFrame();
      expect(presence.status).toBe('open');
      presence.destroy();
    });

    it('reads the closed style of the node before it opens', () => {
      const node = mount();
      const presence = createPresence();
      const seen: string[] = [];
      const computed = vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
        if (element === node) seen.push(presence.status);
        return { opacity: '0' } as CSSStyleDeclaration;
      });

      presence.request(true, 'pointer');
      presence.setNode(node);
      vi.advanceTimersToNextFrame();

      expect(presence.status).toBe('open');
      expect(seen).toEqual(['entering']);
      computed.mockRestore();
      presence.destroy();
    });

    it('opens without a node once the wait has run out', () => {
      const presence = createPresence();
      presence.request(true, 'pointer');

      for (let frame = 0; frame < ENTERING_FRAME_LIMIT; frame += 1) {
        vi.advanceTimersToNextFrame();
        expect(presence.status).toBe('entering');
      }
      vi.advanceTimersToNextFrame();
      expect(presence.status).toBe('open');
      presence.destroy();
    });

    /** R7: reduced motion drops the transforms and keeps the opacity fade. */
    it('takes the frame under reduced motion, so the fade still has a start', () => {
      const presence = createPresence({ reducedMotion: () => true });

      presence.request(true, 'pointer');
      expect(presence.status).toBe('entering');
      presence.setNode(mount());

      vi.advanceTimersToNextFrame();
      expect(presence.status).toBe('open');
      presence.destroy();
    });
  });

  /** React's StrictMode replays unmount and mount on the same handle in development. */
  it('resumes after stop, as a StrictMode replay calls it', () => {
    const presence = createPresence({ present: false });
    presence.stop();

    presence.sync(true);
    expect(presence.status).toBe('entering');
    presence.setNode(mount());
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('open');
    presence.destroy();
  });

  it('runs again an entering frame that stop cancelled', () => {
    const presence = createPresence({ initialPresent: true, skipInitialAnimation: false });
    presence.stop();

    presence.setNode(mount());
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('open');
    presence.destroy();
  });

  it('ignores every call after destroy', () => {
    const status = vi.fn();
    const presence = createPresence({ present: false, onStatusChange: status });
    presence.destroy();

    presence.sync(true);
    presence.setNode(mount());
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('unmounted');
    expect(status).not.toHaveBeenCalled();
  });

  it('opens without the entering frame when it is present on the first mount', () => {
    const presence = createPresence({ initialPresent: true });

    expect(presence.status).toBe('open');
    presence.destroy();
  });

  it('animates in on the first mount when the consumer asks for it', () => {
    const presence = createPresence({ initialPresent: true, skipInitialAnimation: false });

    expect(presence.status).toBe('entering');
    presence.setNode(mount());
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('open');
    presence.destroy();
  });

  /**
   * A layer an application mounts already open — `{subject && <Drawer open />}`
   * — enters as one that opens later does, and reports when its entrance has
   * ended, so the application knows the layer is settled.
   */
  it('enters from the closed style when mounted present, and reports the end', () => {
    const enters = vi.fn();
    const node = mount({ 'transition-duration': '150ms', 'transition-property': 'opacity' });
    const presence = createPresence({
      initialPresent: true,
      skipInitialAnimation: false,
      onEnterComplete: enters,
    });
    expect(presence.status).toBe('entering');
    presence.setNode(node);

    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('open');
    vi.advanceTimersToNextFrame();
    expect(enters).not.toHaveBeenCalled();

    node.dispatchEvent(new Event('transitionend'));
    expect(enters).toHaveBeenCalledTimes(1);
    presence.destroy();
  });

  it('reports the end of an entrance it skipped once it has a node', () => {
    const enters = vi.fn();
    const presence = createPresence({ initialPresent: true, onEnterComplete: enters });
    expect(presence.status).toBe('open');

    presence.setNode(mount());
    vi.advanceTimersToNextFrame();
    expect(enters).toHaveBeenCalledTimes(1);
    presence.destroy();
  });

  it('unmounts in the same task when the node declares no animation', () => {
    const exits = vi.fn();
    const presence = createPresence({ initialPresent: true, onExitComplete: exits });
    presence.setNode(mount());

    presence.request(false, 'escape');
    expect(presence.status).toBe('exiting');

    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('unmounted');
    expect(presence.mounted).toBe(false);
    expect(exits).toHaveBeenCalledTimes(1);
    presence.destroy();
  });

  it('holds the node mounted until the exit animation ends', () => {
    const exits = vi.fn();
    const node = mount(FADE);
    const presence = createPresence({ initialPresent: true, onExitComplete: exits });
    presence.setNode(node);

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('exiting');
    expect(presence.mounted).toBe(true);

    node.dispatchEvent(new Event('animationend'));
    expect(presence.status).toBe('unmounted');
    expect(exits).toHaveBeenCalledTimes(1);
    presence.destroy();
  });

  it('waits on a transition as well as an animation', () => {
    const node = mount({ 'transition-duration': '150ms', 'transition-property': 'opacity' });
    const presence = createPresence({ initialPresent: true });
    presence.setNode(node);

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('exiting');

    node.dispatchEvent(new Event('transitionend'));
    expect(presence.status).toBe('unmounted');
    presence.destroy();
  });

  /**
   * React detaches a callback ref and attaches its successor in one commit:
   * the render that writes `exiting` passes `null` and then the same node.
   */
  it('keeps the exit running through a ref that detaches and attaches again', () => {
    const node = mount(FADE);
    const presence = createPresence({ initialPresent: true });
    presence.setNode(node);

    presence.request(false, 'escape');
    presence.setNode(null);
    presence.setNode(node);
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('exiting');

    node.dispatchEvent(new Event('animationend'));
    expect(presence.status).toBe('unmounted');
    presence.destroy();
  });

  it('completes the exit a frame after its node leaves for good', () => {
    const presence = createPresence({ initialPresent: true });
    presence.setNode(mount(FADE));

    presence.request(false, 'escape');
    presence.setNode(null);
    expect(presence.status).toBe('exiting');

    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('unmounted');
    presence.destroy();
  });

  /** A spinner inside a panel would otherwise end the panel's exit. */
  it('ignores an animation that ended on a descendant', () => {
    const node = mount(FADE);
    const child = document.getElementById('child') as HTMLElement;
    const presence = createPresence({ initialPresent: true });
    presence.setNode(node);

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();
    child.dispatchEvent(new Event('animationend', { bubbles: true }));

    expect(presence.status).toBe('exiting');
    presence.destroy();
  });

  /**
   * The capability no surveyed implementation has. The CSS specifications let
   * an engine withhold `animationend` — a `display: none` ancestor, a
   * backgrounded tab — and the three libraries that wait only on the event
   * leave the node in the document for the life of the page.
   */
  it('completes the exit on the declared duration when the event never arrives', () => {
    const exits = vi.fn();
    const presence = createPresence({
      initialPresent: true,
      exitGrace: 50,
      onExitComplete: exits,
    });
    presence.setNode(mount({ ...FADE, 'animation-delay': '100ms' }));

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();

    vi.advanceTimersByTime(349);
    expect(presence.status).toBe('exiting');

    vi.advanceTimersByTime(1);
    expect(presence.status).toBe('unmounted');
    expect(exits).toHaveBeenCalledTimes(1);
    presence.destroy();
  });

  it('returns to open when an exit is interrupted, and reports no exit', () => {
    const exits = vi.fn();
    const presence = createPresence({ initialPresent: true, onExitComplete: exits });
    presence.setNode(mount(FADE));

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();
    presence.request(true, 'pointer');

    expect(presence.status).toBe('open');
    vi.advanceTimersByTime(1000);
    expect(presence.status).toBe('open');
    expect(exits).not.toHaveBeenCalled();
    presence.destroy();
  });

  it('unmounts without waiting when the consumer asks for it', () => {
    const presence = createPresence({ initialPresent: true, immediate: true });
    presence.setNode(mount(FADE));

    presence.request(false, 'escape');
    expect(presence.status).toBe('unmounted');
    presence.destroy();
  });

  it('unmounts without waiting under reduced motion', () => {
    const presence = createPresence({ initialPresent: true, reducedMotion: () => true });
    presence.setNode(mount(FADE));

    presence.request(false, 'escape');
    expect(presence.status).toBe('unmounted');
    presence.destroy();
  });

  it('ends a running exit on demand', () => {
    const presence = createPresence({ initialPresent: true });
    presence.setNode(mount(FADE));

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();
    presence.finish();

    expect(presence.status).toBe('unmounted');
    presence.destroy();
  });

  it('keeps the node mounted in every status when it is force-mounted', () => {
    const presence = createPresence({ forceMount: true });

    expect(presence.mounted).toBe(true);
    expect(presence.status).toBe('unmounted');
    presence.request(true, 'programmatic');
    vi.advanceTimersToNextFrame();
    presence.request(false, 'programmatic');
    vi.advanceTimersToNextFrame();

    expect(presence.status).toBe('unmounted');
    expect(presence.mounted).toBe(true);
    presence.destroy();
  });

  it('follows the node when the consumer replaces it mid-exit', () => {
    const first = mount(FADE);
    const presence = createPresence({ initialPresent: true });
    presence.setNode(first);

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();

    const second = mount(FADE);
    presence.setNode(second);
    vi.advanceTimersToNextFrame();
    expect(presence.status).toBe('exiting');

    first.dispatchEvent(new Event('animationend'));
    expect(presence.status).toBe('exiting');

    second.dispatchEvent(new Event('animationend'));
    expect(presence.status).toBe('unmounted');
    presence.destroy();
  });

  describe('the state model', () => {
    it('carries the reason and the previous value in the request', () => {
      const requests: string[] = [];
      const presence = createPresence({
        onRequest: (request) => requests.push(`${String(request.previous)}->${request.reason}`),
      });

      presence.request(true, 'pointer');
      vi.advanceTimersToNextFrame();
      presence.request(false, 'outsidePress');

      expect(requests).toEqual(['false->pointer', 'true->outsidePress']);
      presence.destroy();
    });

    it('moves nothing when the request is cancelled', () => {
      const presence = createPresence({ onRequest: (request) => request.cancel() });

      expect(presence.request(true, 'pointer')).toBe(false);
      expect(presence.status).toBe('unmounted');
      presence.destroy();
    });

    it('does not move its own value in controlled mode', () => {
      const presence = createPresence({ present: false });

      presence.request(true, 'pointer');
      expect(presence.status).toBe('unmounted');

      presence.sync(true);
      expect(presence.status).toBe('entering');
      expect(presence.present).toBe(true);
      presence.destroy();
    });

    it('emits no request for the value it already holds', () => {
      const onRequest = vi.fn();
      const presence = createPresence({ initialPresent: true, onRequest });

      expect(presence.request(true, 'programmatic')).toBe(false);
      expect(onRequest).not.toHaveBeenCalled();
      presence.destroy();
    });
  });

  it('leaves no listener, timer or frame behind', () => {
    const node = mount(FADE);
    const remove = vi.spyOn(node, 'removeEventListener');
    const exits = vi.fn();
    const presence = createPresence({ initialPresent: true, onExitComplete: exits });
    presence.setNode(node);

    presence.request(false, 'escape');
    vi.advanceTimersToNextFrame();
    presence.destroy();

    expect(remove).toHaveBeenCalled();
    node.dispatchEvent(new Event('animationend'));
    vi.advanceTimersByTime(1000);
    expect(exits).not.toHaveBeenCalled();
  });
});
