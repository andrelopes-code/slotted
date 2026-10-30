import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SlField, SlFieldControl, SlFieldLabel } from '@slotted/angular/field';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/field-group/contract.json';
import { SlFieldGroup } from './field-group';
import {
  SlFieldGroupDescription,
  SlFieldGroupError,
  SlFieldGroupLegend,
} from './field-group-parts';

@Component({
  standalone: true,
  imports: [
    SlField,
    SlFieldControl,
    SlFieldLabel,
    SlFieldGroup,
    SlFieldGroupDescription,
    SlFieldGroupError,
    SlFieldGroupLegend,
  ],
  template: `<fieldset slFieldGroup></fieldset>`,
})
class Host {}

function renderTemplate(template: string) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  TestBed.overrideComponent(Host, { set: { template } });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture;
}

const root = (fixture: ReturnType<typeof renderTemplate>, selector = '[data-ui="field-group"]') =>
  fixture.nativeElement.querySelector(selector) as HTMLElement;

describe('SlFieldGroup', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup>
         <legend slFieldGroupLegend>Billing address</legend>
       </fieldset>`,
    );

    const group = root(fixture);
    expect(group.tagName).toBe('FIELDSET');
    expect(group.getAttribute('data-part')).toBe('root');
    expect(group.querySelector('[data-part="legend"]')?.tagName).toBe('LEGEND');
    expect(group.querySelector('[data-part="content"]')).not.toBeNull();
  });

  it('writes every axis a consumer may style on, and the contract’s defaults', () => {
    const fixture = renderTemplate(`<fieldset slFieldGroup></fieldset>`);
    const group = root(fixture);
    const { defaults } = contract.members.fieldGroup;

    expect(group.getAttribute('data-size')).toBe(defaults.size);
    expect(group.getAttribute('data-orientation')).toBe(defaults.orientation);
    expect(group.getAttribute('data-necessity')).toBe(defaults.necessity);
    for (const state of ['data-disabled', 'data-invalid', 'data-required', 'data-readonly']) {
      expect(group.hasAttribute(state)).toBe(false);
    }
  });

  /**
   * The `group` role and the accessible name arrive from the platform, which is
   * the technique the APG's naming practice calls for under its Rule 3.
   */
  it('takes its role and its name from the platform', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup><legend slFieldGroupLegend>Nacionalidade</legend></fieldset>`,
    );

    const group = root(fixture);
    expect(group.getAttribute('role')).toBeNull();
    expect(group.querySelector('legend')?.textContent?.trim()).toBe('Nacionalidade');
  });

  /**
   * GOV.UK's error-message-with-legend example puts the hint and the error ids
   * on the `fieldset` itself, so a reader entering any control in the group
   * hears both once from the element that names them.
   */
  it('describes the whole set from the element that names it', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup id="nat">
         <legend slFieldGroupLegend>Nationality</legend>
         <span slFieldGroupDescription>Check all that apply.</span>
         <span slFieldGroupError>Choose at least one.</span>
       </fieldset>`,
    );

    expect(root(fixture).getAttribute('aria-describedby')).toBe('nat-description nat-error');
    expect(root(fixture, '#nat-description').getAttribute('data-tone')).toBe(
      contract.messageTones.description,
    );
    expect(root(fixture, '#nat-error').getAttribute('data-tone')).toBe(contract.messageTones.error);
  });

  /**
   * A message is drawn where the page wrote one, as React's
   * `FieldGroupDescription` and `FieldGroupError` are: an unwritten error is
   * no `inline-message` at all, not an empty one the stylesheet hides.
   */
  it('draws only the messages the page actually wrote', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup id="nat">
         <legend slFieldGroupLegend>Nacionalidade</legend>
         <span slFieldGroupDescription>Marque todas as que se aplicam.</span>
       </fieldset>`,
    );

    const messages = root(fixture).querySelectorAll('[data-ui="inline-message"]');
    expect([...messages].map((message) => message.id)).toEqual(['nat-description']);

    const bare = renderTemplate(
      `<fieldset slFieldGroup><legend slFieldGroupLegend>Nacionalidade</legend></fieldset>`,
    );
    expect(root(bare).querySelector('[data-ui="inline-message"]')).toBeNull();
  });

  it('merges the group’s description after a value the consumer wrote', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup id="nat" aria-describedby="tour-step">
         <span slFieldGroupDescription>Marque todas.</span>
       </fieldset>`,
    );

    expect(root(fixture).getAttribute('aria-describedby')).toBe('tour-step nat-description');
  });

  /**
   * A description written inside one of the fields belongs to that field. The
   * group reads only its own markers, and only its direct content.
   */
  it('never reads a field’s own message as the set’s', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup id="nat">
         <div slField id="one"><span slFieldGroupDescription>Not part of the group.</span></div>
       </fieldset>`,
    );

    expect(root(fixture).getAttribute('aria-describedby')).toBeNull();
  });

  it('disables its controls through the platform and its labels through the field', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup disabled>
         <div slField id="one"><input slFieldControl /></div>
       </fieldset>`,
    );

    expect(root(fixture).hasAttribute('disabled')).toBe(true);
    expect(root(fixture).hasAttribute('data-disabled')).toBe(true);
    expect(root(fixture, '#one').hasAttribute('data-disabled')).toBe(true);
    expect(root(fixture, '#one').querySelector('input')?.hasAttribute('disabled')).toBe(true);
  });

  /**
   * Angular creates every directive a template declares before it binds any
   * input, so the group answers for its fields with a method rather than with a
   * value handed over once. A snapshot would give every field the value the
   * group's inputs held before the consumer's bindings ran.
   */
  it('provides for the fields inside it, and yields to a field that states its own', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup size="sm" labelPlacement="side">
         <div slField id="inherited"></div>
         <div slField id="own" size="lg"></div>
       </fieldset>`,
    );

    expect(root(fixture, '#inherited').getAttribute('data-size')).toBe('sm');
    expect(root(fixture, '#inherited').getAttribute('data-label-placement')).toBe('side');
    expect(root(fixture, '#own').getAttribute('data-size')).toBe('lg');
  });

  it('lets a group inside a group inherit what it does not restate', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup size="sm" necessity="words">
         <fieldset slFieldGroup id="inner" necessity="none">
           <div slField id="deep"></div>
         </fieldset>
       </fieldset>`,
    );

    expect(root(fixture, '#deep').getAttribute('data-size')).toBe('sm');
    expect(root(fixture, '#deep').getAttribute('data-necessity')).toBe('none');
  });

  /**
   * `required` is a fact about one value and a section cannot know it, so the
   * group draws the marker on its own legend and provides nothing to the
   * fields.
   */
  it('marks its own name as necessary without marking every field in it', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup required>
         <legend slFieldGroupLegend>Nacionalidade</legend>
         <div slField id="one"><label slFieldLabel>Brasileira</label></div>
       </fieldset>`,
    );

    expect(root(fixture, 'legend [data-part="mark"]').textContent).toBe('*');
    expect(root(fixture, '#one').hasAttribute('data-required')).toBe(false);
    expect(root(fixture, '#one').querySelector('[data-part="mark"]')).toBeNull();
  });

  /**
   * A section is a topic rather than a question: its legend says nothing about
   * necessity, and its fields keep the style the application set.
   */
  it('says nothing about the necessity of a section and leaves its fields the application’s style', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup necessity="optional">
         <fieldset slFieldGroup kind="section">
           <legend slFieldGroupLegend>Value</legend>
           <div slField id="note"><label slFieldLabel>Note</label></div>
         </fieldset>
       </fieldset>`,
    );

    expect(root(fixture, 'legend').textContent?.trim()).toBe('Value');
    expect(root(fixture, '#note label').textContent?.trim()).toBe('Note (optional)');
  });

  /** The stylesheet sets a question's choices closer to its legend than a section's fields. */
  it('writes its kind on the root, question by default', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup id="question"></fieldset>
       <fieldset slFieldGroup id="section" kind="section"></fieldset>`,
    );

    expect(root(fixture, '#question').getAttribute('data-kind')).toBe('question');
    expect(root(fixture, '#section').getAttribute('data-kind')).toBe('section');
  });

  it('separates the necessity word from the legend in the accessible name', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup necessity="optional">
         <legend slFieldGroupLegend>Value</legend>
       </fieldset>`,
    );

    expect(root(fixture, 'legend').textContent?.trim()).toBe('Value (optional)');
  });

  it('says the set’s necessity in words when the page asks for words', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup required necessity="words">
         <legend slFieldGroupLegend>Nacionalidade</legend>
       </fieldset>`,
    );

    const mark = root(fixture, 'legend [data-part="mark"]');
    expect(mark.textContent).toBe('(required)');
    expect(mark.hasAttribute('aria-hidden')).toBe(false);
  });

  it('hands its identifiers back to the template', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup #group="slFieldGroup" id="nat"></fieldset>
       <a [attr.href]="'#' + group.ids().legend">Go to the section</a>`,
    );

    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('#nat-legend');
  });

  /**
   * A message written with `reserve` and nothing in it keeps its box, so the
   * layout does not move when the text arrives, and describes nothing — React's
   * `FieldGroupError` registers only when its children have content.
   */
  it('keeps the box of an empty reserved message and leaves it out of the description', () => {
    const fixture = renderTemplate(
      `<fieldset slFieldGroup id="nat">
         <legend slFieldGroupLegend>Nacionalidade</legend>
         <span slFieldGroupError reserve></span>
       </fieldset>`,
    );

    expect(root(fixture, '#nat-error').hasAttribute('data-reserve')).toBe(true);
    expect(root(fixture).getAttribute('aria-describedby')).toBeNull();
  });

  /**
   * The first change detection is all a server render has: the text a binding
   * writes there is read before the fieldset's own attributes are, with no
   * observer to report it later.
   */
  it('names a bound message on the first render, as a server render does', () => {
    const fixture = TestBed.createComponent(Notice);
    fixture.componentInstance.notice.set('Choose at least one.');
    fixture.detectChanges();

    expect(root(fixture).getAttribute('aria-describedby')).toBe('nat-error');
  });

  it('names a live message once its text arrives, and drops it once the text is gone', async () => {
    const fixture = TestBed.createComponent(Notice);
    fixture.detectChanges();
    expect(root(fixture).getAttribute('aria-describedby')).toBeNull();

    fixture.componentInstance.notice.set('Choose at least one.');
    fixture.detectChanges();
    expect(root(fixture).getAttribute('aria-describedby')).toBe('nat-error');

    fixture.componentInstance.notice.set('');
    fixture.detectChanges();
    expect(root(fixture).getAttribute('aria-describedby')).toBeNull();

    // Text written by code outside the template reaches the message through
    // the observer alone, before any change detection runs.
    const error = fixture.debugElement.query(By.directive(SlFieldGroupError));
    error.nativeElement.textContent = 'Written by other code.';
    await fixture.whenStable();
    expect(error.injector.get(SlFieldGroupError).hasContent()).toBe(true);
    fixture.detectChanges();
    expect(root(fixture).getAttribute('aria-describedby')).toBe('nat-error');
  });
});

@Component({
  standalone: true,
  imports: [SlFieldGroup, SlFieldGroupError, SlFieldGroupLegend],
  template: `<fieldset slFieldGroup id="nat">
    <legend slFieldGroupLegend>Nacionalidade</legend>
    <span slFieldGroupError tone="warning" live="polite" reserve>{{ notice() }}</span>
  </fieldset>`,
})
class Notice {
  readonly notice = signal('');
}
