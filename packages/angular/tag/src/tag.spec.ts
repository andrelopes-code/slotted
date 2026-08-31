import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { SlTag } from './tag';
import type { TagFill, TagSize, TagVariant } from './tag';
import { SlTagRemove } from './tag-remove';

@Component({
  imports: [SlTag, SlTagRemove],
  template: `
    <span slTag id="tag" [fill]="fill()" [size]="size()" [variant]="variant()">
      Design
      <button slTagRemove id="remove" aria-label="Remove design" [disabled]="disabled()"></button>
    </span>
  `,
})
class Host {
  readonly disabled = signal(false);
  readonly fill = signal<TagFill>('solid');
  readonly size = signal<TagSize>('md');
  readonly variant = signal<TagVariant>('secondary');
}

@Component({
  imports: [SlTag, SlTagRemove],
  template: `<span slTag><button slTagRemove></button></span>`,
})
class NamelessHost {}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    remove: () => element.querySelector<HTMLButtonElement>('#remove')!,
    tag: () => element.querySelector<HTMLElement>('#tag')!,
  };
}

describe('SlTag', () => {
  it('states the quietest appearance when it is given none', () => {
    const { tag } = mount();

    expect(tag().getAttribute('data-variant')).toBe('secondary');
    expect(tag().getAttribute('data-fill')).toBe('solid');
    expect(tag().getAttribute('data-size')).toBe('md');
  });

  it('states every axis it was given to the stylesheet', () => {
    const { fixture, tag } = mount();

    fixture.componentInstance.fill.set('subtle');
    fixture.componentInstance.size.set('sm');
    fixture.componentInstance.variant.set('accent');
    fixture.detectChanges();

    expect(tag().getAttribute('data-fill')).toBe('subtle');
    expect(tag().getAttribute('data-size')).toBe('sm');
    expect(tag().getAttribute('data-variant')).toBe('accent');
  });

  it('carries the class the stylesheet paints', () => {
    const { tag } = mount();

    expect(tag().classList.contains('slotted-tag')).toBe(true);
  });
});

describe('SlTagRemove', () => {
  it('is a button that does not submit the form around it', () => {
    const { remove } = mount();

    expect(remove().getAttribute('type')).toBe('button');
    expect(remove().getAttribute('aria-label')).toBe('Remove design');
  });

  it('names the part the stylesheet draws the cross on', () => {
    const { remove } = mount();

    expect(remove().getAttribute('data-part')).toBe('remove');
  });

  it('states disabled both to the platform and to the stylesheet', () => {
    const { fixture, remove } = mount();

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(remove().disabled).toBe(true);
    expect(remove().getAttribute('data-disabled')).toBe('');
  });

  it('sits inside the tag it removes', () => {
    const { remove, tag } = mount();

    expect(tag().contains(remove())).toBe(true);
  });

  it('warns in development when nothing names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    TestBed.createComponent(NamelessHost).detectChanges();

    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
