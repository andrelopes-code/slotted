import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { ChangeRequest } from '@slotted/core/state';
import { describe, expect, it } from 'vitest';

import {
  SlEntityPicker,
  SlEntityPickerOption,
  SlEntityPickerOptionDescription,
  SlEntityPickerOptionLabel,
} from './entity-picker';
import {
  type Entity,
  type EntityPickerOpenOn,
  type EntityPickerValue,
  type EntityPickerValueRequest,
  type EntitySource,
} from './entity-picker-defaults';

const PEOPLE: Entity[] = [
  { id: 'ana', label: 'Ana Silva', description: 'ana@acme.com', meta: 'Admin' },
  { id: 'ana2', label: 'Ana Silva', description: 'ana@partner.io' },
  { id: 'bruno', label: 'Bruno Costa', description: 'bruno@acme.com' },
  { id: 'carla', label: 'Carla Mendes', description: 'carla@acme.com', disabled: true },
];

function recordingSource(fail = false) {
  const asked: string[] = [];
  const source: EntitySource = {
    search: async ({ query }) => {
      asked.push(query);
      if (fail) throw new Error('offline');
      const items = PEOPLE.filter((person) =>
        person.label.toLowerCase().includes(query.toLowerCase()),
      );
      return { items, total: items.length };
    },
    resolve: async (ids) => PEOPLE.filter((person) => ids.includes(person.id)),
  };
  return { asked, source };
}

@Component({
  standalone: true,
  imports: [SlEntityPicker],
  template: `
    <sl-entity-picker
      #picker="slEntityPicker"
      aria-label="Owner"
      searchDelay="0"
      [selectionMode]="mode()"
      [source]="source()"
      [favorites]="favorites()"
      [defaultValue]="initial()"
      [max]="max()"
      [minQueryLength]="minQuery()"
      [createEntity]="maker()"
      [openOn]="openOn()"
      [readOnly]="readOnly()"
      [spellcheck]="spellcheck()"
      (valueChangeRequest)="requests.push($event)"
      (openChangeRequest)="openRequests.push($event)"
    />
  `,
})
class Host {
  readonly picker = viewChild.required<SlEntityPicker>('picker');
  readonly mode = signal<'single' | 'multiple'>('single');
  readonly source = signal<EntitySource>(recordingSource().source);
  readonly favorites = signal<readonly Entity[]>([]);
  readonly initial = signal<EntityPickerValue | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly minQuery = signal<number | undefined>(undefined);
  readonly maker = signal<((query: string) => Promise<Entity>) | undefined>(undefined);
  readonly openOn = signal<EntityPickerOpenOn | undefined>(undefined);
  readonly readOnly = signal<boolean | undefined>(undefined);
  readonly spellcheck = signal(false);
  readonly requests: EntityPickerValueRequest[] = [];
  readonly openRequests: ChangeRequest<boolean>[] = [];
}

async function mount(setup: (host: Host) => void = () => {}) {
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

async function settle(fixture: ComponentFixture<unknown>) {
  for (let round = 0; round < 4; round += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

const input = () => document.querySelector<HTMLInputElement>("[data-part='input']")!;
const press = (key: string, target: Element = document.activeElement ?? document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const type = (value: string) => {
  input().value = value;
  input().dispatchEvent(new Event('input', { bubbles: true }));
};
const expanded = () => input().getAttribute('aria-expanded');
const options = () => [...document.querySelectorAll<HTMLElement>("[role='option']")];

describe('SlEntityPicker', () => {
  it('leaves the query and the chosen name without a spelling check unless asked', async () => {
    const fixture = await mount();
    expect(input().getAttribute('spellcheck')).toBe('false');
    expect(input().getAttribute('autocorrect')).toBe('off');

    fixture.componentInstance.spellcheck.set(true);
    fixture.detectChanges();
    expect(input().getAttribute('spellcheck')).toBe('true');
  });

  it('opens on focus with favorites and searches the empty query', async () => {
    const { asked, source } = recordingSource();
    const fixture = await mount((host) => {
      host.source.set(source);
      host.favorites.set([PEOPLE[2]!]);
      host.openOn.set('focus');
    });
    input().focus();
    await settle(fixture);
    const labels = [...document.querySelectorAll("[data-part='group-label']")].map((label) =>
      label.textContent?.trim(),
    );
    expect(labels).toEqual(['Favorites', 'Results']);
    expect(asked).toEqual(['']);
  });

  it('chooses by keyboard, with the record on the request, and closes', async () => {
    const fixture = await mount();
    input().focus();
    type('bruno');
    await settle(fixture);
    press('ArrowDown', input());
    fixture.detectChanges();
    press('Enter', input());
    await settle(fixture);
    const request = fixture.componentInstance.requests[0]!;
    expect(request.value).toBe('bruno');
    expect(request.reason).toBe('keyboard');
    expect(request.entities.map((entity) => entity.id)).toEqual(['bruno']);
    expect(input().value).toBe('Bruno Costa');
    expect(input().getAttribute('aria-expanded')).toBe('false');
  });

  it('marks the match and keeps two records of one name apart', async () => {
    const fixture = await mount();
    input().focus();
    type('ana');
    await settle(fixture);
    const rows = options();
    expect(rows.map((row) => row.querySelector("[data-part='description']")?.textContent)).toEqual([
      'ana@acme.com',
      'ana@partner.io',
    ]);
    expect(rows[0]!.querySelector("[data-part='match']")?.textContent).toBe('Ana');
  });

  it('shows an id it cannot resolve as unavailable', async () => {
    const fixture = await mount((host) => {
      host.mode.set('multiple');
      host.initial.set(['gone', 'ana']);
    });
    await settle(fixture);
    const chips = [
      ...document.querySelectorAll("[data-part='chips'] > [data-ui='tag']:not([data-count])"),
    ];
    expect(chips.map((chip) => chip.getAttribute('aria-label'))).toEqual([
      'Unavailable, gone',
      'Ana Silva, ana@acme.com',
    ]);
    expect(chips[0]!.hasAttribute('data-unresolved')).toBe(true);
    expect(fixture.componentInstance.picker().validate()).toEqual({
      unresolved: { ids: ['gone'] },
    });
  });

  it('removes the last chip on the second Backspace from an empty field', async () => {
    const fixture = await mount((host) => {
      host.mode.set('multiple');
      host.initial.set(['ana', 'bruno']);
    });
    input().focus();
    await settle(fixture);
    press('Backspace', input());
    expect(document.activeElement?.getAttribute('data-value')).toBe('bruno');
    expect(fixture.componentInstance.requests).toEqual([]);
    press('Backspace');
    await settle(fixture);
    expect(fixture.componentInstance.requests[0]!.value).toEqual(['ana']);
    expect(fixture.componentInstance.requests[0]!.reason).toBe('remove');
  });

  it('refuses a record past max', async () => {
    const fixture = await mount((host) => {
      host.mode.set('multiple');
      host.initial.set(['ana']);
      host.max.set(1);
    });
    input().focus();
    type('bru');
    await settle(fixture);
    const bruno = options().find((row) => row.dataset['value'] === 'bruno')!;
    expect(bruno.getAttribute('aria-disabled')).toBe('true');
    bruno.click();
    expect(fixture.componentInstance.requests).toEqual([]);
  });

  it('offers to search again after a failure', async () => {
    const { asked, source } = recordingSource(true);
    const fixture = await mount((host) => host.source.set(source));
    input().focus();
    type('ana');
    await settle(fixture);
    expect(document.querySelector("[data-part='error']")?.textContent?.trim()).toBe(
      'Couldn’t load results',
    );
    const before = asked.length;
    document.querySelector<HTMLElement>('[data-retry]')!.click();
    await settle(fixture);
    expect(asked.length).toBe(before + 1);
  });

  /** Every icon the family owns is a `Glyph` element inside an `Icon` box, never a mask. */
  describe('glyph elements', () => {
    const glyph = (scope: ParentNode | null | undefined, part: string) =>
      scope
        ?.querySelector(`[data-part='${part}'] > [data-ui='icon'] > svg[data-glyph]`)
        ?.getAttribute('data-glyph');

    it('draws the cross, the chevron and the tick', async () => {
      const fixture = await mount((host) => host.initial.set('ana'));
      expect(glyph(document, 'clear')).toBe('x');
      expect(glyph(document, 'arrow')).toBe('chevron-down');

      input().focus();
      type('Ana');
      await settle(fixture);
      const chosen = options().find((row) => row.dataset['value'] === 'ana');
      expect(glyph(chosen, 'indicator')).toBe('check');
    });

    it('draws the alert mark in the face of an id it cannot resolve', async () => {
      const fixture = await mount((host) => {
        host.mode.set('multiple');
        host.initial.set(['gone']);
      });
      await settle(fixture);
      const chip = document.querySelector("[data-part='chips'] > [data-unresolved]");
      expect(glyph(chip, 'start')).toBe('circle-alert');
      expect(glyph(chip, 'remove')).toBe('x');
    });

    it('draws the alert beside a failure and the turning arrow on the offer to retry', async () => {
      const { source } = recordingSource(true);
      const fixture = await mount((host) => host.source.set(source));
      input().focus();
      type('ana');
      await settle(fixture);
      const error = document.querySelector("[data-part='error']");
      expect(error?.querySelector("[data-ui='icon'] > svg")?.getAttribute('data-glyph')).toBe(
        'circle-alert',
      );
      expect(glyph(document.querySelector('[data-retry]'), 'media')).toBe('rotate-ccw');
    });

    it('draws the plus on the offer to create', async () => {
      const fixture = await mount((host) =>
        host.maker.set(async (query) => ({ id: 'new', label: query })),
      );
      input().focus();
      type('Zeta');
      await settle(fixture);
      expect(glyph(document.querySelector('[data-create]'), 'media')).toBe('plus');
    });
  });

  it('chooses what it created, with reason submit', async () => {
    const fixture = await mount((host) =>
      host.maker.set(async (query) => ({ id: 'new', label: query })),
    );
    input().focus();
    type('Zeta');
    await settle(fixture);
    document.querySelector<HTMLElement>('[data-create]')!.click();
    await settle(fixture);
    const request = fixture.componentInstance.requests.at(-1)!;
    expect(request.value).toBe('new');
    expect(request.reason).toBe('submit');
  });

  it('says how many characters are needed below the minimum', async () => {
    const { asked, source } = recordingSource();
    const fixture = await mount((host) => {
      host.source.set(source);
      host.minQuery.set(2);
    });
    input().focus();
    type('a');
    await settle(fixture);
    expect(document.querySelector("[role='status']")?.textContent?.trim()).toBe(
      'Type 2 or more characters',
    );
    expect(asked).toEqual([]);
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const { source } = recordingSource();
    const fixture = await mount((host) => host.source.set(source));
    input().focus();
    type('zzz');
    await settle(fixture);
    const empty = () => document.querySelector("[data-part='empty']")?.textContent?.trim();
    // language: pt-BR
    expect(empty()).toBe('Nenhum resultado');
    // language: en-US

    locale.set('en-US');
    await settle(fixture);
    expect(empty()).toBe('No results');
  });
});

describe('SlEntityPicker openOn', () => {
  it('opens on a press on the input by default, once, with reason pointer', async () => {
    const fixture = await mount();
    input().focus();
    input().click();
    await settle(fixture);
    expect(expanded()).toBe('true');
    const { openRequests } = fixture.componentInstance;
    expect(openRequests.length).toBe(1);
    expect(openRequests[0]!.value).toBe(true);
    expect(openRequests[0]!.reason).toBe('pointer');
  });

  it('keeps an open popup open on a second press on the input', async () => {
    const fixture = await mount();
    input().focus();
    input().click();
    await settle(fixture);
    input().click();
    await settle(fixture);
    expect(expanded()).toBe('true');
    expect(fixture.componentInstance.openRequests.length).toBe(1);
  });

  it('does not open when a Tab brings focus in by default', async () => {
    const fixture = await mount();
    input().focus();
    await settle(fixture);
    expect(expanded()).toBe('false');
    expect(fixture.componentInstance.openRequests).toEqual([]);
  });

  it('opens on typing by default', async () => {
    const fixture = await mount();
    input().focus();
    type('bru');
    await settle(fixture);
    expect(expanded()).toBe('true');
  });

  it('keeps the popup closed on a press a consumer prevented', async () => {
    const fixture = await mount();
    const prevent = (event: Event) => event.preventDefault();
    document.addEventListener('click', prevent, { capture: true });
    try {
      input().focus();
      input().click();
      await settle(fixture);
    } finally {
      document.removeEventListener('click', prevent, { capture: true });
    }
    expect(expanded()).toBe('false');
    expect(fixture.componentInstance.openRequests).toEqual([]);
  });

  it('under manual, typing filters and a press only places the caret; ArrowDown opens', async () => {
    const fixture = await mount((host) => host.openOn.set('manual'));
    input().focus();
    input().click();
    await settle(fixture);
    expect(expanded()).toBe('false');
    type('bru');
    await settle(fixture);
    expect(expanded()).toBe('false');
    expect(input().value).toBe('bru');
    expect(fixture.componentInstance.openRequests).toEqual([]);
    press('ArrowDown', input());
    await settle(fixture);
    expect(expanded()).toBe('true');
    expect(fixture.componentInstance.openRequests.length).toBe(1);
  });

  it('under focus, a focus opens, and a press that focuses opens exactly once', async () => {
    const fixture = await mount((host) => host.openOn.set('focus'));
    input().focus();
    await settle(fixture);
    expect(expanded()).toBe('true');
    expect(fixture.componentInstance.openRequests.length).toBe(1);
    input().click();
    await settle(fixture);
    expect(expanded()).toBe('true');
    expect(fixture.componentInstance.openRequests.length).toBe(1);
  });

  it('does not open on a press when read-only', async () => {
    const fixture = await mount((host) => host.readOnly.set(true));
    input().focus();
    input().click();
    await settle(fixture);
    expect(expanded()).toBe('false');
    expect(fixture.componentInstance.openRequests).toEqual([]);
  });
});

@Component({
  standalone: true,
  imports: [
    SlEntityPicker,
    SlEntityPickerOption,
    SlEntityPickerOptionLabel,
    SlEntityPickerOptionDescription,
  ],
  template: `
    <sl-entity-picker aria-label="Owner" searchDelay="0" [items]="people">
      <ng-template slEntityPickerOption let-entity let-selected="selected">
        <span slEntityPickerOptionLabel>{{ entity.label }}{{ selected ? ' ✓' : '' }}</span>
        <span slEntityPickerOptionDescription>#{{ entity.id }}</span>
      </ng-template>
    </sl-entity-picker>
  `,
})
class OptionHost {
  readonly people = PEOPLE;
}

describe('SlEntityPicker with an option template', () => {
  it('draws the template inside the family row, face and check kept', async () => {
    const fixture = TestBed.createComponent(OptionHost);
    fixture.detectChanges();
    await settle(fixture);
    input().focus();
    type('bru');
    await settle(fixture);
    const row = options()[0]!;
    expect(row.querySelector("[data-part='description']")?.textContent).toBe('#bruno');
    /* The parts write the selector key the stylesheet places them by. */
    expect(row.querySelector('[data-part-label]')?.textContent).toContain('Bruno');
    expect(row.querySelector('[data-part-description]')).not.toBeNull();
    expect(row.querySelector("[data-part='media'] [data-ui='avatar']")).not.toBeNull();
    expect(row.querySelector("[data-part='indicator']")).not.toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SlEntityPicker, ReactiveFormsModule, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Reviewers</label>
      <sl-entity-picker
        selectionMode="multiple"
        searchDelay="0"
        required
        [items]="people"
        [formControl]="control"
      />
    </div>
  `,
})
class FormHost {
  readonly people = PEOPLE;
  readonly control = new FormControl<EntityPickerValue>([]);
}

describe('SlEntityPicker in a form', () => {
  it('writes, reads and validates through the form control', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    await settle(fixture);
    const { control } = fixture.componentInstance;
    expect(control.errors).toEqual({ required: true });
    control.setValue(['ana']);
    await settle(fixture);
    expect(
      document.querySelector("[data-part='chips'] > [data-ui='tag']")?.getAttribute('aria-label'),
    ).toBe('Ana Silva, ana@acme.com');
    input().focus();
    type('bru');
    await settle(fixture);
    options()
      .find((row) => row.dataset['value'] === 'bruno')!
      .click();
    await settle(fixture);
    expect(control.value).toEqual(['ana', 'bruno']);
    expect(control.valid).toBe(true);
  });

  it('is labelled by its field', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    await settle(fixture);
    const label = document.querySelector('label')!;
    expect(label.getAttribute('for')).toBe(input().id);
  });
});

@Component({
  standalone: true,
  imports: [SlEntityPicker],
  template: `<sl-entity-picker aria-label="Owner" searchDelay="0" [items]="people" />`,
})
class ManyHost {
  readonly people: Entity[] = Array.from({ length: 500 }, (_, index) => ({
    id: `p${String(index)}`,
    label: `Person ${String(index).padStart(3, '0')}`,
  }));
}

/**
 * Every keystroke over 500 records rendered all 500. Only the options in view
 * are drawn; the keyboard still moves through every match.
 */
describe('SlEntityPicker over a long list', () => {
  it('draws a window of options and keeps every match reachable', async () => {
    const fixture = TestBed.createComponent(ManyHost);
    fixture.detectChanges();
    await settle(fixture);
    input().focus();
    type('P');
    await settle(fixture);

    expect(options().length).toBeLessThan(60);
    expect(document.querySelector('[role="option"]')?.getAttribute('aria-setsize')).toBe('500');

    for (let step = 0; step < 500; step += 1) press('ArrowDown', input());
    await settle(fixture);
    expect(input().getAttribute('aria-activedescendant')).toContain('p499');
  });
});
