import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SlHeadingLevel } from '@slotted/angular/typography';
import { SlSection } from './section';
import { provideSectionDefaults } from './section-defaults';
import {
  SlSectionActions,
  SlSectionBody,
  SlSectionDescription,
  SlSectionEyebrow,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTags,
  SlSectionTitle,
} from './section-parts';

const PARTS = [
  SlSection,
  SlSectionHeader,
  SlSectionTitle,
  SlSectionEyebrow,
  SlSectionHeading,
  SlSectionTags,
  SlSectionDescription,
  SlSectionActions,
  SlSectionBody,
];

@Component({
  standalone: true,
  imports: [...PARTS, SlHeadingLevel],
  template: `<div slHeadingLevel>
    <section
      slSection
      [size]="size()"
      [level]="level()"
      [ground]="ground()"
      [divider]="divider()"
      [sticky]="sticky()"
      id="frota"
    >
      <div slSectionHeader>
        <div slSectionTitle>
          <span slSectionEyebrow>18 vehicles</span>
          @if (heading()) {
            <div slSectionHeading>Fleet</div>
          }
          <div slSectionTags><span>In operation</span></div>
          <p slSectionDescription>Tractor units and trailers.</p>
        </div>
        <div slSectionActions><button type="button">Export</button></div>
      </div>
      <div slSectionBody>
        <section slSection>
          <div slSectionHeader>
            <div slSectionTitle><div slSectionHeading>Heavy vehicles</div></div>
          </div>
          <div slSectionBody>
            <section slSection>
              <div slSectionHeader>
                <div slSectionTitle><h4 slSectionHeading>Tractor units</h4></div>
              </div>
              <div slSectionBody>Scania R 450</div>
            </section>
          </div>
        </section>
      </div>
    </section>
  </div>`,
})
class Host {
  readonly size = signal<'sm' | 'md' | 'lg' | undefined>(undefined);
  readonly level = signal<'auto' | '1' | '2' | '3' | '4' | '5' | '6' | undefined>(undefined);
  readonly ground = signal<'none' | 'surface' | undefined>(undefined);
  readonly divider = signal<boolean | undefined>(undefined);
  readonly sticky = signal<boolean | undefined>(undefined);
  readonly heading = signal(true);
}

class FakeResizeObserver {
  static callbacks: ResizeObserverCallback[] = [];
  readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.callbacks.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** Every observer reports: the size one and the one that watches for the header being stuck. */
const fire = () =>
  FakeResizeObserver.callbacks.forEach((callback) => callback([], {} as ResizeObserver));

describe('SlSection', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const all = (selector: string) =>
    Array.from(fixture.nativeElement.querySelectorAll(selector)) as HTMLElement[];
  const root = () => all('[data-ui="section"]')[0] as HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('sticky header measurement', () => {
    beforeEach(() => {
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);
      FakeResizeObserver.callbacks = [];
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('writes the header height on the root while sticky, and follows a resize', () => {
      const header = root().querySelector(':scope > [data-part="header"]') as HTMLElement;
      const bounds = vi
        .spyOn(header, 'getBoundingClientRect')
        .mockReturnValue({ height: 48 } as DOMRect);
      host.sticky.set(true);
      fixture.detectChanges();
      expect(root().style.getPropertyValue('--slotted-section-header-size')).toBe('48px');

      bounds.mockReturnValue({ height: 72 } as DOMRect);
      fire();
      expect(root().style.getPropertyValue('--slotted-section-header-size')).toBe('72px');

      host.sticky.set(false);
      fixture.detectChanges();
      expect(root().style.getPropertyValue('--slotted-section-header-size')).toBe('');
    });
  });

  it('renders the anatomy the contract declares', () => {
    for (const part of [
      'root',
      'header',
      'title',
      'eyebrow',
      'heading',
      'tags',
      'description',
      'actions',
      'body',
    ]) {
      expect(root().querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root().tagName).toBe('SECTION');
    expect(root().id).toBe('frota');
  });

  /** A section with a heading is a region named by it. */
  it('is a region named by its heading, and nothing without one', () => {
    const heading = root().querySelector('[data-part="heading"]') as HTMLElement;
    expect(root().getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.id).toBe('frota-heading');
    host.heading.set(false);
    fixture.detectChanges();
    expect(root().hasAttribute('aria-labelledby')).toBe(false);
  });

  /** Tags sit beside the heading, outside it, so the region's name is the heading's alone. */
  it('keeps the tags out of the heading', () => {
    const tags = root().querySelector('[data-part="tags"]') as HTMLElement;
    expect(tags.hasAttribute('data-part-tags')).toBe(true);
    expect(tags.parentElement?.getAttribute('data-part')).toBe('title');
    expect(tags.previousElementSibling?.getAttribute('data-part')).toBe('heading');
    expect(root().querySelector('[data-part="heading"]')?.textContent?.trim()).toBe('Fleet');
  });

  /** The outline: h2 under one level, one deeper each time. */
  it('takes its rank from the outline and steps it for its body', () => {
    const headings = all('[data-part="heading"]');
    expect(headings[0]?.getAttribute('aria-level')).toBe('2');
    expect(headings[0]?.getAttribute('role')).toBe('heading');
    expect(headings[1]?.getAttribute('aria-level')).toBe('3');
    /* A native heading gets nothing added. */
    expect(headings[2]?.tagName).toBe('H4');
    expect(headings[2]?.hasAttribute('role')).toBe(false);
    expect(all('[data-ui="section"]').map((s) => s.getAttribute('data-level'))).toEqual([
      '2',
      '3',
      '4',
    ]);
  });

  it('takes the level the consumer states over the outline', () => {
    host.level.set('5');
    fixture.detectChanges();
    expect(root().getAttribute('data-level')).toBe('5');
    expect(root().querySelector('[data-part="heading"]')?.getAttribute('aria-level')).toBe('5');
  });

  it('writes its axes', () => {
    host.size.set('lg');
    host.ground.set('surface');
    host.divider.set(true);
    host.sticky.set(true);
    fixture.detectChanges();
    expect(root().getAttribute('data-size')).toBe('lg');
    expect(root().getAttribute('data-ground')).toBe('surface');
    expect(root().hasAttribute('data-divider')).toBe(true);
    expect(root().hasAttribute('data-sticky')).toBe(true);
  });
});

describe('SlSection defaults', () => {
  @Component({
    standalone: true,
    imports: [SlSection, SlSectionBody],
    providers: [
      provideSectionDefaults({ divider: true, ground: 'surface', size: 'sm', sticky: true }),
    ],
    template: `<section slSection size="lg"><div slSectionBody>x</div></section>`,
  })
  class Provided {}

  it('takes its defaults from the provider, and its own inputs over them', () => {
    const fixture = TestBed.createComponent(Provided);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('[data-ui="section"]') as HTMLElement;
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.getAttribute('data-ground')).toBe('surface');
    expect(root.hasAttribute('data-divider')).toBe(true);
    expect(root.hasAttribute('data-sticky')).toBe(true);
    /* No heading, no name, and a generated id. */
    expect(root.hasAttribute('aria-labelledby')).toBe(false);
    expect(root.id).toMatch(/^slotted-section-/);
  });
});

/** The stylesheet reaches the description as a child of the title; anywhere else development says so. */
describe('SlSectionDescription outside slSectionTitle', () => {
  @Component({
    imports: PARTS,
    template: `<section slSection>
      <div slSectionHeader><p slSectionDescription>Outside the title</p></div>
    </section>`,
  })
  class Misplaced {}

  @Component({
    imports: PARTS,
    template: `<section slSection>
      <div slSectionHeader>
        <div slSectionTitle><p slSectionDescription>In the title</p></div>
      </div>
    </section>`,
  })
  class Placed {}

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns in development when written in the header and not in the title', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.createComponent(Misplaced).detectChanges();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside slSectionTitle'));
  });

  it('is silent inside the title', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.createComponent(Placed).detectChanges();
    expect(warn).not.toHaveBeenCalled();
  });
});
