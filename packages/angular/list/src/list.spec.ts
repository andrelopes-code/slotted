import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SlListItem, SlListItemContent } from '@slotted/angular/list-item';

import { SlList } from './list';
import type { ListMarker, ListVariant } from './list-defaults';
import { provideListDefaults } from './list-defaults';
import {
  SlListEmpty,
  SlListSection,
  SlListSectionEnd,
  SlListSectionLabel,
  SlListSectionList,
} from './list-parts';

@Component({
  imports: [
    SlList,
    SlListEmpty,
    SlListItem,
    SlListItemContent,
    SlListSection,
    SlListSectionLabel,
    SlListSectionList,
  ],
  template: `
    <ul
      slList
      id="list"
      aria-label="Folders"
      [variant]="variant()"
      [marker]="marker()"
      [loading]="loading()"
    >
      <li slListSection id="section">
        <h3 slListSectionLabel id="section-label">Recent</h3>
        <ul slListSectionList id="section-list">
          <li slListItem id="row"><div slListItemContent id="content">Photos</div></li>
        </ul>
      </li>
      <li slListEmpty id="empty">No matches</li>
    </ul>

    <ol slList id="ordered" marker="number">
      <li slListItem id="ordered-row"><div slListItemContent>One</div></li>
    </ol>

    <ul slList id="menu" role="menu">
      <li slListItem><div slListItemContent>One</div></li>
    </ul>
  `,
})
class Host {
  readonly variant = signal<ListVariant | undefined>(undefined);
  readonly marker = signal<ListMarker | undefined>(undefined);
  readonly loading = signal(false);
}

const setup = (providers: unknown[] = []) => {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
};

const el = (fixture: ReturnType<typeof setup>, id: string) =>
  fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;

describe('SlList', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = setup();

    expect(el(fixture, 'list').getAttribute('data-ui')).toBe('list');
    expect(el(fixture, 'list').getAttribute('data-part')).toBe('root');
    expect(el(fixture, 'section').getAttribute('data-part')).toBe('section');
    expect(el(fixture, 'section-label').getAttribute('data-part')).toBe('section-label');
    expect(el(fixture, 'section-list').getAttribute('data-part')).toBe('section-list');
    expect(el(fixture, 'empty').getAttribute('data-part')).toBe('empty');
  });

  /**
   * The family draws its own marker, because a row is a content box beside its
   * independent targets and CSS has no `display` that is both `list-item` and a
   * grid. Safari and VoiceOver drop list semantics the moment CSS removes the
   * marker, so the role restores what the layout costs.
   */
  it('writes the role that survives its own marker being drawn in CSS', () => {
    const fixture = setup();

    expect(el(fixture, 'list').getAttribute('role')).toBe('list');
    expect(el(fixture, 'section-list').getAttribute('role')).toBe('list');
  });

  it('keeps a role the consumer wrote, because that is a decision about the page', () => {
    const fixture = setup();

    expect(el(fixture, 'menu').getAttribute('role')).toBe('menu');
  });

  /** The element carries the reading order; the axis carries the mark. */
  it('separates the element that carries order from the mark that is painted', () => {
    const fixture = setup();

    expect(el(fixture, 'ordered').tagName).toBe('OL');
    expect(el(fixture, 'ordered').getAttribute('data-marker')).toBe('number');
    expect(el(fixture, 'list').tagName).toBe('UL');
    expect(el(fixture, 'list').getAttribute('data-marker')).toBe('none');
  });

  /** The group's heading names its own nested list, so a reader knows where they are. */
  it('names a nested group by the heading above it', () => {
    const fixture = setup();

    expect(el(fixture, 'section-list').getAttribute('aria-labelledby')).toBe('section-label');
  });

  it('generates a stable heading id when the page wrote none', () => {
    @Component({
      imports: [SlList, SlListSection, SlListSectionLabel, SlListSectionList],
      template: `
        <ul slList>
          <li slListSection>
            <h3 slListSectionLabel id="named">Recent</h3>
            <ul slListSectionList id="unnamed-list"></ul>
          </li>
        </ul>
      `,
    })
    class Named {}

    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(Named);
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('#unnamed-list') as HTMLElement;
    expect(list.getAttribute('aria-labelledby')).toBe('named');
  });

  /**
   * ARIA 1.2 §5.2.6 requires `aria-busy` on a container whose required owned
   * elements have not arrived. That is the whole of `loading`.
   */
  it('marks a set that is still filling', () => {
    const fixture = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(el(fixture, 'list').getAttribute('aria-busy')).toBe('true');
    expect(el(fixture, 'list').getAttribute('data-loading')).toBe('');
  });

  it('lets an application set its lists once, and lets a list still win', () => {
    const fixture = setup([
      provideListDefaults({ marker: 'bullet', size: 'lg', variant: 'ruled' }),
    ]);

    expect(el(fixture, 'list').getAttribute('data-variant')).toBe('ruled');
    expect(el(fixture, 'list').getAttribute('data-size')).toBe('lg');
    expect(el(fixture, 'list').getAttribute('data-marker')).toBe('bullet');

    fixture.componentInstance.variant.set('framed');
    fixture.detectChanges();
    expect(el(fixture, 'list').getAttribute('data-variant')).toBe('framed');
  });

  /** The set hands rows four values, and a row that states one still wins. */
  it('hands each row what the set decided', () => {
    const fixture = setup();
    fixture.componentInstance.variant.set('ruled');
    fixture.componentInstance.marker.set('bullet');
    fixture.detectChanges();

    expect(el(fixture, 'row').getAttribute('data-variant')).toBe('ruled');
    expect(el(fixture, 'row').getAttribute('data-marker')).toBe('bullet');
  });
});

@Component({
  standalone: true,
  imports: [SlList, SlListSection, SlListSectionLabel, SlListSectionList, SlListSectionEnd],
  template: `<ul slList aria-label="Transactions">
    <li slListSection>
      <h3 slListSectionLabel variant="ruled" sticky>Today<span slListSectionEnd>−$58.40</span></h3>
      <ul slListSectionList>
        <li>Mercado</li>
      </ul>
    </li>
  </ul>`,
})
class DaysHost {}

describe('a group heading with an end', () => {
  it('sets the name at the start and the end content after it, in the ruled variant', () => {
    TestBed.configureTestingModule({ imports: [DaysHost] });
    const fixture = TestBed.createComponent(DaysHost);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h3') as HTMLElement;
    expect(heading.getAttribute('data-part')).toBe('section-label');
    expect(heading.getAttribute('data-variant')).toBe('ruled');
    expect(heading.hasAttribute('data-sticky')).toBe(true);
    expect(heading.querySelector('[data-part="section-end"]')?.textContent).toBe('−$58.40');
  });
});
