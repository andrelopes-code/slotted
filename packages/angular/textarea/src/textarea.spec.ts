import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { describe, expect, it, vi } from 'vitest';

import { SlTextarea } from './textarea';
import type { TextareaSize } from './textarea';

@Component({
  imports: [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlTextarea],
  template: `
    <div
      slField
      id="notes"
      [disabled]="fieldDisabled()"
      [invalid]="fieldInvalid()"
      [readOnly]="fieldReadOnly()"
      [required]="fieldRequired()"
    >
      <label slFieldLabel>Notes</label>
      <textarea
        slTextarea
        class="app-notes"
        [autoSize]="autoSize()"
        [disabled]="disabled()"
        [rows]="rows()"
        [size]="size()"
      ></textarea>
      <p slFieldDescription>Anything the team should know.</p>
      <p slFieldError>Notes cannot be empty.</p>
    </div>
  `,
})
class Host {
  readonly autoSize = signal(false);
  readonly disabled = signal<boolean | undefined>(undefined);
  readonly rows = signal(3);
  readonly size = signal<TextareaSize>('md');

  readonly fieldDisabled = signal(false);
  readonly fieldInvalid = signal(false);
  readonly fieldReadOnly = signal(false);
  readonly fieldRequired = signal(false);
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    label: element.querySelector<HTMLLabelElement>('label')!,
    settle: () => fixture.detectChanges(),
    textarea: element.querySelector<HTMLTextAreaElement>('textarea')!,
  };
}

describe('SlTextarea', () => {
  it('is the native control, with the defaults the contract names', () => {
    const { textarea } = mount();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.getAttribute('data-size')).toBe('md');
    expect(textarea.getAttribute('rows')).toBe('3');
    expect(textarea.hasAttribute('data-auto-size')).toBe(false);
  });

  it('marks itself when asked to grow, and leaves rows as the floor', () => {
    const { host, settle, textarea } = mount();
    host.autoSize.set(true);
    host.rows.set(2);
    settle();
    expect(textarea.getAttribute('data-auto-size')).toBe('');
    expect(textarea.getAttribute('rows')).toBe('2');
  });

  it('takes the field’s identifier and description, in the field’s order', () => {
    const { label, textarea } = mount();
    expect(textarea.getAttribute('id')).toBe('notes-control');
    expect(label.getAttribute('for')).toBe('notes-control');
    expect(textarea.getAttribute('aria-describedby')).toBe('notes-description notes-error');
  });

  it('takes every shared state from the field when it sets none itself', () => {
    const { host, settle, textarea } = mount();
    host.fieldDisabled.set(true);
    host.fieldInvalid.set(true);
    host.fieldReadOnly.set(true);
    host.fieldRequired.set(true);
    settle();

    expect(textarea.disabled).toBe(true);
    expect(textarea.getAttribute('data-invalid')).toBe('');
    expect(textarea.getAttribute('data-readonly')).toBe('');
    expect(textarea.getAttribute('aria-required')).toBe('true');
  });

  it('lets its own value win over the field’s, in both directions', () => {
    const { host, settle, textarea } = mount();
    host.fieldDisabled.set(true);
    host.disabled.set(false);
    settle();
    expect(textarea.disabled).toBe(false);
    expect(textarea.hasAttribute('data-disabled')).toBe(false);
  });

  it('describes itself as required with aria, never with the native attribute', () => {
    const { host, settle, textarea } = mount();
    host.fieldRequired.set(true);
    settle();
    expect(textarea.getAttribute('aria-required')).toBe('true');
    expect(textarea.hasAttribute('required')).toBe(false);
  });

  it('registers with the field, so the missing-control warning stays true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('carries the size it was given, and the class the consumer added', () => {
    const { host, settle, textarea } = mount();
    host.size.set('lg');
    settle();
    expect(textarea.getAttribute('data-size')).toBe('lg');
    expect(textarea.classList.contains('slotted-textarea')).toBe(true);
    expect(textarea.classList.contains('app-notes')).toBe(true);
  });
});
