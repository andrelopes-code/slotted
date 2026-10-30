import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it } from 'vitest';

import { SlColorField } from './color-field';
import { SlColorPicker } from './color-picker';
import { provideColorPickerDefaults } from './color-picker-defaults';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SlColorField, SlColorPicker],
  template: '',
})
class Host {
  readonly presets = ['#2563EB', '#DC2626'];
  readonly control = new FormControl('#2563EB');
  readonly format = signal<'hex' | 'rgb' | 'hsl' | 'oklch' | undefined>(undefined);
  readonly changes: { value: string; reason: string }[] = [];
}

function renderTemplate(template: string, providers: unknown[] = []) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ReturnType<typeof renderTemplate>;
const root = (fixture: Fixture) =>
  fixture.nativeElement.querySelector('[data-ui="color-picker"][data-part="root"]') as HTMLElement;
const slider = (fixture: Fixture, label: string) =>
  fixture.nativeElement.querySelector(`[role="slider"][aria-label="${label}"]`) as HTMLElement;
const key = (element: HTMLElement, init: KeyboardEventInit) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));

describe('SlColorPicker', () => {
  it('draws the anatomy and writes the color on the host', () => {
    const fixture = renderTemplate(
      `<div slColorPicker defaultValue="#2563EB" [presets]="presets" contrastWith="#FFFFFF"></div>`,
    );
    for (const part of [
      'area',
      'area-thumb',
      'channel',
      'channel-thumb',
      'row',
      'swatch',
      'previous',
      'presets',
      'preset',
      'contrast',
    ]) {
      expect(root(fixture).querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(Number(root(fixture).style.getPropertyValue('--slotted-color-picker-hue'))).toBeCloseTo(
      221,
      0,
    );
    expect(root(fixture).querySelector('[data-part="contrast"]')?.getAttribute('data-level')).toBe(
      'AA',
    );
    /* slMenuTriggerFor erases the part on the notation button; the panel writes it back. */
    TestBed.tick();
    expect(root(fixture).querySelector('[data-part="format"]')).not.toBeNull();
    expect(root(fixture).style.getPropertyValue('--slotted-color-picker-previous')).toContain(
      'rgb(37 99 235',
    );
  });

  it('moves the hue with the slider keys and answers in the same notation', () => {
    const fixture = renderTemplate(
      `<div slColorPicker defaultValue="hsl(200 50% 50%)" (valueChange)="changes.push($event)"></div>`,
    );
    key(slider(fixture, 'Hue'), { key: 'ArrowRight' });
    const [change] = fixture.componentInstance.changes;
    expect(change!.value).toMatch(/^hsl\(201 /);
    expect(change!.reason).toBe('keyboard');
  });

  it('takes alpha to nothing with Home', () => {
    const fixture = renderTemplate(
      `<div slColorPicker defaultValue="#2563EB" format="rgb" (valueChange)="changes.push($event)"></div>`,
    );
    key(slider(fixture, 'Opacity'), { key: 'Home' });
    expect(fixture.componentInstance.changes[0]!.value).toBe('rgb(37 99 235 / 0%)');
  });

  it('commits typed text in the current notation and keeps a half-written one invalid', () => {
    const fixture = renderTemplate(
      `<div slColorPicker defaultValue="#2563EB" (valueChange)="changes.push($event)"></div>`,
    );
    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Color"]',
    ) as HTMLInputElement;
    input.value = 'rgb(220 38';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    input.value = 'rgb(220 38 38)';
    input.dispatchEvent(new Event('input'));
    key(input, { key: 'Enter' });
    expect(fixture.componentInstance.changes[0]!.value).toBe('#DC2626');
  });

  it('marks its text input invalid when the picker is, so the frame draws the invalid edge', () => {
    const fixture = renderTemplate(
      `<div slColorPicker defaultValue="#2563EB" [invalid]="true"></div>`,
    );
    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Color"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.closest('[data-ui="text-field"]')!.hasAttribute('data-invalid')).toBe(true);
  });

  it('chooses a preset with the reason select', () => {
    const fixture = renderTemplate(
      `<div slColorPicker defaultValue="#2563EB" [presets]="presets" (valueChange)="changes.push($event)"></div>`,
    );
    (
      fixture.nativeElement.querySelector('[role="radio"][aria-label="#DC2626"]') as HTMLElement
    ).click();
    expect(fixture.componentInstance.changes[0]).toMatchObject({
      value: '#DC2626',
      reason: 'select',
    });
  });

  it('says a color lies outside sRGB', () => {
    const fixture = renderTemplate(`<div slColorPicker defaultValue="oklch(0.9 0.3 150)"></div>`);
    expect(root(fixture).hasAttribute('data-out-of-gamut')).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-part="gamut"]')).not.toBeNull();
  });

  it('belongs in a reactive form', () => {
    const fixture = renderTemplate(`<div slColorPicker [formControl]="control"></div>`);
    key(slider(fixture, 'Hue'), { key: 'End' });
    expect(fixture.componentInstance.control.value).toMatch(/^#/);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
  });

  it('takes its palette from the provider', () => {
    const fixture = renderTemplate(`<div slColorPicker defaultValue="#2563EB"></div>`, [
      provideColorPickerDefaults({ presets: ['#16A34A'] }),
    ]);
    expect(fixture.nativeElement.querySelector('[data-part="preset"]')).not.toBeNull();
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const fixture = renderTemplate(
      `<div slColorPicker defaultValue="#FFFF00" contrastWith="#FFFFFF"></div>`,
      [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    );
    const level = () =>
      fixture.nativeElement.querySelector('[data-part="contrast-level"]').textContent.trim();
    expect(slider(fixture, 'Matiz')).not.toBeNull();
    // language: pt-BR
    expect(slider(fixture, 'Saturação e brilho').getAttribute('aria-roledescription')).toBe(
      // language: en-US
      'controle deslizante 2D',
    );
    expect(level()).toBe('Insuficiente');

    locale.set('en-US');
    fixture.detectChanges();
    expect(slider(fixture, 'Hue')).not.toBeNull();
    expect(level()).toBe('Fail');
  });
});

describe('SlColorField', () => {
  it('commits a typed color into the form in its notation', () => {
    const fixture = renderTemplate(
      `<div slColorField aria-label="Primary" [formControl]="control"></div>`,
    );
    const input = fixture.nativeElement.querySelector(
      'input[data-part="input"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Primary');
    input.value = 'rgb(220 38 38)';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    key(input, { key: 'Enter' });
    expect(fixture.componentInstance.control.value).toBe('#DC2626');
    const trigger = fixture.nativeElement.querySelector('[data-part="trigger"]') as HTMLElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  });

  /**
   * The swatch is the field's own part, drawn by the family's stylesheet. The
   * field has to bring that stylesheet itself: carried only by the panel, it
   * arrived on the first open, and until then the swatch was a bare button —
   * a grey bar where the color belongs.
   */
  it('brings the swatch’s stylesheet before its panel first opens', () => {
    const fixture = renderTemplate(`<div slColorField aria-label="Primary" value="#dc2626"></div>`);
    expect(fixture.nativeElement.querySelector('[data-part="trigger"]')).not.toBeNull();
    expect(document.querySelector('[data-ui="color-picker"][data-part="root"]')).toBeNull();
    const swatch = /\[data-ui-color-picker\]\[data-part-trigger\]/;
    const sheets = [...document.head.querySelectorAll('style')].map((style) => style.textContent);
    /* The text field's own sheet is there: the page does carry the parts' stylesheets. */
    expect(sheets.some((css) => /\[data-ui-text-field\]/.test(css ?? ''))).toBe(true);
    expect(sheets.some((css) => swatch.test(css ?? ''))).toBe(true);
  });
});
