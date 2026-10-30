import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFullscreen, fullscreenElement, fullscreenSupported } from './fullscreen';

/**
 * jsdom has no Fullscreen API, so each case installs the one it needs: an
 * agent that accepts, one that refuses, or none at all. The installed agent
 * keeps the document's fullscreen element and fires `fullscreenchange` the
 * way the specification orders it — before the promise resolves.
 */
interface Agent {
  refuse: boolean;
  requested: { element: Element; options: unknown }[];
  /** The agent leaving on its own: `Escape`, F11, its interface. */
  leave: () => void;
}

function installAgent(refuse = false): Agent {
  let current: Element | null = null;
  /* The element the agent made full screen, handed over rather than aliased. */
  const take = (element: Element) => {
    current = element;
  };
  const agent: Agent = {
    refuse,
    requested: [],
    leave() {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    },
  };
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => current,
  });
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: vi.fn(async () => {
      current = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    }),
  });
  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    configurable: true,
    value: vi.fn(async function (this: HTMLElement, options: unknown) {
      agent.requested.push({ element: this, options });
      if (agent.refuse) throw new TypeError('Permissions check failed');
      take(this);
      document.dispatchEvent(new Event('fullscreenchange'));
    }),
  });
  return agent;
}

function removeAgent() {
  for (const name of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen']) {
    delete (document as unknown as Record<string, unknown>)[name];
  }
  delete (HTMLElement.prototype as unknown as Record<string, unknown>)['requestFullscreen'];
}

function region() {
  const root = document.createElement('div');
  root.innerHTML = '<button data-inside>Inside</button><button data-other>Other</button>';
  document.body.append(root);
  return root;
}

describe('createFullscreen', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('style');
  });

  afterEach(() => {
    removeAgent();
  });

  it('reports no support on a document without the API', () => {
    expect(fullscreenSupported(document)).toBe(false);
    expect(fullscreenElement(document)).toBeNull();
  });

  it('enters native when the agent accepts, with the navigation interface asked for', async () => {
    const agent = installAgent();
    const root = region();
    const modes: unknown[] = [];
    const controller = createFullscreen(root, {
      navigationUI: 'hide',
      onModeChange: (mode) => modes.push(mode),
    });

    await expect(controller.enter()).resolves.toBe('native');
    expect(controller.mode).toBe('native');
    expect(agent.requested).toEqual([{ element: root, options: { navigationUI: 'hide' } }]);
    expect(modes).toEqual(['native']);
    controller.destroy();
  });

  /**
   * The scope's other line: an absent API is not an error the reader sees.
   * The region is given the viewport inside the page, and the error is still
   * said, so a consumer who prefers nothing can refuse it.
   */
  it('falls back to layout when the API is absent, and says so', async () => {
    const root = region();
    const onError = vi.fn();
    const controller = createFullscreen(root, { onError });

    await expect(controller.enter()).resolves.toBe('layout');
    expect(onError).toHaveBeenCalledWith({ kind: 'unsupported' });
    expect(document.body.style.overflow).toBe('hidden');
    controller.destroy();
  });

  it('falls back to layout when the agent refuses, carrying the cause', async () => {
    installAgent(true);
    const root = region();
    const onError = vi.fn();
    const controller = createFullscreen(root, { onError });

    await expect(controller.enter()).resolves.toBe('layout');
    expect(onError).toHaveBeenCalledWith({ kind: 'refused', cause: expect.any(TypeError) });
    controller.destroy();
  });

  it('never asks the agent under the layout policy', async () => {
    const agent = installAgent();
    const controller = createFullscreen(region(), { policy: 'layout' });

    await expect(controller.enter()).resolves.toBe('layout');
    expect(agent.requested).toEqual([]);
    controller.destroy();
  });

  /** The words are the binding's: core announces what its translator writes, and no English of its own. */
  it('announces entry and exit in the words the translator writes', async () => {
    const t = vi.fn((key: string) => `said ${key}`);
    const controller = createFullscreen(region(), { policy: 'layout', t: t as never });

    await controller.enter();
    await controller.exit();
    expect(t.mock.calls.map(([key]) => key)).toEqual(['entered', 'exited']);
    controller.destroy();
  });

  /**
   * A leave the application did not ask for is reported, not performed twice.
   * In native the agent has already left, so the region is out by the time
   * the binding hears of it.
   */
  it('reports the agent leaving native as an exit, and is out already', async () => {
    const agent = installAgent();
    const onExit = vi.fn();
    const controller = createFullscreen(region(), { onExit });
    await controller.enter();

    agent.leave();
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(controller.mode).toBeNull();
    controller.destroy();
  });

  it('does not read its own exit as the reader leaving', async () => {
    installAgent();
    const onExit = vi.fn();
    const controller = createFullscreen(region(), { onExit });
    await controller.enter();

    await controller.exit();
    expect(onExit).not.toHaveBeenCalled();
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(controller.mode).toBeNull();
    controller.destroy();
  });

  /**
   * `Escape` in layout is an ask through `dismissable-layer`, so the binding
   * may refuse it and the region stays. In native no listener is written.
   */
  it('asks to leave on Escape in layout and stays until told', async () => {
    const onExit = vi.fn();
    const controller = createFullscreen(region(), { policy: 'layout', onExit });
    await controller.enter();

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(controller.mode).toBe('layout');

    await controller.exit();
    expect(controller.mode).toBeNull();
    expect(document.body.style.overflow).toBe('');
    controller.destroy();
  });

  it('writes no Escape handling in native', async () => {
    installAgent();
    const onExit = vi.fn();
    const controller = createFullscreen(region(), { onExit });
    await controller.enter();

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.body.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
    expect(onExit).not.toHaveBeenCalled();
    expect(controller.mode).toBe('native');
    controller.destroy();
  });

  it('puts back the region’s scroll and a focus that came from outside', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const root = region();
    root.scrollTop = 40;
    outside.focus();

    const controller = createFullscreen(root, { policy: 'layout' });
    await controller.enter();
    root.querySelector<HTMLButtonElement>('[data-inside]')!.focus();
    root.scrollTop = 0;

    await controller.exit();
    expect(root.scrollTop).toBe(40);
    expect(document.activeElement).toBe(outside);
    controller.destroy();
  });

  it('keeps focus on a control inside that the reader pressed', async () => {
    const root = region();
    const inside = root.querySelector<HTMLButtonElement>('[data-inside]')!;
    inside.focus();
    const controller = createFullscreen(root, { policy: 'layout' });
    await controller.enter();

    await controller.exit();
    expect(document.activeElement).toBe(inside);
    controller.destroy();
  });

  it('asks the agent once when entry is asked twice before it answers', async () => {
    const agent = installAgent();
    const controller = createFullscreen(region());
    const [first, second] = await Promise.all([controller.enter(), controller.enter()]);

    expect([first, second]).toEqual(['native', 'native']);
    expect(agent.requested).toHaveLength(1);
    controller.destroy();
  });

  it('leaves native when destroyed in it', async () => {
    installAgent();
    const controller = createFullscreen(region());
    await controller.enter();

    controller.destroy();
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('leaves at once when asked to exit while the agent was still deciding', async () => {
    installAgent();
    const controller = createFullscreen(region());
    const entering = controller.enter();
    await controller.exit();
    await entering;

    expect(controller.mode).toBeNull();
    expect(document.fullscreenElement).toBeNull();
    controller.destroy();
  });
});
