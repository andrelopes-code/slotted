import { SEED_NAMES, THEME_CHANGE_EVENT as THEME_PACKAGE_EVENT } from '@slotted/theme';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MIRRORED_ATTRIBUTES,
  MIRRORED_PROPERTIES,
  PORTAL_ROOT_ATTRIBUTE,
  THEME_CHANGE_EVENT,
  createPortalRoot,
  getPortalContainer,
  setPortalContainer,
} from './portal';

function roots(scope: Document = document) {
  return [...scope.querySelectorAll(`[${PORTAL_ROOT_ATTRIBUTE}]`)];
}

/**
 * Core does not import `@slotted/theme` at runtime; it restates the seed
 * names and the event name, and these two assertions hold the copies to the
 * package that defines them.
 */
describe('the names core shares with @slotted/theme', () => {
  it('mirrors one custom property per seed the theme package declares', () => {
    expect(MIRRORED_PROPERTIES).toEqual(SEED_NAMES.map((name) => `--slotted-seed-${name}`));
  });

  it('listens for the event applyTheme dispatches', () => {
    expect(THEME_CHANGE_EVENT).toBe(THEME_PACKAGE_EVENT);
  });
});

describe('createPortalRoot', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    setPortalContainer(null);
    for (const root of roots()) root.remove();
  });

  it('adds nothing to the document until a layer asks for a container', () => {
    expect(roots()).toHaveLength(0);

    const portal = createPortalRoot();
    expect(roots()).toHaveLength(1);
    portal.release();
  });

  it('gives every layer its own element inside one shared root', () => {
    const first = createPortalRoot();
    const second = createPortalRoot();

    expect(roots()).toHaveLength(1);
    expect(first.container).not.toBe(second.container);
    expect(first.container?.parentElement).toBe(second.container?.parentElement);
    first.release();
    second.release();
  });

  /**
   * A test can only assert an empty body if the root leaves with the last
   * layer, and a long-lived application never sees the root thrash because it
   * only leaves at zero.
   */
  it('removes the shared root when the last layer releases it', () => {
    const first = createPortalRoot();
    const second = createPortalRoot();

    first.release();
    expect(roots()).toHaveLength(1);

    second.release();
    expect(roots()).toHaveLength(0);
    expect(document.body.innerHTML).toBe('');
  });

  /** A layer raised over the ones opened after it is drawn over them: it goes last. */
  it('moves a layer after the ones opened after it', () => {
    const first = createPortalRoot();
    const second = createPortalRoot();
    const root = first.container?.parentElement;
    expect(root?.lastElementChild).toBe(second.container);
    first.raise();
    expect(root?.lastElementChild).toBe(first.container);
    first.release();
    second.release();
  });

  it('releases once however many times it is called', () => {
    const portal = createPortalRoot();
    const other = createPortalRoot();

    portal.release();
    portal.release();
    expect(roots()).toHaveLength(1);

    other.release();
    expect(roots()).toHaveLength(0);
  });

  it('puts the layer in the container the consumer named', () => {
    document.body.innerHTML = '<section id="host"></section>';
    const host = document.getElementById('host') as HTMLElement;

    const portal = createPortalRoot({ container: host });
    expect(portal.container?.parentElement).toBe(host);
    expect(roots()).toHaveLength(0);

    portal.release();
    expect(host.children).toHaveLength(0);
  });

  it('reports no container at all when the portal is disabled', () => {
    const portal = createPortalRoot({ disabled: true });

    expect(portal.container).toBe(null);
    expect(roots()).toHaveLength(0);
    portal.release();
  });

  describe('the application container', () => {
    it('is where the shared root goes once it is named', () => {
      document.body.innerHTML = '<div id="shell"></div>';
      const shell = document.getElementById('shell') as HTMLElement;
      setPortalContainer(shell);

      const portal = createPortalRoot();
      expect(getPortalContainer()).toBe(shell);
      expect(portal.container?.parentElement?.parentElement).toBe(shell);
      portal.release();
    });

    it('gives way to the container a single layer named', () => {
      document.body.innerHTML = '<div id="shell"></div><div id="host"></div>';
      setPortalContainer(document.getElementById('shell') as HTMLElement);
      const host = document.getElementById('host') as HTMLElement;

      const portal = createPortalRoot({ container: host });
      expect(portal.container?.parentElement).toBe(host);
      portal.release();
    });
  });

  /**
   * The capability no surveyed portal has. A layer dropped at the end of the
   * body leaves the region that opened it, and with it the scheme, the density,
   * the theme and the direction that region declared.
   */
  describe('the theme of the region the layer came from', () => {
    it('mirrors every declared attribute onto the layer element', () => {
      document.body.innerHTML = `
        <div dir="rtl" data-slotted-scheme="dark" data-slotted-density="dense" data-slotted-corners="round">
          <button id="trigger">open</button>
        </div>`;
      const trigger = document.getElementById('trigger') as HTMLElement;

      const portal = createPortalRoot({ origin: trigger });

      expect(portal.container?.getAttribute('dir')).toBe('rtl');
      expect(portal.container?.getAttribute('data-slotted-scheme')).toBe('dark');
      expect(portal.container?.getAttribute('data-slotted-density')).toBe('dense');
      expect(portal.container?.getAttribute('data-slotted-corners')).toBe('round');
      portal.release();
    });

    it('takes each attribute from its own nearest ancestor', () => {
      document.body.innerHTML = `
        <div data-slotted-theme="marca" dir="rtl">
          <div data-slotted-scheme="dark">
            <span id="trigger"></span>
          </div>
        </div>`;
      const trigger = document.getElementById('trigger') as HTMLElement;

      const portal = createPortalRoot({ origin: trigger });

      expect(portal.container?.getAttribute('data-slotted-theme')).toBe('marca');
      expect(portal.container?.getAttribute('data-slotted-scheme')).toBe('dark');
      expect(portal.container?.getAttribute('dir')).toBe('rtl');
      portal.release();
    });

    it('writes nothing for an attribute no ancestor declares', () => {
      document.body.innerHTML = '<span id="trigger"></span>';
      const portal = createPortalRoot({
        origin: document.getElementById('trigger') as HTMLElement,
      });

      for (const attribute of MIRRORED_ATTRIBUTES) {
        expect(portal.container?.hasAttribute(attribute)).toBe(false);
      }
      expect(portal.container?.hasAttribute('data-slotted-seeds')).toBe(false);
      portal.release();
    });

    it('carries the seeds of the region onto the layer and marks it to derive from them', () => {
      document.body.innerHTML = `
        <div data-slotted-theme="default" data-slotted-scheme="dark">
          <span id="trigger" style="--slotted-seed-accent: #e11d48"></span>
        </div>`;
      const portal = createPortalRoot({
        origin: document.getElementById('trigger') as HTMLElement,
      });
      const layer = portal.container as HTMLElement;

      expect(layer.style.getPropertyValue('--slotted-seed-accent')).toBe('#e11d48');
      expect(layer.hasAttribute('data-slotted-seeds')).toBe(true);
      portal.release();
    });

    it('follows a seed the application changes while the layer is open', async () => {
      document.body.innerHTML = `<span id="trigger" style="--slotted-seed-accent: #e11d48"></span>`;
      const trigger = document.getElementById('trigger') as HTMLElement;
      const portal = createPortalRoot({ origin: trigger });

      trigger.style.setProperty('--slotted-seed-accent', '#16a34a');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        (portal.container as HTMLElement).style.getPropertyValue('--slotted-seed-accent'),
      ).toBe('#16a34a');
      portal.release();
    });

    /**
     * jsdom resolves an inherited custom property by walking the ancestors
     * again at every level, so reading the seeds off a deep opener cost
     * seconds: 34 s for a menu opened from a table cell 24 elements deep.
     */
    it('opens a layer from an opener 24 elements deep in under 500 ms', () => {
      document.body.innerHTML = `<div data-slotted-theme="default">${'<div>'.repeat(22)}<button id="trigger"></button>${'</div>'.repeat(22)}</div>`;
      const trigger = document.getElementById('trigger') as HTMLElement;
      let depth = 0;
      for (let node: Element | null = trigger; node; node = node.parentElement) depth += 1;
      expect(depth).toBeGreaterThanOrEqual(24);

      const start = performance.now();
      const portal = createPortalRoot({ origin: trigger });
      expect(performance.now() - start).toBeLessThan(500);
      portal.release();
    });

    it('carries a seed a region declares with data-slotted-seeds', () => {
      document.body.innerHTML = `
        <div data-slotted-theme="default">
          <section data-slotted-seeds style="--slotted-seed-accent: #e11d48">
            <div><span id="trigger"></span></div>
          </section>
        </div>`;
      const portal = createPortalRoot({ origin: document.getElementById('trigger') });

      expect(
        (portal.container as HTMLElement).style.getPropertyValue('--slotted-seed-accent'),
      ).toBe('#e11d48');
      portal.release();
    });

    /**
     * `applyTheme` replaces the stylesheet of a theme already on the page: the
     * seeds change and no attribute does, so only the event it dispatches
     * tells the open layers to read them again.
     */
    it('follows the seeds of a theme stylesheet applied again while the layer is open', () => {
      const sheet = document.createElement('style');
      sheet.textContent = '[data-slotted-theme="brand"] { --slotted-seed-accent: #e11d48; }';
      document.head.append(sheet);
      document.body.innerHTML = `<div data-slotted-theme="brand"><span id="trigger"></span></div>`;
      const portal = createPortalRoot({ origin: document.getElementById('trigger') });
      const layer = portal.container as HTMLElement;
      expect(layer.style.getPropertyValue('--slotted-seed-accent')).toBe('#e11d48');

      sheet.textContent = '[data-slotted-theme="brand"] { --slotted-seed-accent: #16a34a; }';
      document.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, { detail: { name: 'brand', applied: true } }),
      );

      expect(layer.style.getPropertyValue('--slotted-seed-accent')).toBe('#16a34a');
      portal.release();
      sheet.remove();
    });

    it('stops listening for theme changes once the last layer is released', () => {
      const spy = vi.spyOn(document, 'removeEventListener');
      const portal = createPortalRoot({ origin: document.body });
      portal.release();
      expect(spy.mock.calls.map(([type]) => type)).toContain(THEME_CHANGE_EVENT);
      spy.mockRestore();
    });

    it('follows a scheme the application changes while the layer is open', async () => {
      document.body.innerHTML = `
        <div id="region" data-slotted-scheme="light"><span id="trigger"></span></div>`;
      const region = document.getElementById('region') as HTMLElement;
      const portal = createPortalRoot({
        origin: document.getElementById('trigger') as HTMLElement,
      });

      region.setAttribute('data-slotted-scheme', 'dark');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(portal.container?.getAttribute('data-slotted-scheme')).toBe('dark');
      portal.release();
    });

    it('drops an attribute the application removes', async () => {
      document.body.innerHTML = `
        <div id="region" dir="rtl"><span id="trigger"></span></div>`;
      const region = document.getElementById('region') as HTMLElement;
      const portal = createPortalRoot({
        origin: document.getElementById('trigger') as HTMLElement,
      });

      region.removeAttribute('dir');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(portal.container?.hasAttribute('dir')).toBe(false);
      portal.release();
    });
  });

  /**
   * Two copies of the library on one page — a micro-frontend, or a Storybook
   * running two versions — would otherwise share one module-level root and one
   * count, and the first release would take the other copy's layers with it.
   */
  it('keeps one root per document', () => {
    const other = document.implementation.createHTMLDocument('other');
    other.body.innerHTML = '<span id="trigger"></span>';
    const here = createPortalRoot();
    const there = createPortalRoot({ origin: other.getElementById('trigger') as Element });

    expect(roots()).toHaveLength(1);
    expect(roots(other)).toHaveLength(1);
    expect(there.container?.ownerDocument).toBe(other);

    here.release();
    expect(roots()).toHaveLength(0);
    expect(roots(other)).toHaveLength(1);

    there.release();
    expect(roots(other)).toHaveLength(0);
  });

  /**
   * The agent paints the fullscreen element and nothing else, so a layer at
   * the end of the body — a select opened from a region in full screen — is
   * a layer nobody can see. The root follows the element in and back out.
   */
  describe('full screen', () => {
    let current: Element | null = null;

    beforeEach(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => current,
      });
    });

    afterEach(() => {
      current = null;
      delete (document as unknown as Record<string, unknown>)['fullscreenElement'];
    });

    function goFullscreen(element: Element | null) {
      current = element;
      document.dispatchEvent(new Event('fullscreenchange'));
    }

    it('moves the shared root into the fullscreen element and back', () => {
      const region = document.createElement('div');
      document.body.append(region);
      const layer = createPortalRoot();
      const container = layer.container;

      goFullscreen(region);
      expect(roots()[0]?.parentElement).toBe(region);
      expect(layer.container).toBe(container);

      goFullscreen(null);
      expect(roots()[0]?.parentElement).toBe(document.body);
      layer.release();
    });

    it('opens a new layer inside an element already in full screen', () => {
      const region = document.createElement('div');
      document.body.append(region);
      current = region;

      const layer = createPortalRoot();
      expect(roots()[0]?.parentElement).toBe(region);
      layer.release();
    });

    it('stays in the application container for a whole document or a video', () => {
      const video = document.createElement('video');
      document.body.append(video);
      const layer = createPortalRoot();

      goFullscreen(document.documentElement);
      expect(roots()[0]?.parentElement).toBe(document.body);
      goFullscreen(video);
      expect(roots()[0]?.parentElement).toBe(document.body);
      layer.release();
    });
  });
});
