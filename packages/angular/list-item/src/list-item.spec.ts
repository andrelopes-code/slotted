import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlList } from '@slotted/angular/list';

import { SlListItem } from './list-item';
import type { ListItemCurrent, ListItemTone } from './list-item-defaults';
import { provideListItemDefaults } from './list-item-defaults';
import { SlListItemContent } from './list-item-content';
import {
  SlListItemActions,
  SlListItemBody,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
  SlListItemStart,
} from './list-item-parts';

@Component({
  imports: [
    SlList,
    SlListItem,
    SlListItemActions,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlListItemStart,
  ],
  template: `
    <ul slList aria-label="Folders">
      <li
        slListItem
        id="row"
        [marker]="marker()"
        [tone]="tone()"
        [selected]="selected()"
        [current]="current()"
        [disabled]="disabled()"
        [loading]="loading()"
        [position]="position()"
        [setSize]="setSize()"
      >
        <div slListItemContent id="content">
          <span slListItemStart id="start"></span>
          <span slListItemBody id="body">
            <span slListItemLabel id="label">Photos</span>
            <span slListItemDescription id="description">128 files</span>
          </span>
          <span slListItemEnd id="end">Yesterday</span>
        </div>
        <span slListItemActions id="actions"><button type="button">Remove</button></span>
      </li>

      <li slListItem id="command-row" [disabled]="disabled()" [loading]="loading()">
        <button slListItemContent id="command" type="button">Publish</button>
      </li>

      <li slListItem id="link-row" [disabled]="disabled()">
        <a slListItemContent id="destination" href="/photos" (click)="onClick()">Photos</a>
      </li>
    </ul>
  `,
})
class Host {
  readonly marker = signal<'none' | 'bullet' | 'number' | undefined>(undefined);
  readonly tone = signal<ListItemTone | undefined>(undefined);
  readonly selected = signal(false);
  readonly current = signal<ListItemCurrent>(false);
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly position = signal<number | undefined>(undefined);
  readonly setSize = signal<number | undefined>(undefined);
  readonly onClick = vi.fn();
}

const setup = (providers: unknown[] = []) => {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
};

const el = (fixture: ReturnType<typeof setup>, id: string) =>
  fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;

describe('SlListItem', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = setup();

    expect(el(fixture, 'row').getAttribute('data-ui')).toBe('list-item');
    expect(el(fixture, 'row').getAttribute('data-part')).toBe('root');
    for (const part of ['content', 'start', 'body', 'label', 'description', 'end', 'actions']) {
      expect(el(fixture, part).getAttribute('data-part')).toBe(part);
    }
  });

  /** The bullet is the dot Glyph in a part of its own; the number stays text. */
  it('draws the bullet with the dot glyph before the content', () => {
    const fixture = setup();
    expect(el(fixture, 'row').querySelector('[data-part="marker"]')).toBeNull();

    fixture.componentInstance.marker.set('bullet');
    fixture.detectChanges();
    const marker = el(fixture, 'row').firstElementChild;
    expect(marker?.getAttribute('data-part')).toBe('marker');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
    expect(
      marker?.querySelector('[data-ui="icon"] > svg[data-glyph]')?.getAttribute('data-glyph'),
    ).toBe('dot');

    fixture.componentInstance.marker.set('number');
    fixture.detectChanges();
    expect(el(fixture, 'row').querySelector('[data-part="marker"]')).toBeNull();
  });

  /** Interactive content may not nest inside `a` or `button`. */
  it('places independent targets beside the box, never inside it', () => {
    const fixture = setup();

    expect(el(fixture, 'row').contains(el(fixture, 'actions'))).toBe(true);
    expect(el(fixture, 'content').contains(el(fixture, 'actions'))).toBe(false);
  });

  /**
   * ARIA 1.2 deprecates `aria-disabled` on `listitem`. The state is painted
   * from `data-disabled` and the attribute goes on the element that can refuse
   * an interaction — which is a different attribute for each element.
   */
  it('keeps the deprecated attribute off the row and puts it where it works', () => {
    const fixture = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(el(fixture, 'row').getAttribute('data-disabled')).toBe('');
    expect(el(fixture, 'row').hasAttribute('aria-disabled')).toBe(false);

    expect(el(fixture, 'command').hasAttribute('disabled')).toBe(true);
    expect(el(fixture, 'destination').getAttribute('aria-disabled')).toBe('true');
    /* The destination stays: `aria-disabled` keeps the element focusable, so a
       reader can reach the row and hear why it is unavailable. */
    expect(el(fixture, 'destination').getAttribute('href')).toBe('/photos');
  });

  /**
   * The refusal runs in capture on the row, which is the only ordering the DOM
   * guarantees: a directive's host listener and a `(click)` the page wrote sit
   * on the same target and run in registration order, and the page's was first.
   */
  it('refuses the interaction a disabled row cannot perform', () => {
    const fixture = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    el(fixture, 'destination').click();
    expect(fixture.componentInstance.onClick).not.toHaveBeenCalled();
  });

  it('runs the consumer handler untouched while the row is operable', () => {
    const fixture = setup();

    el(fixture, 'destination').click();
    expect(fixture.componentInstance.onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * A control in `actions` is the page's own, and a disabled row does not
   * disable it: only the control can refuse its own interaction, which is the
   * rule `card` states for the same shape.
   */
  it('leaves the independent targets beside the box operable', () => {
    const fixture = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const remove = el(fixture, 'actions').querySelector('button') as HTMLButtonElement;
    expect(remove.disabled).toBe(false);
  });

  /** A loading control keeps its name and its width, and refuses the second run. */
  it('says a row is busy and takes the activation away', () => {
    const fixture = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    expect(el(fixture, 'command-row').getAttribute('data-loading')).toBe('');
    expect(el(fixture, 'command').getAttribute('aria-busy')).toBe('true');
    expect(el(fixture, 'command').hasAttribute('disabled')).toBe(true);
    expect(el(fixture, 'command').textContent?.trim()).toBe('Publish');
  });

  /**
   * `aria-selected` is not valid on `listitem`; `aria-current` is inherited by
   * the role and is not deprecated.
   */
  it('paints a selection it does not announce, and announces the one state it may', () => {
    const fixture = setup();
    fixture.componentInstance.selected.set(true);
    fixture.componentInstance.current.set('page');
    fixture.detectChanges();

    expect(el(fixture, 'row').getAttribute('data-selected')).toBe('');
    expect(el(fixture, 'row').hasAttribute('aria-selected')).toBe(false);
    expect(el(fixture, 'row').getAttribute('data-current')).toBe('');
    expect(el(fixture, 'row').getAttribute('aria-current')).toBe('page');
  });

  /** ARIA 1.2: both are unnecessary while every row is in the document. */
  it('states a position in the set only when the page knows one', () => {
    const fixture = setup();
    expect(el(fixture, 'row').hasAttribute('aria-posinset')).toBe(false);

    fixture.componentInstance.position.set(7);
    fixture.componentInstance.setSize.set(42);
    fixture.detectChanges();

    expect(el(fixture, 'row').getAttribute('aria-posinset')).toBe('7');
    expect(el(fixture, 'row').getAttribute('aria-setsize')).toBe('42');
  });

  it('lets an application set its rows once, and lets a row still win', () => {
    const fixture = setup([provideListItemDefaults({ align: 'start', tone: 'danger' })]);

    expect(el(fixture, 'row').getAttribute('data-align')).toBe('start');
    expect(el(fixture, 'row').getAttribute('data-tone')).toBe('danger');

    fixture.componentInstance.tone.set('accent');
    fixture.detectChanges();
    expect(el(fixture, 'row').getAttribute('data-tone')).toBe('accent');
  });
});

/**
 * A body written around the box drew as unstyled text and said nothing. In
 * development the text parts name the parent they expect, once per part, and
 * the box says when it sits inside a body.
 */
describe('a row composed in the wrong nesting', () => {
  @Component({
    imports: [SlListItem, SlListItemBody, SlListItemContent, SlListItemLabel],
    template: `
      <li slListItem>
        <span slListItemBody><div slListItemContent></div></span>
      </li>
      <li slListItem>
        <span slListItemBody><span slListItemLabel>Again</span></span>
      </li>
    `,
  })
  class Reversed {}

  @Component({
    imports: [
      SlListItem,
      SlListItemBody,
      SlListItemContent,
      SlListItemDescription,
      SlListItemLabel,
    ],
    template: `
      <li slListItem>
        <button slListItemContent>
          <span slListItemBody>
            <span slListItemLabel>Title</span>
            <span slListItemDescription>Line</span>
          </span>
        </button>
      </li>
    `,
  })
  class Intended {}

  it('names the parent the body expects, once', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      TestBed.createComponent(Reversed).detectChanges();
      const messages = error.mock.calls.map((call) => String(call[0]));
      expect(
        messages.filter((message) => message === 'slListItemBody must be inside slListItemContent'),
      ).toHaveLength(1);
      expect(
        messages.filter((message) => message.startsWith('slListItemContent must not be inside')),
      ).toHaveLength(1);
    } finally {
      error.mockRestore();
    }
  });

  it('says nothing about a row nested as intended', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      TestBed.createComponent(Intended).detectChanges();
      expect(error.mock.calls.filter((call) => String(call[0]).startsWith('slListItem'))).toEqual(
        [],
      );
    } finally {
      error.mockRestore();
    }
  });
});
