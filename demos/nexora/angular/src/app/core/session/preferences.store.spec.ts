import { ApplicationInitStatus, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { CUSTOM_THEME_LOADER, type CustomThemeModule } from '../theming/custom-sheet';
import { NO_CUSTOMISATION } from '../theming/customization';
import { appearanceOf, PreferencesStore } from './preferences.store';
import { SessionStore } from './session.store';

/** The builder's module as the store loads it; a test swaps it for one that fails. */
const builder = (): Promise<CustomThemeModule> => import('../theming/custom-theme');
let loadBuilder = builder;

describe('PreferencesStore', () => {
  beforeEach(async () => {
    loadBuilder = builder;
    TestBed.configureTestingModule({
      providers: [
        provideTestBackend(),
        { provide: CUSTOM_THEME_LOADER, useValue: () => loadBuilder() },
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  it('writes the scheme and density onto html and persists per user', async () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    prefs.update({ scheme: 'dark', density: 'compact' });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    TestBed.flushEffects();
    expect(html.getAttribute('data-slotted-scheme')).toBe('dark');
    expect(html.getAttribute('data-slotted-density')).toBe('compact');
    const userId = TestBed.inject(SessionStore).user()!.id;
    expect(
      (
        JSON.parse(localStorage.getItem(`nexora:preferences:${userId}`) ?? '{}') as {
          scheme: string;
        }
      ).scheme,
    ).toBe('dark');
  });

  /**
   * The shell arrangement is not written onto `html`: it is an input of one
   * shell, so the store only has to keep it and give it back.
   */
  it('keeps the shell arrangement per user, inset until the reader says otherwise', () => {
    const prefs = TestBed.inject(PreferencesStore);
    expect(prefs.preferences().shell).toBe('inset');

    prefs.update({ shell: 'floating' });

    expect(prefs.preferences().shell).toBe('floating');
    const userId = TestBed.inject(SessionStore).user()!.id;
    const stored = JSON.parse(localStorage.getItem(`nexora:preferences:${userId}`) ?? '{}') as {
      shell: string;
    };
    expect(stored.shell).toBe('floating');
  });

  /**
   * The theme is an attribute and the brand and the neutral are seeds, all on
   * `html`: the theme sheets scope by the attribute, and an inline seed on the
   * element that names the theme outranks the seed the sheet declares there.
   */
  it('writes the theme and the seeds of the brand and the neutral onto html', async () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    TestBed.flushEffects();
    expect(html.getAttribute('data-slotted-theme')).toBe('default');
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#7c3aed');
    expect(html.style.getPropertyValue('--slotted-seed-neutral')).toBe('');

    prefs.update({
      theme: 'nexora-corporate',
      brand: { preset: 'custom', custom: '#0f766e' },
      neutral: { preset: 'clay', custom: '#64748b' },
    });
    TestBed.flushEffects();
    await prefs.useThemes(['nexora-corporate']);
    TestBed.flushEffects();

    expect(html.getAttribute('data-slotted-theme')).toBe('nexora-corporate');
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#0f766e');
    expect(html.style.getPropertyValue('--slotted-seed-neutral')).toBe('#9c6644');
    const userId = TestBed.inject(SessionStore).user()!.id;
    const stored = JSON.parse(localStorage.getItem(`nexora:preferences:${userId}`) ?? '{}') as {
      theme: string;
      neutral: unknown;
    };
    expect(stored.theme).toBe('nexora-corporate');
    expect(stored.neutral).toEqual({ preset: 'clay', custom: '#64748b' });
  });

  /**
   * `default.css` declares every token under `[data-slotted-theme='default']`,
   * so a name whose sheet is not on the page yet would leave `html` without a
   * single token. The attribute keeps the theme it shows until the sheet of the
   * new one exists; the seeds do not wait.
   */
  it('names a runtime theme on html only once its sheet is on the page', async () => {
    const doc = TestBed.inject(DOCUMENT);
    const prefs = TestBed.inject(PreferencesStore);
    const html = doc.documentElement;
    TestBed.flushEffects();

    prefs.update({ theme: 'nexora-editorial', brand: { preset: 'amber', custom: '#7c3aed' } });
    TestBed.flushEffects();
    expect(html.getAttribute('data-slotted-theme')).toBe('default');
    expect(doc.head.querySelector('style[data-slotted-theme-sheet]')).toBeNull();
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#d97706');

    await prefs.useThemes(['nexora-editorial']);
    TestBed.flushEffects();
    expect(
      doc.head.querySelector('style[data-slotted-theme-sheet="nexora-editorial"]'),
    ).not.toBeNull();
    expect(html.getAttribute('data-slotted-theme')).toBe('nexora-editorial');
  });

  /** A seed the preferences no longer name leaves `html`, so the theme's own value holds again. */
  it('removes a seed the preferences stop writing', () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    prefs.update({ neutral: { preset: 'plum', custom: '#64748b' } });
    TestBed.flushEffects();
    expect(html.style.getPropertyValue('--slotted-seed-neutral')).toBe('#7e5a86');

    prefs.update({ neutral: { preset: 'theme', custom: '#64748b' } });
    TestBed.flushEffects();
    expect(html.style.getPropertyValue('--slotted-seed-neutral')).toBe('');
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#7c3aed');
  });

  /** A grey of the reader's own is a seed like a preset's; the color is kept while a preset is chosen. */
  it('writes a custom grey as the neutral seed', () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    prefs.update({ neutral: { preset: 'custom', custom: '#336699' } });
    TestBed.flushEffects();
    expect(html.style.getPropertyValue('--slotted-seed-neutral')).toBe('#336699');

    prefs.update({ neutral: { preset: 'sage', custom: '#336699' } });
    TestBed.flushEffects();
    expect(html.style.getPropertyValue('--slotted-seed-neutral')).toBe('#5b7f66');
    expect(prefs.preferences().neutral.custom).toBe('#336699');
  });

  /** A stored grey is read like a brand: each half on its own, and an unknown one as the default. */
  it('reads a stored grey half by half', () => {
    const prefs = TestBed.inject(PreferencesStore);
    const userId = TestBed.inject(SessionStore).user()!.id;
    const read = (neutral: unknown) => {
      localStorage.setItem(`nexora:preferences:${userId}`, JSON.stringify({ neutral }));
      prefs.update({});
      return prefs.preferences().neutral;
    };
    expect(read({ preset: 'custom', custom: '#336699' })).toEqual({
      preset: 'custom',
      custom: '#336699',
    });
    expect(read({ preset: 'sage', custom: 'url(x)' })).toEqual({
      preset: 'sage',
      custom: '#64748b',
    });
    expect(read({ preset: 'custom', custom: 'red' })).toEqual({
      preset: 'theme',
      custom: '#64748b',
    });
    expect(read('clay')).toEqual({ preset: 'theme', custom: '#64748b' });
  });

  /** `seedStyle` refuses the color, and the brand is read as the default rather than breaking the page. */
  it('reads a stored brand that is no color as the default', () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    const userId = TestBed.inject(SessionStore).user()!.id;
    localStorage.setItem(
      `nexora:preferences:${userId}`,
      JSON.stringify({
        brand: { preset: 'custom', custom: 'red; color: blue' },
        theme: 'retired',
        neutral: 'teal',
      }),
    );
    prefs.update({});
    TestBed.flushEffects();

    expect(prefs.preferences().brand).toEqual({ preset: 'theme', custom: '#7c3aed' });
    expect(prefs.preferences().theme).toBe('default');
    expect(prefs.preferences().neutral).toEqual({ preset: 'theme', custom: '#64748b' });
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#7c3aed');
    expect(html.getAttribute('data-slotted-theme')).toBe('default');
  });

  /** Only the broken half is dropped: the preset the reader chose holds, and Custom starts over. */
  it('keeps a stored preset whose custom color is no color', () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    const userId = TestBed.inject(SessionStore).user()!.id;
    localStorage.setItem(
      `nexora:preferences:${userId}`,
      JSON.stringify({ brand: { preset: 'rose', custom: 'url(x)' } }),
    );
    prefs.update({});
    TestBed.flushEffects();

    expect(prefs.preferences().brand).toEqual({ preset: 'rose', custom: '#7c3aed' });
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#e11d48');
  });

  /** The system scheme follows the media query; the theme and the seeds stay what the reader chose. */
  it('keeps the theme and the seeds when the system scheme changes', async () => {
    const listeners: (() => void)[] = [];
    const query = {
      matches: false,
      addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
    };
    const view = TestBed.inject(DOCUMENT).defaultView!;
    const own = Object.getOwnPropertyDescriptor(view, 'matchMedia');
    Object.defineProperty(view, 'matchMedia', { configurable: true, value: () => query });
    try {
      const prefs = TestBed.inject(PreferencesStore);
      const html = TestBed.inject(DOCUMENT).documentElement;
      prefs.update({
        scheme: 'system',
        theme: 'nexora-corporate',
        brand: { preset: 'amber', custom: '#7c3aed' },
        neutral: { preset: 'ocean', custom: '#64748b' },
      });
      await prefs.useThemes(['nexora-corporate']);
      TestBed.flushEffects();
      expect(html.getAttribute('data-slotted-scheme')).toBe('light');

      query.matches = true;
      listeners.forEach((listener) => listener());

      expect(html.getAttribute('data-slotted-scheme')).toBe('dark');
      expect(html.style.colorScheme).toBe('dark');
      expect(html.getAttribute('data-slotted-theme')).toBe('nexora-corporate');
      expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#d97706');
      expect(html.style.getPropertyValue('--slotted-seed-neutral')).toBe('#0e7490');
    } finally {
      if (own) Object.defineProperty(view, 'matchMedia', own);
      else delete (view as { matchMedia?: unknown }).matchMedia;
    }
  });

  /**
   * A runtime theme is compiled the first time it is used, and never again: a
   * reader on `default` carries no runtime sheet (`default` is in
   * `styles.css`), and a change back to a theme already used moves only the
   * attribute.
   */
  it('applies a runtime theme sheet once, the first time the theme is used', async () => {
    const doc = TestBed.inject(DOCUMENT);
    const prefs = TestBed.inject(PreferencesStore);
    let announced = 0;
    doc.addEventListener('slotted-themechange', () => (announced += 1));
    const names = () =>
      [...doc.head.querySelectorAll('style[data-slotted-theme-sheet]')].map((sheet) =>
        sheet.getAttribute('data-slotted-theme-sheet'),
      );
    TestBed.flushEffects();
    await prefs.useThemes([]);
    expect(names()).toEqual([]);

    prefs.update({ theme: 'nexora-corporate' });
    TestBed.flushEffects();
    await prefs.useThemes(['nexora-corporate']);
    prefs.update({ theme: 'nexora-expressive' });
    TestBed.flushEffects();
    await prefs.useThemes(['nexora-expressive']);
    prefs.update({ theme: 'nexora-corporate', neutral: { preset: 'ocean', custom: '#64748b' } });
    TestBed.flushEffects();
    await prefs.useThemes(['nexora-corporate', 'nexora-expressive']);
    expect(names()).toEqual(['nexora-corporate', 'nexora-expressive']);
    expect(announced).toBe(2);

    await prefs.useThemes();
    expect(names()).toEqual([
      'nexora-corporate',
      'nexora-expressive',
      'nexora-precise',
      'nexora-editorial',
    ]);
    expect(announced).toBe(4);
    expect(['default', ...names()].every((name) => prefs.hasSheet(name!))).toBe(true);
  });

  /**
   * The brand the theme brings writes no accent, so the theme sheet's own
   * holds; Standard's own is Nexora's violet. A status color is one more seed.
   */
  it('writes the theme’s own accent only for Standard, and the status colors as seeds', async () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    prefs.update({
      theme: 'nexora-precise',
      status: { success: null, warning: null, danger: '#be123c' },
    });
    TestBed.flushEffects();
    await prefs.useThemes(['nexora-precise']);
    TestBed.flushEffects();

    expect(html.getAttribute('data-slotted-theme')).toBe('nexora-precise');
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('');
    expect(html.style.getPropertyValue('--slotted-seed-danger')).toBe('#be123c');
    expect(html.style.getPropertyValue('--slotted-seed-success')).toBe('');

    prefs.update({ theme: 'default' });
    TestBed.flushEffects();
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#7c3aed');
  });

  /** A stored customization and stored status colors are read axis by axis and seed by seed. */
  it('reads a stored customization and status colors, dropping only what it does not offer', () => {
    const prefs = TestBed.inject(PreferencesStore);
    const userId = TestBed.inject(SessionStore).user()!.id;
    localStorage.setItem(
      `nexora:preferences:${userId}`,
      JSON.stringify({
        customization: {
          radius: 12,
          body: 'papyrus',
          cards: 'flat',
          motion: 'off',
          scale: 300,
          input: 'filled',
          focus: 'halo',
          controlHeight: 8,
        },
        status: { success: '#16a34a', warning: 'yellow', danger: 42 },
      }),
    );
    prefs.update({});

    expect(prefs.preferences().customization).toEqual({
      ...NO_CUSTOMISATION,
      radius: 12,
      motion: 'off',
      cards: 'flat',
      input: 'filled',
      controlHeight: 8,
    });
    expect(prefs.preferences().status).toEqual({ success: '#16a34a', warning: null, danger: null });
  });

  /**
   * A customized theme is compiled in the browser under `nexora-custom`, and
   * `html` names it once the sheet is there; without a change left, `html`
   * names the theme under it again.
   */
  it('names the compiled custom theme on html, and the base theme after a reset', async () => {
    const doc = TestBed.inject(DOCUMENT);
    const prefs = TestBed.inject(PreferencesStore);
    const html = doc.documentElement;
    await prefs.useThemes(['nexora-corporate']);
    prefs.update({
      theme: 'nexora-corporate',
      customization: { ...NO_CUSTOMISATION, cards: 'flat' },
    });
    TestBed.flushEffects();

    await vi.waitFor(() => {
      TestBed.flushEffects();
      expect(html.getAttribute('data-slotted-theme')).toBe('nexora-custom');
    });
    const sheet = doc.head.querySelector('style[data-slotted-theme-sheet="nexora-custom"]');
    expect(sheet?.textContent).toContain(
      '--slotted-card-background: var(--slotted-surface-sunken)',
    );
    expect(sheet?.textContent).toContain("[data-ui='table'] [data-part='column-header']");

    prefs.update({ customization: NO_CUSTOMISATION });
    TestBed.flushEffects();
    expect(html.getAttribute('data-slotted-theme')).toBe('nexora-corporate');
  });

  /**
   * The application is the preview: a candidate appearance reaches `html` at
   * once, saved or not, and clearing it brings the saved appearance back.
   */
  it('applies a candidate appearance to html, and the saved one once it is cleared', async () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    await prefs.useThemes(['nexora-precise']);
    TestBed.flushEffects();
    const saved = {
      theme: html.getAttribute('data-slotted-theme'),
      scheme: html.getAttribute('data-slotted-scheme'),
      density: html.getAttribute('data-slotted-density'),
      accent: html.style.getPropertyValue('--slotted-seed-accent'),
    };
    expect(saved.theme).toBe('default');

    prefs.preview({
      ...appearanceOf(prefs.preferences()),
      theme: 'nexora-precise',
      scheme: 'dark',
      density: 'compact',
      brand: { preset: 'rose', custom: '#7c3aed' },
    });
    TestBed.flushEffects();
    expect(html.getAttribute('data-slotted-theme')).toBe('nexora-precise');
    expect(html.getAttribute('data-slotted-scheme')).toBe('dark');
    expect(html.getAttribute('data-slotted-density')).toBe('compact');
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#e11d48');
    expect(prefs.preferences().theme).toBe('default');

    prefs.preview(null);
    TestBed.flushEffects();
    expect({
      theme: html.getAttribute('data-slotted-theme'),
      scheme: html.getAttribute('data-slotted-scheme'),
      density: html.getAttribute('data-slotted-density'),
      accent: html.style.getPropertyValue('--slotted-seed-accent'),
    }).toEqual(saved);
  });

  /**
   * A customized candidate compiles under `nexora-custom-draft` 200 ms after
   * the last change, and `html` names it once it is there: a burst of changes
   * — a slider dragged across its range — compiles once, with its last
   * value, and asking again for what is on the page compiles nothing.
   */
  it('compiles a burst of candidate changes once, with the last one, and html names it', async () => {
    const doc = TestBed.inject(DOCUMENT);
    const prefs = TestBed.inject(PreferencesStore);
    let compiled = 0;
    doc.addEventListener('slotted-themechange', (event) => {
      if ((event as CustomEvent<{ name: string }>).detail.name === 'nexora-custom-draft')
        compiled += 1;
    });
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const candidate = (radius: number) => ({
      ...appearanceOf(prefs.preferences()),
      theme: 'nexora-expressive',
      customization: { ...NO_CUSTOMISATION, radius },
    });

    for (let radius = 0; radius <= 18; radius += 2) {
      prefs.preview(candidate(radius));
      TestBed.flushEffects();
      await wait(10);
    }
    await wait(150);
    expect(compiled).toBe(0);

    await vi.waitFor(() => {
      TestBed.flushEffects();
      expect(doc.documentElement.getAttribute('data-slotted-theme')).toBe('nexora-custom-draft');
    });
    expect(compiled).toBe(1);
    const radius18 = { ...NO_CUSTOMISATION, radius: 18 };
    expect(prefs.compiledTheme('nexora-expressive', radius18)?.base?.['--slotted-radius-lg']).toBe(
      '18px',
    );
    expect(prefs.compiledTheme('nexora-precise', radius18)).toBeNull();

    prefs.preview(candidate(18));
    TestBed.flushEffects();
    await wait(400);
    expect(compiled).toBe(1);

    prefs.preview(null);
    TestBed.flushEffects();
    expect(doc.documentElement.getAttribute('data-slotted-theme')).toBe('default');
  });

  /**
   * A customized theme that does not compile is said, not swallowed: `html`
   * keeps the theme it shows, and a retry compiles it.
   */
  it('keeps html on the theme it shows while a customization does not compile, and retries', async () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    loadBuilder = () => Promise.reject(new Error('chunk'));
    prefs.update({ customization: { ...NO_CUSTOMISATION, cards: 'flat' } });
    TestBed.flushEffects();

    await vi.waitFor(() => expect(prefs.customFailed()).toBe(true));
    TestBed.flushEffects();
    expect(html.getAttribute('data-slotted-theme')).toBe('default');

    loadBuilder = builder;
    prefs.retryCustom();
    await vi.waitFor(() => {
      TestBed.flushEffects();
      expect(html.getAttribute('data-slotted-theme')).toBe('nexora-custom');
    });
    expect(prefs.customFailed()).toBe(false);
  });

  /**
   * A candidate that does not compile fails only while it is the candidate:
   * once it is dropped, the saved customization is what `html` names and no
   * failure is reported.
   */
  it('drops the failure of a candidate that does not compile once the candidate is cleared', async () => {
    const prefs = TestBed.inject(PreferencesStore);
    const html = TestBed.inject(DOCUMENT).documentElement;
    prefs.update({ customization: { ...NO_CUSTOMISATION, cards: 'flat' } });
    await vi.waitFor(() => {
      TestBed.flushEffects();
      expect(html.getAttribute('data-slotted-theme')).toBe('nexora-custom');
    });

    loadBuilder = () => Promise.reject(new Error('chunk'));
    prefs.preview({
      ...appearanceOf(prefs.preferences()),
      customization: { ...NO_CUSTOMISATION, cards: 'bordered' },
    });
    TestBed.flushEffects();
    await vi.waitFor(() => expect(prefs.customFailed()).toBe(true));

    prefs.preview(null);
    TestBed.flushEffects();
    expect(prefs.customFailed()).toBe(false);
    expect(html.getAttribute('data-slotted-theme')).toBe('nexora-custom');
  });

  /** A stored arrangement the catalogue no longer has falls back to the default. */
  it('reads an arrangement it does not know as the default', () => {
    const prefs = TestBed.inject(PreferencesStore);
    const userId = TestBed.inject(SessionStore).user()!.id;
    localStorage.setItem(`nexora:preferences:${userId}`, JSON.stringify({ shell: 'retired' }));
    prefs.update({});
    expect(prefs.preferences().shell).toBe('inset');
  });
});
