import { ApplicationInitStatus, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideTestBackend, resetTestBackend } from '../../../test/testing';
import { routes } from '../../app.routes';
import { PreferencesStore } from '../../core/session/preferences.store';
import { SessionStore } from '../../core/session/session.store';
import { CUSTOM_THEME_LOADER, type CustomThemeModule } from '../../core/theming/custom-sheet';
import { NO_CUSTOMISATION } from '../../core/theming/customisation';

/**
 * jsdom has no IntersectionObserver: this one records what each observer
 * watches and reports it in view only when a test calls `scrollIntoView()`.
 */
type Report = (entries: { isIntersecting: boolean; target: Element }[]) => void;
const observers = new Set<{ readonly report: Report; readonly targets: Set<Element> }>();
globalThis.IntersectionObserver = class {
  readonly targets = new Set<Element>();
  constructor(readonly report: Report) {
    observers.add(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
} as unknown as typeof IntersectionObserver;
const scrollIntoView = () => {
  for (const observer of [...observers]) {
    const entries = [...observer.targets].map((target) => ({ isIntersecting: true, target }));
    if (entries.length > 0) observer.report(entries);
  }
};

/** The builder's module as the store loads it; a test swaps it for one that fails. */
const builder = (): Promise<CustomThemeModule> => import('../../core/theming/custom-theme');
let loadBuilder = builder;

describe('PreferencesPage › Appearance', () => {
  beforeEach(async () => {
    loadBuilder = builder;
    TestBed.configureTestingModule({
      providers: [
        provideTestBackend(),
        provideRouter(routes),
        { provide: CUSTOM_THEME_LOADER, useValue: () => loadBuilder() },
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    await resetTestBackend();
    await TestBed.inject(SessionStore).load();
  });

  /** Polls `ready`, running change detection between reads; fails after `ms`. */
  async function until(
    harness: RouterTestingHarness,
    ready: () => boolean,
    ms = 5000,
  ): Promise<void> {
    const end = Date.now() + ms;
    for (;;) {
      harness.detectChanges();
      if (ready()) return;
      if (Date.now() > end) throw new Error('the condition did not hold in time');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const ratios = (root: HTMLElement) =>
    root.querySelectorAll('[data-contrast] [data-ratio]').length;
  const counts = (root: HTMLElement) => root.querySelectorAll('[data-anatomy] [data-count]').length;

  /** Opens the page and waits for the runtime sheets and the contrast readings the section asks for. */
  async function open(): Promise<{ harness: RouterTestingHarness; root: HTMLElement }> {
    const harness = await RouterTestingHarness.create('/settings/preferences');
    const root = harness.fixture.nativeElement as HTMLElement;
    await TestBed.inject(PreferencesStore).useThemes();
    await until(harness, () => ratios(root) === 21 && counts(root) === 9);
    return { harness, root };
  }

  const choose = (root: HTMLElement, name: string, value: string) => {
    const input = root.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
    expect(input, `${name}=${value}`).not.toBeNull();
    input!.click();
  };

  /** What `html` answers: the theme, the scheme, the density and the seeds it carries. */
  const page = () => {
    const html = TestBed.inject(DOCUMENT).documentElement;
    return {
      theme: html.getAttribute('data-slotted-theme'),
      scheme: html.getAttribute('data-slotted-scheme'),
      density: html.getAttribute('data-slotted-density'),
      accent: html.style.getPropertyValue('--slotted-seed-accent'),
      neutral: html.style.getPropertyValue('--slotted-seed-neutral'),
    };
  };
  const button = (root: HTMLElement, text: string) =>
    [...root.querySelectorAll('button')].find((button) => button.textContent?.trim() === text)!;

  /**
   * The application is the preview: a choice draws the whole of it at once,
   * nothing is saved before Save, and Discard returns the application to the
   * saved appearance.
   */
  it('draws the application in the candidate at once, and Discard returns it to the saved one', async () => {
    const { harness, root } = await open();
    const saved = page();
    expect(saved).toMatchObject({ theme: 'default', density: 'comfortable', accent: '#7c3aed' });

    choose(root, 'theme', 'nexora-corporate');
    choose(root, 'brand', 'amber');
    choose(root, 'neutral', 'clay');
    choose(root, 'density', 'compact');
    harness.detectChanges();
    TestBed.flushEffects();
    expect(page()).toMatchObject({
      theme: 'nexora-corporate',
      density: 'compact',
      accent: '#d97706',
      neutral: '#9c6644',
    });
    expect(TestBed.inject(PreferencesStore).preferences().theme).toBe('default');

    button(root, 'Discard').click();
    harness.detectChanges();
    TestBed.flushEffects();
    expect(page()).toEqual(saved);
  });

  /** Leaving the page with a candidate unsaved draws the application as it was saved. */
  it('returns the application to the saved appearance when the page is left', async () => {
    const { harness, root } = await open();
    const saved = page();
    choose(root, 'theme', 'nexora-precise');
    choose(root, 'scheme', 'dark');
    harness.detectChanges();
    TestBed.flushEffects();
    expect(page()).toMatchObject({ theme: 'nexora-precise', scheme: 'dark' });

    await harness.navigateByUrl('/dashboard');
    TestBed.flushEffects();
    expect(page()).toEqual(saved);
  });

  const samples = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLElement>('[data-theme-sample]')].map((sample) => ({
      theme: sample.getAttribute('data-slotted-theme'),
      reserved: sample.classList.contains('reserved'),
    }));
  const painted = (root: HTMLElement) =>
    root.querySelectorAll('[data-appearance] [data-ui=skeleton][data-loading]').length;

  /**
   * AF-05: the region's placeholders are painted from the first frame, even
   * when every definition is already at hand; the application's minimum
   * (AF-06) then holds them.
   */
  it('paints its placeholders from the first frame', async () => {
    await TestBed.inject(PreferencesStore).useThemes();
    await import('../../core/theming/contrast-reading');
    const harness = await RouterTestingHarness.create('/settings/preferences');
    const root = harness.fixture.nativeElement as HTMLElement;
    const region = () => root.querySelector<HTMLElement>('[data-appearance]')!;
    harness.detectChanges();

    expect(region().getAttribute('aria-busy')).toBe('true');
    expect(painted(root)).toBeGreaterThan(0);
    expect(samples(root).some((sample) => sample.reserved)).toBe(false);

    await until(harness, () => !region().hasAttribute('aria-busy'), 2000);
    expect(painted(root)).toBe(0);
    expect(ratios(root)).toBe(21);
  });

  /**
   * A longer wait is one busy skeleton region for as long as it lasts: the
   * samples are drawn in `default` under their placeholders, and the contrast
   * cells hold theirs. Then the themes land.
   */
  it('keeps one skeleton region over a wait longer than the minimum', async () => {
    const store = TestBed.inject(PreferencesStore);
    const load = store.useThemes.bind(store);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const held = vi
      .spyOn(store, 'useThemes')
      .mockImplementation((ids) => gate.then(() => load(ids)));
    const harness = await RouterTestingHarness.create('/settings/preferences');
    const root = harness.fixture.nativeElement as HTMLElement;
    const region = () => root.querySelector<HTMLElement>('[data-appearance]')!;
    harness.detectChanges();

    expect(region().getAttribute('aria-busy')).toBe('true');
    expect(
      TestBed.inject(DOCUMENT).head.querySelectorAll('style[data-slotted-theme-sheet]'),
    ).toHaveLength(0);
    expect(samples(root).map((sample) => sample.theme)).toEqual([
      'default',
      'default',
      'default',
      'default',
      'default',
    ]);
    expect(samples(root).some((sample) => sample.reserved)).toBe(false);
    expect(root.querySelectorAll('[data-contrast] [data-ui=skeleton][data-loading]')).toHaveLength(
      21,
    );
    expect(root.querySelectorAll('[data-anatomy] [data-ui=skeleton][data-loading]')).toHaveLength(
      18,
    );

    await wait(500);
    harness.detectChanges();
    expect(region().getAttribute('aria-busy')).toBe('true');

    release();
    await until(harness, () => !region().hasAttribute('aria-busy'), 2000);
    held.mockRestore();

    expect(painted(root)).toBe(0);
    expect(ratios(root)).toBe(21);
    expect(counts(root)).toBe(9);
    expect(samples(root).map((sample) => sample.theme)).toEqual([
      'default',
      'nexora-precise',
      'nexora-editorial',
      'nexora-corporate',
      'nexora-expressive',
    ]);
  });

  /**
   * A theme whose sheet never arrives is not drawn in `default` in its place:
   * with no placeholder over them, the swatches keep their boxes and draw
   * nothing, and `html` keeps the theme it shows.
   */
  it('draws nothing in place of a theme whose sheet did not load', async () => {
    const store = TestBed.inject(PreferencesStore);
    store.update({ theme: 'nexora-corporate' });
    const load = vi.spyOn(store, 'useThemes').mockRejectedValue(new Error('chunk'));
    const harness = await RouterTestingHarness.create('/settings/preferences');
    const root = harness.fixture.nativeElement as HTMLElement;
    await until(harness, () => root.querySelector('[data-themes-failed]') !== null);

    expect(
      [...root.querySelectorAll('.swatch')].every((swatch) =>
        swatch.classList.contains('reserved'),
      ),
    ).toBe(true);
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('data-slotted-theme')).toBe(
      'default',
    );
    load.mockRestore();
  });

  /** A load that fails is said once, with a way to try again; the themes it could not draw cannot be chosen. */
  it('offers a retry when the theme definitions do not arrive', async () => {
    const store = TestBed.inject(PreferencesStore);
    const load = vi.spyOn(store, 'useThemes').mockRejectedValueOnce(new Error('chunk'));
    const harness = await RouterTestingHarness.create('/settings/preferences');
    const root = harness.fixture.nativeElement as HTMLElement;
    await until(harness, () => root.querySelector('[data-themes-failed]') !== null);

    expect(root.querySelector('[data-contrast]')).toBeNull();
    expect(root.querySelector('[data-anatomy]')).toBeNull();
    expect(root.querySelector('[data-appearance]')!.hasAttribute('aria-busy')).toBe(false);
    const disabled = [...root.querySelectorAll<HTMLInputElement>('input[name="theme"]')]
      .filter((input) => input.disabled)
      .map((input) => input.value);
    expect(disabled).toEqual([
      'nexora-precise',
      'nexora-editorial',
      'nexora-corporate',
      'nexora-expressive',
    ]);
    /* A theme that cannot be drawn keeps the card's anatomy: its sample box holds a placeholder. */
    const cards = [...root.querySelectorAll<HTMLInputElement>('input[name="theme"]')].map((input) =>
      input.closest('[data-part=item]')!,
    );
    expect(cards.map((card) => card.querySelectorAll('.sample-box > .sample').length)).toEqual([
      1, 1, 1, 1, 1,
    ]);
    expect(cards.filter((card) => card.querySelector('.sample[data-missing]'))).toHaveLength(4);

    load.mockRestore();
    const retry = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Try again',
    );
    retry!.click();
    await until(harness, () => ratios(root) === 21);

    expect(root.querySelector('[data-themes-failed]')).toBeNull();
    expect(
      [...root.querySelectorAll<HTMLInputElement>('input[name="theme"]')].some(
        (input) => input.disabled,
      ),
    ).toBe(false);
  });

  it('saves a brand preset into the store, which writes it onto html', async () => {
    const { harness, root } = await open();
    const html = TestBed.inject(DOCUMENT).documentElement;

    choose(root, 'brand', 'emerald');
    choose(root, 'theme', 'nexora-expressive');
    harness.detectChanges();
    const save = [...root.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Save preferences',
    );
    save!.click();
    harness.detectChanges();
    TestBed.flushEffects();

    const preferences = TestBed.inject(PreferencesStore).preferences();
    expect(preferences.brand.preset).toBe('emerald');
    expect(preferences.theme).toBe('nexora-expressive');
    expect(html.getAttribute('data-slotted-theme')).toBe('nexora-expressive');
    expect(html.style.getPropertyValue('--slotted-seed-accent')).toBe('#059669');
  });

  const typeColour = (root: HTMLElement, value: string, field = '[data-brand-custom]') => {
    const input = root.querySelector<HTMLInputElement>(`${field} input`);
    expect(input).not.toBeNull();
    input!.value = value;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  };
  const checkedBrand = (root: HTMLElement) =>
    root.querySelector<HTMLInputElement>('input[name="brand"]:checked')?.value;

  /** The reader's own colour is a candidate like a preset, and choosing it selects Custom. */
  it('takes a custom colour from the colour field', async () => {
    const { harness, root } = await open();
    typeColour(root, '#0f766e');
    harness.detectChanges();

    TestBed.flushEffects();
    expect(page().accent).toBe('#0f766e');
    expect(checkedBrand(root)).toBe('custom');
  });

  /** A colour typed that is a preset's own chooses the preset, and the custom colour stays as it was. */
  it('chooses the preset a typed colour equals', async () => {
    const { harness, root } = await open();
    typeColour(root, '#E11D48');
    harness.detectChanges();

    TestBed.flushEffects();
    expect(checkedBrand(root)).toBe('rose');
    expect(page().accent).toBe('#e11d48');
    choose(root, 'brand', 'custom');
    harness.detectChanges();
    TestBed.flushEffects();
    expect(page().accent).toBe('#7c3aed');
  });

  /** The grey takes any colour too: typed, it becomes the neutral seed, and Custom is chosen. */
  it('takes a custom grey from its colour field', async () => {
    const { harness, root } = await open();
    typeColour(root, '#336699', '[data-neutral-custom]');
    harness.detectChanges();
    TestBed.flushEffects();

    expect(page().neutral).toBe('#336699');
    expect(root.querySelector<HTMLInputElement>('input[name="neutral"]:checked')?.value).toBe(
      'custom',
    );
    choose(root, 'neutral', 'ocean');
    harness.detectChanges();
    TestBed.flushEffects();
    expect(page().neutral).toBe('#0e7490');
  });

  it('reads the contrast of the candidate seeds in the three schemes', async () => {
    const { harness, root } = await open();
    const table = root.querySelector('[data-contrast]');
    expect(table).not.toBeNull();
    const before = table!.textContent;
    expect(before).toMatch(/Text on solid/);
    expect(before).toMatch(/\d+\.\d{2}:1/);

    choose(root, 'brand', 'amber');
    harness.detectChanges();
    expect(root.querySelector('[data-contrast]')!.textContent).not.toBe(before);
  });

  /** A theme card and a swatch are regions naming the draft's scheme, as `html` does. */
  it('draws the theme cards, the swatches and the application in the candidate scheme', async () => {
    const { harness, root } = await open();
    const schemes = () =>
      [...root.querySelectorAll<HTMLElement>('[data-theme-sample], .swatch')].map((sample) =>
        sample.getAttribute('data-slotted-scheme'),
      );
    expect(new Set(schemes())).toEqual(new Set(['system']));

    choose(root, 'scheme', 'dark');
    harness.detectChanges();
    TestBed.flushEffects();
    expect(new Set(schemes())).toEqual(new Set(['dark']));
    expect(page().scheme).toBe('dark');
  });

  const GROUPS = [
    'theme',
    'brand',
    'neutral',
    'font-body',
    'font-heading',
    'axis-scale',
    'axis-border',
    'axis-shadow',
    'axis-motion',
    'axis-cards',
    'axis-tabs',
    'axis-chart',
    'axis-input',
    'axis-focus',
    'axis-button',
    'axis-controlRadius',
    'axis-cardRadius',
    'axis-overlayRadius',
    'axis-controlBorder',
    'axis-labelWeight',
    'axis-labelSpacing',
    'axis-controlText',
    'axis-controlHeight',
  ];
  const label = (root: HTMLElement, input: HTMLInputElement) =>
    root.querySelector<HTMLElement>(`label[for="${input.id}"]`)!;
  const optionLabels = (root: HTMLElement, name: string) =>
    [...root.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)].map((input) =>
      [...label(root, input).querySelectorAll('.tile-label')]
        .map((text) => text.textContent!.trim())
        .join(' · '),
    );

  /**
   * Every choice is a tile in a grid of one track width and one row height,
   * and the track is stated in characters from the group's longest label: a
   * card never takes its size from its own words.
   */
  it('arranges every group of choices as tiles of one track, sized by its longest label', async () => {
    const { root } = await open();
    expect(root.querySelector('[data-appearance] [data-ui=segmented-control]')).toBeNull();
    for (const name of GROUPS) {
      const inputs = [...root.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
      const items = inputs.map((input) => input.closest<HTMLElement>('[data-part=item]')!);
      const grid = items[0]!.parentElement!;
      expect(grid.classList.contains('choices'), name).toBe(true);
      expect(
        items.every((item) => item.parentElement === grid),
        name,
      ).toBe(true);
      expect(grid.closest('[data-ui=radio-group]')!.getAttribute('data-variant'), name).toBe(
        'tile',
      );
      const texts = items.flatMap((item) =>
        [...item.querySelectorAll('.tile-label')].map((text) => text.textContent!.trim()),
      );
      expect(texts.length, name).toBeGreaterThanOrEqual(items.length);
      const longest = Number(grid.style.getPropertyValue('--longest'));
      expect(Math.max(...texts.map((text) => text.length)), name).toBeLessThanOrEqual(longest);
    }
  });

  /** A builder value is named in full words, never abbreviated to fit a segment. */
  it('names every builder value in full', async () => {
    const { root } = await open();
    expect(optionLabels(root, 'axis-shadow')).toEqual(['Theme', 'None', 'Soft', 'Strong']);
    expect(optionLabels(root, 'axis-motion')).toEqual(['Theme', 'Full', 'Reduced', 'Off']);
    expect(optionLabels(root, 'axis-cards')).toEqual(['Theme', 'Bordered', 'Elevated', 'Flat']);
    expect(optionLabels(root, 'axis-tabs')).toEqual(['Theme', 'Underline', 'Pill']);
    expect(optionLabels(root, 'axis-chart')).toEqual(['Theme', 'Palette', 'Accent']);
    expect(optionLabels(root, 'axis-input')).toEqual([
      'Theme',
      'Outlined',
      'Filled',
      'Underline',
      'Borderless',
    ]);
    expect(optionLabels(root, 'axis-focus')).toEqual([
      'Theme',
      'Ring',
      'Glow',
      'Underline',
      'Offset',
    ]);
    expect(optionLabels(root, 'axis-button')).toEqual([
      'Theme',
      'Solid',
      'Soft',
      'Outline',
      'Ghost',
    ]);
    expect(optionLabels(root, 'axis-controlRadius')).toEqual([
      'Theme',
      '0 px',
      '4 px',
      '8 px',
      '12 px',
      'Pill',
    ]);
    expect(optionLabels(root, 'axis-controlBorder')).toEqual(['Theme', 'Thin', 'Thick']);
    expect(optionLabels(root, 'axis-labelWeight')).toEqual([
      'Theme',
      'Regular',
      'Medium',
      'Semibold',
      'Bold',
    ]);
    expect(optionLabels(root, 'axis-controlHeight')).toEqual(['Theme', '−4 px', '+4 px', '+8 px']);
  });

  /**
   * A specimen downloads its face: it names the face once its card reaches
   * the viewport, and until then its box stays empty.
   */
  it('draws the font specimens only once they reach the viewport', async () => {
    const { harness, root } = await open();
    const specimens = () => root.querySelectorAll('.specimen');
    const drawn = () => root.querySelectorAll('.specimen[style*="font-family"]');
    expect(specimens()).toHaveLength(18);
    expect(drawn()).toHaveLength(0);

    scrollIntoView();
    await until(harness, () => drawn().length === 18);
    expect(specimens()).toHaveLength(18);
    expect(root.querySelectorAll('[data-specimen]')).toHaveLength(16);
  });

  /** A card's sample is decoration: the radio is named by the theme's name alone. */
  it('names each theme card by its label, not by its sample', async () => {
    const { root } = await open();
    const labels = [...root.querySelectorAll<HTMLInputElement>('input[name="theme"]')].map(
      (input) => {
        const label = root.querySelector<HTMLElement>(`label[for="${input.id}"]`)!;
        const sample = label.querySelector('[data-theme-sample]');
        expect(sample?.getAttribute('aria-hidden'), input.value).toBe('true');
        const named = label.cloneNode(true) as HTMLElement;
        named.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
        return named.textContent?.trim();
      },
    );
    expect(labels).toEqual(['Standard', 'Precise', 'Editorial', 'Corporate', 'Expressive']);
  });

  /**
   * A change in the builder is a candidate like any other: once the changes
   * pause, the candidate is compiled into its own theme, which `html` names
   * before anything is saved; Reset brings the theme back as it came.
   */
  it('compiles the builder’s changes into the theme html names, and resets them', async () => {
    const { harness, root } = await open();
    choose(root, 'theme', 'nexora-editorial');
    harness.detectChanges();
    choose(root, 'axis-cards', 'flat');
    harness.detectChanges();
    choose(root, 'font-body', 'jetbrains-mono');
    harness.detectChanges();

    await until(harness, () => page().theme === 'nexora-custom-draft', 8000);
    const sheet = TestBed.inject(DOCUMENT).head.querySelector(
      'style[data-slotted-theme-sheet="nexora-custom-draft"]',
    )!.textContent!;
    expect(sheet.match(/--slotted-card-background: [^;]+/g)).toEqual([
      '--slotted-card-background: var(--slotted-surface-sunken)',
    ]);
    expect(sheet).toContain("--slotted-font-family-sans: 'JetBrains Mono Variable'");
    expect(root.querySelector('[data-changes]')!.textContent!.trim()).toBe('2 changes');
    expect(root.querySelector('[data-anatomy] caption')!.textContent).toContain(
      'Editorial, customised',
    );
    expect(TestBed.inject(PreferencesStore).preferences().customisation).toEqual(NO_CUSTOMISATION);

    (root.querySelector('[data-reset]') as HTMLButtonElement).click();
    harness.detectChanges();
    TestBed.flushEffects();
    expect(page().theme).toBe('nexora-editorial');
    expect(root.querySelector('[data-changes]')).toBeNull();
    expect(
      root.querySelector<HTMLInputElement>('input[name="axis-cards"][value="theme"]')!.checked,
    ).toBe(true);
  });

  /**
   * A saved customisation is part of the opening wait: the region stays busy
   * until its theme is compiled. A change made afterwards is no wait — the
   * application keeps what it shows until the new candidate lands.
   */
  it('waits on opening for a saved customisation, and never for a later change', async () => {
    const store = TestBed.inject(PreferencesStore);
    store.update({ customisation: { ...NO_CUSTOMISATION, cards: 'elevated' } });
    const harness = await RouterTestingHarness.create('/settings/preferences');
    const root = harness.fixture.nativeElement as HTMLElement;
    const region = () => root.querySelector<HTMLElement>('[data-appearance]')!;
    harness.detectChanges();
    expect(region().getAttribute('aria-busy')).toBe('true');

    await until(harness, () => !region().hasAttribute('aria-busy'), 5000);
    expect(page().theme).toBe('nexora-custom');

    choose(root, 'axis-motion', 'off');
    harness.detectChanges();
    TestBed.flushEffects();
    expect(region().hasAttribute('aria-busy')).toBe(false);
    expect(page().theme).toBe('nexora-custom');
    await until(harness, () => page().theme === 'nexora-custom-draft', 8000);
  });

  /** The corner has a way back to the theme's own of its own, and the other changes stay. */
  it('returns the corner to the theme’s own without resetting the rest', async () => {
    const { harness, root } = await open();
    choose(root, 'axis-shadow', 'none');
    harness.detectChanges();
    const thumb = root.querySelector<HTMLInputElement>('[data-axis=radius] input[type=range]')!;
    thumb.focus();
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    harness.detectChanges();
    const draft = () =>
      harness.fixture.debugElement
        .query((node) => node.name === 'app-appearance-section')!
        .componentInstance.draft().customisation;
    expect(draft()).toMatchObject({ radius: 10, shadow: 'none' });
    expect(root.querySelector('[data-radius-value]')!.textContent).toMatch(/10 px .*yours/);

    button(root, 'Use the theme’s').click();
    harness.detectChanges();
    expect(draft()).toMatchObject({ radius: null, shadow: 'none' });
    expect(root.querySelector('[data-radius-value]')!.textContent).toMatch(/8 px .*Standard’s own/);
    expect(root.querySelector('[data-radius-value] button')).toBeNull();
  });

  /**
   * A customisation that does not compile is an error state of its own: it
   * says so once, offers a retry, and the application stays in the theme it
   * shows; the retry compiles it.
   */
  it('says when a customised theme does not compile, and compiles it on retry', async () => {
    loadBuilder = () => Promise.reject(new Error('chunk'));
    TestBed.inject(PreferencesStore).update({
      customisation: { ...NO_CUSTOMISATION, cards: 'flat' },
    });
    const harness = await RouterTestingHarness.create('/settings/preferences');
    const root = harness.fixture.nativeElement as HTMLElement;
    const alert = () => root.querySelector<HTMLElement>('[data-custom-failed]');
    await until(harness, () => alert() !== null);

    expect(alert()!.textContent).toContain('did not compile');
    expect(page().theme).toBe('default');
    expect(root.querySelector('[data-appearance]')!.hasAttribute('aria-busy')).toBe(false);

    loadBuilder = builder;
    alert()!.querySelector('button')!.click();
    await until(harness, () => page().theme === 'nexora-custom' && alert() === null);
  });

  /** The anatomy is the chosen theme object's, layer by layer. */
  it('reads the anatomy of the chosen theme', async () => {
    const { harness, root } = await open();
    const row = (layer: string) => ({
      count: Number(root.querySelector(`[data-layer="${layer}"] [data-count]`)!.textContent),
      entries: root.querySelector(`[data-layer="${layer}"] [data-entries]`)!.textContent!,
    });
    expect(row('components').count).toBe(0);
    expect(root.querySelector('[data-anatomy]')!.hasAttribute('data-striped')).toBe(true);
    expect(row('seeds').entries).toContain('accent #1d4ed8');

    choose(root, 'theme', 'nexora-corporate');
    harness.detectChanges();
    expect(root.querySelectorAll('[data-anatomy] [data-layer]')).toHaveLength(9);
    expect(row('seeds').entries).toContain('accent #0c66e4');
    expect(row('components').count).toBeGreaterThanOrEqual(15);
    expect(row('rules').count).toBeGreaterThanOrEqual(1);
    expect(row('fonts').entries).toBe('Source Sans 3 Variable');
    expect(root.querySelector('[data-change-anatomy]')).toBeNull();
  });

  /**
   * The Controls section: each axis on its own, a candidate like any other
   * change — the application is drawn in it before Save, Save keeps it, and
   * Reset controls returns the Controls axes alone to the theme's own. The
   * anatomy lists each change with the layers of the model it writes.
   */
  it('sets each Controls axis on its own, lists it by layer, and resets the Controls alone', async () => {
    const { harness, root } = await open();
    const store = TestBed.inject(PreferencesStore);
    choose(root, 'axis-shadow', 'none');
    harness.detectChanges();
    choose(root, 'axis-input', 'underline');
    harness.detectChanges();
    choose(root, 'axis-focus', 'glow');
    harness.detectChanges();
    choose(root, 'axis-button', 'soft');
    harness.detectChanges();
    choose(root, 'axis-controlRadius', '9999');
    harness.detectChanges();
    choose(root, 'axis-controlHeight', '-4');
    harness.detectChanges();
    choose(root, 'axis-labelWeight', '700');
    harness.detectChanges();

    await until(harness, () => page().theme === 'nexora-custom-draft', 8000);
    const sheet = TestBed.inject(DOCUMENT).head.querySelector(
      'style[data-slotted-theme-sheet="nexora-custom-draft"]',
    )!.textContent!;
    expect(sheet).toContain('--slotted-text-field-background: transparent');
    expect(sheet).toContain('--slotted-control-radius: var(--slotted-radius-full)');
    expect(sheet).toContain('--slotted-control-height-md: 30px');
    expect(sheet).toContain(
      '0 0 0 4px color-mix(in oklab, var(--slotted-focus-ring-color) 28%, transparent)',
    );
    expect(root.querySelector('[data-changes]')!.textContent!.trim()).toBe('7 changes');

    const layers = (axis: string) =>
      root
        .querySelector(`[data-change-anatomy] [data-change="${axis}"] [data-layers]`)!
        .textContent!.trim();
    await until(harness, () => root.querySelector('[data-change-anatomy]') !== null);
    expect(layers('input')).toBe('Components · 36, Rules · 2');
    expect(layers('focus')).toBe('Scales · 2, Rules · 3');
    expect(layers('button')).toBe('Rules · 1');
    expect(layers('controlRadius')).toBe('Scales · 1, Components · 11');
    expect(layers('controlHeight')).toBe('Densities · 9');
    expect(layers('labelWeight')).toBe('Scales · 1');
    expect(layers('shadow')).toBe('Schemes · 10');

    button(root, 'Save preferences').click();
    harness.detectChanges();
    expect(store.preferences().customisation).toMatchObject({
      shadow: 'none',
      input: 'underline',
      focus: 'glow',
      button: 'soft',
      controlRadius: 9999,
      controlHeight: -4,
      labelWeight: 700,
    });

    (root.querySelector('[data-reset-controls]') as HTMLButtonElement).click();
    harness.detectChanges();
    const draft = harness.fixture.debugElement
      .query((node) => node.name === 'app-appearance-section')!
      .componentInstance.draft().customisation;
    expect(draft).toEqual({ ...NO_CUSTOMISATION, shadow: 'none' });
    expect(
      root.querySelector<HTMLInputElement>('input[name="axis-input"][value="theme"]')!.checked,
    ).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('[data-reset-controls]')!.disabled).toBe(true);
  });

  /** A Controls tile draws its style; the "Theme" tile draws the theme's own. */
  it('draws each field, focus and button style in its tile, and the theme’s own on Theme', async () => {
    const { harness, root } = await open();
    const styles = (axis: string) =>
      [...root.querySelectorAll(`[data-axis="${axis}"] .control-specimen`)].map((specimen) =>
        specimen.getAttribute('data-style'),
      );
    expect(styles('input')).toEqual(['outlined', 'outlined', 'filled', 'underline', 'borderless']);
    expect(styles('focus')).toEqual(['ring', 'ring', 'glow', 'underline', 'offset']);
    expect(styles('button')).toEqual(['solid', 'solid', 'soft', 'outline', 'ghost']);
    choose(root, 'theme', 'nexora-editorial');
    harness.detectChanges();
    expect(styles('input')[0]).toBe('underline');
    expect(styles('focus')[0]).toBe('underline');
    expect(styles('button')[0]).toBe('outline');
    expect(
      [...root.querySelectorAll('[data-axis] .control-stage')].every(
        (stage) => stage.getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true);
  });

  /** Save keeps the builder's changes, and `html` names the saved compiled theme. */
  it('saves a customisation, which html names once it is compiled', async () => {
    const { harness, root } = await open();
    const html = TestBed.inject(DOCUMENT).documentElement;
    choose(root, 'axis-shadow', 'strong');
    harness.detectChanges();
    button(root, 'Save preferences').click();
    harness.detectChanges();

    expect(TestBed.inject(PreferencesStore).preferences().customisation.shadow).toBe('strong');
    await until(harness, () => html.getAttribute('data-slotted-theme') === 'nexora-custom', 3000);
  });

  /**
   * Each group of preferences is a section with its own heading, so the shell
   * layout and the notifications are not read as part of Appearance.
   */
  it('groups the preferences in three sections, each under its own heading', async () => {
    const { root } = await open();
    const sections = [...root.querySelectorAll<HTMLElement>('form [data-ui=section]')]
      .filter((section) => section.parentElement!.closest('[data-ui=section]') === null)
      .map((section) => section.querySelector('h2')?.textContent?.trim());
    expect(sections).toEqual(['Appearance', 'Workspace', 'Notifications']);

    const owner = (selector: string) =>
      root
        .querySelector(selector)!
        .closest('[data-ui=section]')!
        .querySelector('h2')!
        .textContent?.trim();
    expect(owner('input[name="theme"]')).toBe('Appearance');
    expect(owner('input[name="shell"]')).toBe('Workspace');
    expect(owner('[data-ui=checkbox]')).toBe('Notifications');
  });
});
