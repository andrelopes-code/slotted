import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SlHeading } from './heading';
import { SlHeadingLevel } from './heading-level';
import { SlText } from './text';
import type { TypographySize, TypographyTone } from './typography';

@Component({
  imports: [SlText],
  template: `
    <span slText id="plain">Invoices</span>
    <span slText id="decided" [size]="size()" [tone]="tone()" weight="medium" align="center">
      Invoices
    </span>
    <p slText id="paragraph" [truncate]="truncate()">
      The whole string stays, and only the picture is shorter.
    </p>
    <span slText id="native" aria-label="Total due" lang="en">1,204.50</span>
  `,
})
class TextHost {
  readonly size = signal<TypographySize | undefined>(undefined);
  readonly tone = signal<TypographyTone>('inherit');
  readonly truncate = signal<boolean | number | undefined>(undefined);
}

@Component({
  imports: [SlHeading, SlHeadingLevel],
  template: `
    <h1 slHeading id="page">Billing</h1>
    <section slHeadingLevel>
      <h2 slHeading id="section" [size]="size()">Invoices</h2>
      <section slHeadingLevel>
        <h3 slHeading id="subsection">History</h3>
      </section>
    </section>
  `,
})
class HeadingHost {
  readonly size = signal<TypographySize | undefined>(undefined);
}

@Component({
  imports: [SlHeading],
  template: `<h3 slHeading id="skipped">Skipped</h3>`,
})
class SkippedHost {}

@Component({
  imports: [SlHeading, SlHeadingLevel],
  template: `
    <section slHeadingLevel>
      <section slHeadingLevel>
        <h1 slHeading id="closing">Back to the top rank</h1>
        <h4 slHeading id="opening">One deeper than this section</h4>
      </section>
    </section>
  `,
})
class ClosingHost {}

function mount<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return { fixture, find: (id: string) => element.querySelector<HTMLElement>(`#${id}`)! };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SlText', () => {
  it('sets the family type on the element the consumer wrote', () => {
    const { find } = mount(TextHost);

    expect(find('plain').tagName).toBe('SPAN');
    expect(find('paragraph').tagName).toBe('P');
    expect(find('plain').getAttribute('data-ui')).toBe('typography');
    expect(find('plain').getAttribute('data-part')).toBe('root');
  });

  it('writes no axis the consumer did not decide', () => {
    const { find } = mount(TextHost);

    for (const axis of ['size', 'weight', 'tone', 'align', 'wrap', 'transform', 'numeric']) {
      expect(find('plain').getAttribute(`data-${axis}`)).toBeNull();
    }
  });

  it('states each axis the consumer decided', () => {
    const { fixture, find } = mount(TextHost);
    fixture.componentInstance.size.set('lg');
    fixture.componentInstance.tone.set('muted');
    fixture.detectChanges();

    expect(find('decided').getAttribute('data-size')).toBe('lg');
    expect(find('decided').getAttribute('data-tone')).toBe('muted');
    expect(find('decided').getAttribute('data-weight')).toBe('medium');
    expect(find('decided').getAttribute('data-align')).toBe('center');
  });

  it('treats an inherited tone as the absence of a color', () => {
    const { find } = mount(TextHost);

    expect(find('decided').getAttribute('data-tone')).toBeNull();
  });

  it('keeps the lines it was told to keep, and never fewer than one', () => {
    const { fixture, find } = mount(TextHost);
    const paragraph = find('paragraph');

    expect(paragraph.getAttribute('data-truncate')).toBeNull();

    fixture.componentInstance.truncate.set(true);
    fixture.detectChanges();
    expect(paragraph.getAttribute('data-truncate')).toBe('1');
    expect(paragraph.style.getPropertyValue('--slotted-typography-lines')).toBe('1');

    fixture.componentInstance.truncate.set(3);
    fixture.detectChanges();
    expect(paragraph.getAttribute('data-truncate')).toBe('3');
    expect(paragraph.style.getPropertyValue('--slotted-typography-lines')).toBe('3');

    fixture.componentInstance.truncate.set(0);
    fixture.detectChanges();
    expect(paragraph.getAttribute('data-truncate')).toBe('1');
  });

  it('leaves the whole string in the document when it truncates', () => {
    const { fixture, find } = mount(TextHost);
    fixture.componentInstance.truncate.set(1);
    fixture.detectChanges();

    expect(find('paragraph').textContent?.trim()).toBe(
      'The whole string stays, and only the picture is shorter.',
    );
  });

  it('leaves the attributes the element already had alone', () => {
    const { find } = mount(TextHost);

    expect(find('native').getAttribute('aria-label')).toBe('Total due');
    expect(find('native').getAttribute('lang')).toBe('en');
  });
});

describe('SlHeading', () => {
  it('takes its rank from the element, because that is where the platform keeps it', () => {
    const { find } = mount(HeadingHost);

    expect(find('page').tagName).toBe('H1');
    expect(find('section').tagName).toBe('H2');
    expect(find('subsection').tagName).toBe('H3');
  });

  it('reads at the size its rank implies', () => {
    const { find } = mount(HeadingHost);

    expect(find('page').getAttribute('data-size')).toBe('3xl');
    expect(find('section').getAttribute('data-size')).toBe('2xl');
    expect(find('subsection').getAttribute('data-size')).toBe('xl');
  });

  it('separates the rank from the size when the page needs them apart', () => {
    const { fixture, find } = mount(HeadingHost);
    fixture.componentInstance.size.set('md');
    fixture.detectChanges();

    expect(find('section').tagName).toBe('H2');
    expect(find('section').getAttribute('data-size')).toBe('md');
  });

  it('is balanced and emphasised unless the consumer says otherwise', () => {
    const { find } = mount(HeadingHost);

    expect(find('page').getAttribute('data-wrap')).toBe('balance');
    expect(find('page').getAttribute('data-weight')).toBe('semibold');
  });

  it('reports a rank that skips the outline instead of hiding it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(SkippedHost);

    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain('skips the outline');
  });

  it('says nothing when a heading closes sections rather than opening one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(ClosingHost);

    expect(warn).not.toHaveBeenCalled();
  });

  /**
   * `typography.css` sets the heading face on the heading element, because the
   * heading carries the same `data-ui` and `data-part` as a line of text.
   */
  it('is the element the stylesheet sets in the heading face, and text is not', () => {
    const face = "[data-ui='typography']:is(h1, h2, h3, h4, h5, h6)";
    const headings = mount(HeadingHost);
    const text = mount(TextHost);

    expect(headings.find('subsection').matches(face)).toBe(true);
    expect(text.find('paragraph').matches(face)).toBe(false);
  });
});
