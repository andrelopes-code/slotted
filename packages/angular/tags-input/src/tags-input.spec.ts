import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SlTagsInput } from './tags-input';
import { provideTagsInputDefaults } from './tags-input-defaults';
import type { TagsInputRefuseCause } from './tags-input-defaults';

@Component({
  standalone: true,
  imports: [SlTagsInput],
  template: `
    <sl-tags-input
      aria-label="To"
      [defaultValue]="defaultValue()"
      [editable]="editable()"
      [reorderable]="reorderable()"
      [max]="max()"
      [name]="name()"
      [validateValue]="validate()"
      [invalidValues]="invalidValues()"
      [pendingOnBlur]="pendingOnBlur()"
      [lockedValues]="lockedValues()"
      [readOnly]="readOnly()"
      [pattern]="pattern()"
      (valueChange)="value.set($event)"
      (valueChangeRequest)="reason.set($event.reason)"
      (valueRefuse)="refused.set($event)"
      (valueCopy)="copied.set($event.values)"
    />
  `,
})
class Host {
  readonly defaultValue = signal<readonly string[] | undefined>(undefined);
  readonly editable = signal(false);
  readonly reorderable = signal(false);
  readonly readOnly = signal(false);
  readonly max = signal<number | undefined>(undefined);
  readonly name = signal<string | undefined>(undefined);
  readonly pattern = signal<string | undefined>(undefined);
  readonly validate = signal<((text: string) => boolean | string) | undefined>(undefined);
  readonly invalidValues = signal<'keep' | 'refuse' | undefined>(undefined);
  readonly pendingOnBlur = signal<'commit' | 'keep' | 'discard' | undefined>(undefined);
  readonly lockedValues = signal<readonly string[]>([]);
  readonly value = signal<readonly string[] | undefined>(undefined);
  readonly reason = signal<string | undefined>(undefined);
  readonly refused = signal<{ values: readonly string[]; cause: TagsInputRefuseCause } | null>(
    null,
  );
  readonly copied = signal<readonly string[] | null>(null);
}

@Component({
  standalone: true,
  imports: [SlTagsInput, ReactiveFormsModule],
  template: `<sl-tags-input aria-label="To" [formControl]="control" [validateValue]="validate" />`,
})
class FormHost {
  readonly control = new FormControl<readonly string[]>(['ana@x.com'], { nonNullable: true });
  readonly validate = (text: string) => text.includes('@');
}

const field = () => document.querySelector<HTMLInputElement>("[data-part='input']")!;
const root = () => document.querySelector<HTMLElement>("[data-ui='tags-input'][data-part='root']")!;
const chips = () =>
  [
    ...document.querySelectorAll<HTMLElement>(
      "[data-part='chips'] > [role='gridcell']:not([data-part='field'])",
    ),
  ].filter((chip) => chip.hasAttribute('data-value'));
const chipValues = () => chips().map((chip) => chip.dataset['value']);

const press = (target: Element, key: string, modifiers: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...modifiers }),
  );

const type = (fixture: ComponentFixture<unknown>, text: string) => {
  field().value = text;
  field().dispatchEvent(new Event('input'));
  fixture.detectChanges();
};

const settle = async (fixture: ComponentFixture<unknown>) => {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

describe('SlTagsInput', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host, FormHost] }).compileComponents();
    fixture = TestBed.createComponent(Host);
  });

  it('is a text box inside a layout grid, and no combobox', async () => {
    fixture.componentInstance.defaultValue.set(['a']);
    await settle(fixture);
    expect(field().hasAttribute('role')).toBe(false);
    expect(field().hasAttribute('aria-expanded')).toBe(false);
    expect(document.querySelector("[data-part='control']")?.getAttribute('aria-label')).toBe(
      'To, 1 value',
    );
    expect(document.querySelector("[data-part='chips']")?.getAttribute('role')).toBe('row');
    for (const chip of chips()) expect(chip.getAttribute('tabindex')).toBe('-1');
  });

  it('commits on Enter and on a delimiter, and never submits with text', async () => {
    await settle(fixture);
    field().focus();
    type(fixture, 'ana@x.com');
    const allowed = press(field(), 'Enter');
    await settle(fixture);
    expect(allowed).toBe(false);
    expect(chipValues()).toEqual(['ana@x.com']);
    expect(fixture.componentInstance.reason()).toBe('submit');
    expect(field().value).toBe('');
    type(fixture, 'lee@x.org');
    press(field(), ',');
    await settle(fixture);
    expect(chipValues()).toEqual(['ana@x.com', 'lee@x.org']);
  });

  it('splits a paste on the delimiters and on line breaks', async () => {
    await settle(fixture);
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', {
      value: { getData: () => 'a, b\nc' },
    });
    field().dispatchEvent(paste);
    await settle(fixture);
    expect(chipValues()).toEqual(['a', 'b', 'c']);
  });

  /** The reason the family exists: an invalid value is held, marked, described. */
  it('holds an invalid value, marks it, describes it, and blocks the native submit', async () => {
    fixture.componentInstance.validate.set((text) => (text.includes('@') ? true : 'Needs an @'));
    await settle(fixture);
    field().focus();
    type(fixture, 'jhon');
    press(field(), 'Enter');
    await settle(fixture);
    const [chip] = chips();
    expect(chip?.hasAttribute('data-invalid')).toBe(true);
    expect(chip?.dataset['tone']).toBe('danger');
    expect(chip?.getAttribute('aria-invalid')).toBe('true');
    expect(chip?.getAttribute('title')).toBe('Needs an @');
    const message = document.getElementById(chip?.getAttribute('aria-describedby') ?? '');
    expect(message?.textContent).toBe('Needs an @');
    expect(chip?.querySelector("[data-part='start']")).not.toBeNull();
    expect(root().hasAttribute('data-invalid')).toBe(true);
    expect(field().getAttribute('aria-invalid')).toBe('true');
    expect(field().validity.customError).toBe(true);
  });

  it('refuses an invalid value instead, on request, and reports it', async () => {
    fixture.componentInstance.validate.set(() => false);
    fixture.componentInstance.invalidValues.set('refuse');
    await settle(fixture);
    field().focus();
    type(fixture, 'jhon');
    press(field(), 'Enter');
    await settle(fixture);
    expect(chipValues()).toEqual([]);
    expect(fixture.componentInstance.refused()).toEqual({ values: ['jhon'], cause: 'invalid' });
  });

  it('judges by the input’s own constraints when no validator is given', async () => {
    fixture.componentInstance.pattern.set('[A-Z]{3}-\\d{4}');
    fixture.componentInstance.defaultValue.set(['ABC-1234', 'nope']);
    await settle(fixture);
    const [good, bad] = chips();
    expect(good?.hasAttribute('data-invalid')).toBe(false);
    expect(bad?.hasAttribute('data-invalid')).toBe(true);
    /* Every chip's remove button draws the cross. */
    expect(
      good?.querySelector("[data-part='remove'] svg[data-glyph]")?.getAttribute('data-glyph'),
    ).toBe('x');
    /* The mark is the alert glyph in `tag`'s start slot, on the failing chip only. */
    expect(good?.querySelector("[data-part='start']")).toBeNull();
    expect(
      bad?.querySelector("[data-part='start'] svg[data-glyph]")?.getAttribute('data-glyph'),
    ).toBe('circle-alert');
  });

  it('refuses a duplicate under the locale rule and focuses the chip that holds it', async () => {
    fixture.componentInstance.defaultValue.set(['Ana']);
    await settle(fixture);
    field().focus();
    type(fixture, 'ana');
    press(field(), 'Enter');
    await settle(fixture);
    expect(chipValues()).toEqual(['Ana']);
    expect(fixture.componentInstance.refused()).toEqual({ values: ['ana'], cause: 'duplicate' });
    expect(document.activeElement).toBe(chips()[0]);
    expect(chips()[0]?.hasAttribute('data-current')).toBe(true);
  });

  it('caps at the limit, says so, and reports what did not fit', async () => {
    fixture.componentInstance.max.set(2);
    await settle(fixture);
    expect(document.querySelector("[data-part='counter']")?.textContent).toBe('0 of 2');
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'a,b,c,d' } });
    field().dispatchEvent(paste);
    await settle(fixture);
    expect(chipValues()).toEqual(['a', 'b']);
    expect(root().hasAttribute('data-complete')).toBe(true);
    expect(fixture.componentInstance.refused()).toEqual({ values: ['c', 'd'], cause: 'limit' });
  });

  it('removes with Backspace only from an empty field, and only on the second press', async () => {
    fixture.componentInstance.defaultValue.set(['a', 'b']);
    await settle(fixture);
    field().focus();
    press(field(), 'Backspace');
    await settle(fixture);
    expect(document.activeElement).toBe(chips()[1]);
    expect(chipValues()).toEqual(['a', 'b']);
    press(chips()[1]!, 'Backspace');
    await settle(fixture);
    expect(chipValues()).toEqual(['a']);
    expect(fixture.componentInstance.reason()).toBe('remove');
  });

  it('never removes a locked value', async () => {
    fixture.componentInstance.defaultValue.set(['support@x.com', 'a']);
    fixture.componentInstance.lockedValues.set(['support@x.com']);
    await settle(fixture);
    const [locked] = chips();
    expect(locked?.hasAttribute('data-disabled')).toBe(true);
    expect(locked?.querySelector("[data-part='remove']")).toBeNull();
    press(locked!, 'Delete');
    await settle(fixture);
    expect(chipValues()).toEqual(['support@x.com', 'a']);
    const clear = document.querySelector<HTMLElement>("[data-part='clear']");
    expect(clear?.querySelector('svg[data-glyph]')?.getAttribute('data-glyph')).toBe('x');
    clear?.click();
    await settle(fixture);
    expect(chipValues()).toEqual(['support@x.com']);
  });

  it('reorders with Alt and an arrow, and emits keyboard', async () => {
    fixture.componentInstance.defaultValue.set(['a', 'b', 'c']);
    fixture.componentInstance.reorderable.set(true);
    await settle(fixture);
    press(chips()[2]!, 'ArrowLeft', { altKey: true });
    await settle(fixture);
    expect(chipValues()).toEqual(['a', 'c', 'b']);
    expect(fixture.componentInstance.reason()).toBe('keyboard');
  });

  it('edits a chip in place, and reverts on Escape', async () => {
    fixture.componentInstance.defaultValue.set(['a', 'b']);
    fixture.componentInstance.editable.set(true);
    await settle(fixture);
    press(chips()[1]!, 'Enter');
    await settle(fixture);
    const editor = chips()[1]?.querySelector('input') as HTMLInputElement;
    expect(editor.value).toBe('b');
    editor.value = 'z';
    editor.dispatchEvent(new Event('input'));
    press(editor, 'Escape');
    await settle(fixture);
    expect(chipValues()).toEqual(['a', 'b']);

    press(chips()[1]!, 'Enter');
    await settle(fixture);
    const again = chips()[1]?.querySelector('input') as HTMLInputElement;
    again.value = 'z';
    again.dispatchEvent(new Event('input'));
    press(again, 'Enter');
    await settle(fixture);
    expect(chipValues()).toEqual(['a', 'z']);
  });

  it('answers blur with the three words', async () => {
    await settle(fixture);
    field().focus();
    type(fixture, 'a');
    field().dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }));
    await settle(fixture);
    expect(chipValues()).toEqual(['a']);

    fixture.componentInstance.pendingOnBlur.set('keep');
    await settle(fixture);
    type(fixture, 'b');
    field().dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }));
    await settle(fixture);
    expect(field().value).toBe('b');

    fixture.componentInstance.pendingOnBlur.set('discard');
    await settle(fixture);
    field().dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }));
    await settle(fixture);
    expect(field().value).toBe('');
    expect(chipValues()).toEqual(['a']);
  });

  it('copies a chip with Ctrl+C and the list from the empty field', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    fixture.componentInstance.defaultValue.set(['a', 'b']);
    await settle(fixture);
    field().focus();
    press(field(), 'c', { ctrlKey: true });
    await settle(fixture);
    expect(writeText).toHaveBeenLastCalledWith('a, b');
    expect(fixture.componentInstance.copied()).toEqual(['a', 'b']);
    press(chips()[0]!, 'x', { ctrlKey: true });
    await settle(fixture);
    expect(writeText).toHaveBeenLastCalledWith('a');
    expect(chipValues()).toEqual(['b']);
  });

  it('writes one hidden input per value under one name', async () => {
    fixture.componentInstance.name.set('to');
    fixture.componentInstance.defaultValue.set(['a', 'b']);
    await settle(fixture);
    const hidden = document.querySelectorAll<HTMLInputElement>("input[type='hidden'][name='to']");
    expect([...hidden].map((node) => node.value)).toEqual(['a', 'b']);
  });

  it('withholds every remove control while read-only, and keeps the chips legible', async () => {
    fixture.componentInstance.defaultValue.set(['a']);
    fixture.componentInstance.readOnly.set(true);
    await settle(fixture);
    expect(root().hasAttribute('data-readonly')).toBe(true);
    expect(chips()[0]?.hasAttribute('data-disabled')).toBe(false);
    expect(document.querySelector("[data-part='remove']")).toBeNull();
    expect(document.querySelector("[data-part='clear']")).toBeNull();
  });

  it('takes its defaults from the provider, and the input over the provider', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTagsInputDefaults({ delimiters: [';'] })],
    }).compileComponents();
    const own = TestBed.createComponent(Host);
    own.componentInstance.defaultValue.set(['a']);
    await settle(own);
    field().focus();
    type(own, 'b');
    press(field(), ';');
    await settle(own);
    expect(chipValues()).toEqual(['a', 'b']);
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    TestBed.resetTestingModule();
    const locale = signal('pt-BR');
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    }).compileComponents();
    const own = TestBed.createComponent(Host);
    own.componentInstance.defaultValue.set(['a']);
    await settle(own);
    const remove = () => document.querySelector("[data-part='remove']")?.getAttribute('aria-label');
    expect(remove()).toBe('Remover a');

    locale.set('en-US');
    await settle(own);
    expect(remove()).toBe('Remove a');
  });

  it('belongs in a Reactive Form, and reports the values that failed by name', async () => {
    const form = TestBed.createComponent(FormHost);
    await settle(form);
    expect(chipValues()).toEqual(['ana@x.com']);
    expect(form.componentInstance.control.valid).toBe(true);

    field().focus();
    type(form, 'jhon');
    press(field(), 'Enter');
    await settle(form);
    expect(form.componentInstance.control.value).toEqual(['ana@x.com', 'jhon']);
    expect(form.componentInstance.control.errors).toEqual({ invalidValues: ['jhon'] });

    form.componentInstance.control.setValue(['lee@x.org']);
    await settle(form);
    expect(chipValues()).toEqual(['lee@x.org']);
    expect(form.componentInstance.control.valid).toBe(true);
  });
});

describe('SlTagsInput suggestions', () => {
  @Component({
    standalone: true,
    imports: [SlTagsInput],
    template: `
      <sl-tags-input
        aria-label="To"
        [defaultValue]="defaultValue()"
        [max]="max()"
        [normalize]="normalize()"
        [suggestions]="suggestions()"
        [validateValue]="validate()"
        (valueChangeRequest)="reason.set($event.reason)"
        (valueRefuse)="refused.set($event)"
      />
    `,
  })
  class SuggestHost {
    readonly defaultValue = signal<readonly string[] | undefined>(undefined);
    readonly max = signal<number | undefined>(undefined);
    readonly normalize = signal<((text: string) => string) | undefined>(undefined);
    readonly suggestions = signal<readonly string[]>(['travel', 'trip', 'work']);
    readonly validate = signal<((text: string) => boolean | string) | undefined>(undefined);
    readonly reason = signal<string | undefined>(undefined);
    readonly refused = signal<{ values: readonly string[]; cause: TagsInputRefuseCause } | null>(
      null,
    );
  }

  let fixture: ComponentFixture<SuggestHost>;
  const listbox = () => document.querySelector<HTMLElement>("[role='listbox']");
  const options = () => [...document.querySelectorAll<HTMLElement>("[role='option']")];
  const key = async (name: string) => {
    press(field(), name);
    await settle(fixture);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SuggestHost] }).compileComponents();
    fixture = TestBed.createComponent(SuggestHost);
    await settle(fixture);
    field().focus();
  });

  it('lists the suggestions the typed text matches, and Enter on the first adds it', async () => {
    expect(field().getAttribute('role')).toBe('combobox');
    expect(field().getAttribute('aria-expanded')).toBe('false');
    type(fixture, 'tr');
    await settle(fixture);
    expect(field().getAttribute('aria-expanded')).toBe('true');
    expect(field().getAttribute('aria-controls')).toBe(listbox()!.id);
    expect(listbox()!.getAttribute('aria-label')).toBe('Suggestions');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['travel', 'trip']);
    expect(field().hasAttribute('aria-activedescendant')).toBe(false);

    await key('ArrowDown');
    expect(field().getAttribute('aria-activedescendant')).toBe(options()[0]!.id);
    expect(options()[0]!.getAttribute('aria-selected')).toBe('true');
    await key('Enter');

    expect(chipValues()).toEqual(['travel']);
    expect(fixture.componentInstance.reason()).toBe('submit');
    expect(field().value).toBe('');
    expect(listbox()).toBeNull();
    expect(field().getAttribute('aria-expanded')).toBe('false');
  });

  it('matches by the locale’s collator and leaves out what is already chosen', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [SuggestHost] }).compileComponents();
    fixture = TestBed.createComponent(SuggestHost);
    fixture.componentInstance.defaultValue.set(['trip']);
    fixture.componentInstance.suggestions.set(['Été', 'été 2026', 'trip', 'Trips']);
    await settle(fixture);
    field().focus();
    type(fixture, 'ete');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['Été', 'été 2026']);
    type(fixture, 'TRI');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['Trips']);
  });

  it('still commits the typed text, and Escape closes the list before it clears', async () => {
    type(fixture, 'tr');
    await key('Escape');
    expect(listbox()).toBeNull();
    expect(field().value).toBe('tr');
    await key('Escape');
    expect(field().value).toBe('');
    type(fixture, 'train');
    await key('Enter');
    expect(chipValues()).toEqual(['train']);
  });

  it('opens on ArrowDown with nothing typed, wraps, and adds a suggestion on a press', async () => {
    await key('ArrowDown');
    expect(options()).toHaveLength(3);
    expect(field().getAttribute('aria-activedescendant')).toBe(options()[0]!.id);
    await key('ArrowUp');
    expect(field().getAttribute('aria-activedescendant')).toBe(options()[2]!.id);
    await key('ArrowDown');
    expect(field().getAttribute('aria-activedescendant')).toBe(options()[0]!.id);
    const pressed = options()[1]!;
    expect(
      pressed.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })),
    ).toBe(false);
    pressed.click();
    await settle(fixture);
    expect(chipValues()).toEqual(['trip']);
  });

  it('runs a chosen suggestion through validate, normalize and max like typed text', async () => {
    fixture.componentInstance.max.set(1);
    fixture.componentInstance.normalize.set((text) => text.toUpperCase());
    fixture.componentInstance.validate.set((text) => text !== 'TRIP' || 'No trips');
    await settle(fixture);
    type(fixture, 'trip');
    await key('ArrowDown');
    await key('Enter');
    expect(chipValues()).toEqual(['TRIP']);
    expect(chips()[0]!.getAttribute('data-tone')).toBe('danger');
    type(fixture, 'trav');
    await key('ArrowDown');
    await key('Enter');
    expect(chipValues()).toEqual(['TRIP']);
    expect(fixture.componentInstance.refused()).toEqual({ values: ['TRAVEL'], cause: 'limit' });
  });
});
