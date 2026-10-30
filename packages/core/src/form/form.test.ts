import { describe, expect, it } from 'vitest';

import {
  collectValidity,
  errorCount,
  hasErrors,
  isDirty,
  mergeErrors,
  namedControls,
  normalizeErrors,
  orderErrors,
  withoutError,
} from './form';

function formOf(html: string): HTMLFormElement {
  const host = document.createElement('div');
  host.innerHTML = `<form novalidate>${html}</form>`;
  document.body.replaceChildren(host);
  return host.querySelector('form') as HTMLFormElement;
}

describe('normalizeErrors', () => {
  it('reads one message and several the same way', () => {
    expect(normalizeErrors({ email: 'Required', age: ['Too low', 'Not a number'] })).toEqual({
      email: ['Required'],
      age: ['Too low', 'Not a number'],
    });
  });

  it('drops a key whose message is empty, absent or only spaces', () => {
    expect(normalizeErrors({ a: '', b: '   ', c: null, d: undefined, e: [] })).toEqual({});
  });

  it('answers an empty map for nothing at all', () => {
    expect(normalizeErrors(undefined)).toEqual({});
  });
});

describe('mergeErrors', () => {
  it('lets a later source replace a name rather than add to it', () => {
    const merged = mergeErrors(
      { email: 'Please fill in this field' },
      { email: 'That address is already taken' },
    );

    expect(merged).toEqual({ email: ['That address is already taken'] });
  });

  it('keeps names no later source mentions', () => {
    expect(mergeErrors({ a: '1' }, { b: '2' }, undefined)).toEqual({ a: ['1'], b: ['2'] });
  });
});

describe('withoutError', () => {
  it('drops one name', () => {
    expect(withoutError({ a: ['1'], b: ['2'] }, 'a')).toEqual({ b: ['2'] });
  });

  it('returns the same map when the name was not in it', () => {
    const errors = { a: ['1'] };

    expect(withoutError(errors, 'b')).toBe(errors);
  });
});

describe('hasErrors and errorCount', () => {
  it('counts messages rather than names', () => {
    expect(errorCount({ a: ['1', '2'], b: ['3'] })).toBe(3);
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ a: ['1'] })).toBe(true);
  });
});

describe('orderErrors', () => {
  const order = [
    { name: 'name', id: 'name-control' },
    { name: 'email', id: 'email-control' },
  ];

  it('lists the errors in document order, not in the object’s', () => {
    const entries = orderErrors({ email: ['Bad'], name: ['Required'] }, order);

    expect(entries.map((entry) => entry.name)).toEqual(['name', 'email']);
    expect(entries[0]?.id).toBe('name-control');
  });

  /** A server may name a field the page no longer renders. */
  it('keeps an error for a control the form does not hold, without a link', () => {
    const entries = orderErrors({ coupon: ['Expired'], name: ['Required'] }, order);

    expect(entries.map((entry) => entry.name)).toEqual(['name', 'coupon']);
    expect(entries[1]?.id).toBeUndefined();
  });

  it('gives a control with no identifier no link either', () => {
    const entries = orderErrors({ name: ['Required'] }, [{ name: 'name', id: undefined }]);

    expect(entries[0]?.id).toBeUndefined();
  });
});

describe('namedControls', () => {
  it('reads the controls in document order', () => {
    const form = formOf('<input name="one" id="a"><textarea name="two" id="b"></textarea>');

    expect(namedControls(form)).toEqual([
      { name: 'one', id: 'a' },
      { name: 'two', id: 'b' },
    ]);
  });

  /** A range slider submits two inputs under one name, and that is one row. */
  it('reports one name once, under the first control that carries it', () => {
    const form = formOf('<input name="price" id="low"><input name="price" id="high">');

    expect(namedControls(form)).toEqual([{ name: 'price', id: 'low' }]);
  });

  it('ignores a control with no name', () => {
    const form = formOf('<input id="anonymous"><input name="named" id="named">');

    expect(namedControls(form)).toEqual([{ name: 'named', id: 'named' }]);
  });
});

describe('collectValidity', () => {
  it('reports the platform’s own message for each failing control', () => {
    const form = formOf('<input name="email" id="email" required>');

    const errors = collectValidity(form);

    expect(Object.keys(errors)).toEqual(['email']);
    expect(errors['email']?.[0]).toBeTypeOf('string');
    expect(errors['email']?.[0]?.length).toBeGreaterThan(0);
  });

  it('says nothing about a control that satisfies its constraints', () => {
    const form = formOf('<input name="email" id="email" required value="a@b.co">');

    expect(collectValidity(form)).toEqual({});
  });

  it('skips a control that does not participate in validation', () => {
    const form = formOf('<input name="hidden" type="hidden"><input name="off" required disabled>');

    expect(collectValidity(form)).toEqual({});
  });
});

describe('isDirty', () => {
  it('is false for a form nobody has touched', () => {
    expect(isDirty(formOf('<input name="a" value="x"><textarea name="b">y</textarea>'))).toBe(
      false,
    );
  });

  it('notices a changed text value', () => {
    const form = formOf('<input name="a" value="x">');
    (form.elements.namedItem('a') as HTMLInputElement).value = 'z';

    expect(isDirty(form)).toBe(true);
  });

  it('notices a toggled checkbox rather than reading its value', () => {
    const form = formOf('<input name="a" type="checkbox">');
    (form.elements.namedItem('a') as HTMLInputElement).checked = true;

    expect(isDirty(form)).toBe(true);
  });

  it('notices a changed selection', () => {
    const form = formOf(
      '<select name="a"><option selected>one</option><option>two</option></select>',
    );
    (form.elements.namedItem('a') as HTMLSelectElement).value = 'two';

    expect(isDirty(form)).toBe(true);
  });
});
