import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { provideAvatarDefaults, SlAvatar } from '@slotted/angular/avatar';

import { SlAvatarGroup } from './avatar-group';
import { SlAvatarGroupItem } from './avatar-group-item';

const NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
  'Barbara Liskov',
  'Donald Knuth',
  'Margaret Hamilton',
];

@Component({
  imports: [SlAvatar, SlAvatarGroup, SlAvatarGroupItem],
  template: `
    <ul
      slAvatarGroup
      id="group"
      aria-label="Reviewers"
      [layout]="layout()"
      [max]="max()"
      [size]="size()"
      [total]="total()"
      [locale]="locale()"
      [overflowLabel]="overflowLabel()"
    >
      @for (name of names(); track name) {
        <li slAvatarGroupItem>
          <span slAvatar [name]="name"></span>
        </li>
      }
    </ul>

    <ul slAvatarGroup id="empty" aria-label="Nobody"></ul>
  `,
})
class Host {
  readonly names = signal<string[]>(NAMES.slice(0, 3));
  readonly layout = signal<'stack' | 'spread'>('stack');
  readonly max = signal<number | false>(5);
  readonly size = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined>(undefined);
  readonly total = signal<number | undefined>(undefined);
  readonly locale = signal<string | undefined>('en-GB');
  readonly overflowLabel = signal<string | undefined>(undefined);
}

function mount(providers: unknown[] = []) {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const group = () => fixture.nativeElement.querySelector('#group') as HTMLElement;
  const shown = () =>
    [...group().querySelectorAll('[data-part="item"]')].filter(
      (item) => !item.hasAttribute('hidden'),
    );
  const overflow = () => group().querySelector('[data-part="overflow"]');
  return { fixture, host: fixture.componentInstance, group, shown, overflow };
}

describe('SlAvatarGroup', () => {
  it('is a list, and names the family and its parts', () => {
    const { group, shown } = mount();

    expect(group().tagName).toBe('UL');
    expect(group().getAttribute('data-ui')).toBe('avatar-group');
    expect(group().getAttribute('data-part')).toBe('root');
    expect(shown()).toHaveLength(3);
    expect(shown()[0]?.tagName).toBe('LI');
  });

  it('states its layout and the size it lays out at', () => {
    const { fixture, host, group } = mount();
    host.layout.set('spread');
    host.size.set('lg');
    fixture.detectChanges();

    expect(group().getAttribute('data-layout')).toBe('spread');
    expect(group().getAttribute('data-size')).toBe('lg');
    expect(group().getAttribute('data-shape')).toBe('circle');
  });
});

describe('the limit and the summary', () => {
  it('draws every member while the group is within the limit', () => {
    const { fixture, host, shown, overflow } = mount();
    host.names.set(NAMES.slice(0, 5));
    fixture.detectChanges();

    expect(shown()).toHaveLength(5);
    expect(overflow()).toBeNull();
  });

  /** `max` counts the discs, the summary included, so a limit of five never draws six. */
  it('summarises the rest without ever exceeding the limit', () => {
    const { fixture, host, shown, overflow, group } = mount();
    host.names.set(NAMES);
    fixture.detectChanges();

    expect(shown()).toHaveLength(4);
    expect(overflow()?.textContent?.trim()).toBe('+3');
    expect(group().querySelectorAll('[data-ui="avatar"]:not([hidden] *)')).toBeDefined();
  });

  it('takes a limit of its own', () => {
    const { fixture, host, shown, overflow } = mount();
    host.names.set(NAMES);
    host.max.set(3);
    fixture.detectChanges();

    expect(shown()).toHaveLength(2);
    expect(overflow()?.textContent?.trim()).toBe('+5');
  });

  it('draws every member when the limit is removed', () => {
    const { fixture, host, shown, overflow } = mount();
    host.names.set(NAMES);
    host.max.set(false);
    fixture.detectChanges();

    expect(shown()).toHaveLength(7);
    expect(overflow()).toBeNull();
  });

  it('counts the members the page did not render', () => {
    const { fixture, host, shown, overflow } = mount();
    host.total.set(40);
    host.overflowLabel.set('Thirty-seven other people');
    fixture.detectChanges();

    expect(shown()).toHaveLength(3);
    expect(overflow()?.textContent?.trim()).toBe('+37');
  });

  it('writes the summary in the digits the locale writes', () => {
    const { fixture, host, overflow } = mount();
    host.locale.set('ar-EG');
    host.total.set(1200);
    host.overflowLabel.set('many');
    fixture.detectChanges();

    expect(overflow()?.textContent?.trim()).toMatch(/^\+[٠-٩٬]+$/u);
  });
});

describe('the members the summary stands for', () => {
  it('is named by the hidden members, joined for the locale', () => {
    const { fixture, host, overflow } = mount();
    host.names.set(NAMES.slice(0, 5));
    host.max.set(3);
    fixture.detectChanges();

    expect(overflow()?.querySelector('[data-ui="avatar"]')?.getAttribute('aria-label')).toBe(
      'Alan Turing, Katherine Johnson and Barbara Liskov',
    );
  });

  it('joins them the way another locale joins them', () => {
    const { fixture, host, overflow } = mount();
    host.names.set(NAMES.slice(0, 5));
    host.max.set(3);
    host.locale.set('pt-BR');
    fixture.detectChanges();

    expect(overflow()?.querySelector('[data-ui="avatar"]')?.getAttribute('aria-label')).toBe(
      'Alan Turing, Katherine Johnson e Barbara Liskov',
    );
  });

  it('takes the label the consumer supplies', () => {
    const { fixture, host, overflow } = mount();
    host.names.set(NAMES.slice(0, 5));
    host.max.set(3);
    host.overflowLabel.set('three more reviewers');
    fixture.detectChanges();

    expect(overflow()?.querySelector('[data-ui="avatar"]')?.getAttribute('aria-label')).toBe(
      'three more reviewers',
    );
  });

  /** A member past the limit leaves the layout and the accessibility tree in one attribute. */
  it('hides the members it summarised away', () => {
    const { fixture, host, group } = mount();
    host.names.set(NAMES);
    fixture.detectChanges();

    const hidden = [...group().querySelectorAll('[data-part="item"][hidden]')];
    expect(hidden).toHaveLength(3);
  });
});

describe('what the group decides for its members', () => {
  it('sizes every member once', () => {
    const { fixture, host, group } = mount();
    host.size.set('xl');
    fixture.detectChanges();

    for (const member of group().querySelectorAll('[data-part="item"] [data-ui="avatar"]')) {
      expect(member.getAttribute('data-size')).toBe('xl');
    }
  });

  it('inherits what an application set for the whole page', () => {
    const { group } = mount([provideAvatarDefaults({ size: 'sm' })]);

    expect(group().getAttribute('data-size')).toBe('sm');
  });

  /** A tone derived from a name is the member's identity; a group that set it would erase it. */
  it('never decides the identity colour of its members', () => {
    const { group } = mount();
    const tones = [...group().querySelectorAll('[data-part="item"] [data-ui="avatar"]')].map(
      (member) => member.getAttribute('data-tone'),
    );

    expect(new Set(tones).size).toBeGreaterThan(1);
  });

  it('paints the summary neutral', () => {
    const { fixture, host, overflow } = mount();
    host.names.set(NAMES);
    fixture.detectChanges();

    expect(overflow()?.querySelector('[data-ui="avatar"]')?.getAttribute('data-tone')).toBe(
      'secondary',
    );
  });
});

describe('an empty group', () => {
  it('holds nothing when it is given nothing', () => {
    const { fixture } = mount();
    const empty = fixture.nativeElement.querySelector('#empty') as HTMLElement;

    expect(empty.querySelector('[data-part="item"]')).toBeNull();
    expect(empty.querySelector('[data-part="overflow"]')).toBeNull();
  });
});
