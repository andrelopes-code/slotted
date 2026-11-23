import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRovingRadio } from './roving-radio';

/* Two groups of one choice, as a gallery in sections writes it, inside a form. */
const GALLERY = `
  <form>
    <div role="radiogroup" aria-label="Homes">
      <button type="button" role="radio" name="kind" value="house" aria-checked="false">House</button>
      <button type="button" role="radio" name="kind" value="flat" aria-checked="true">Flat</button>
    </div>
    <div role="radiogroup" aria-label="Vehicles">
      <button type="button" role="radio" name="kind" value="car" aria-checked="false">Car</button>
      <button type="button" role="radio" name="kind" value="bike" aria-checked="false" disabled>Bike</button>
    </div>
    <button type="button" role="radio" name="other" value="x" aria-checked="false">Other</button>
    <button type="submit">Continue</button>
  </form>`;

describe('createRovingRadio', () => {
  beforeEach(() => {
    document.body.innerHTML = GALLERY;
  });

  it('gives the groups that share a name one tab stop, on the checked item', () => {
    const { handle } = mount();

    expect(stops()).toEqual({ bike: '-1', car: '-1', flat: '0', house: '-1', x: null });
    handle.destroy();
  });

  it('gives the first enabled item the stop when none is checked', () => {
    radio('flat').setAttribute('aria-checked', 'false');
    const { handle } = mount();

    expect(stops()['house']).toBe('0');
    handle.destroy();
  });

  it('moves and selects with both arrow axes, across the groups, past a disabled item', () => {
    const { handle, onSelect } = mount();

    radio('flat').focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(radio('car'));
    press('ArrowDown');
    expect(document.activeElement).toBe(radio('house'));
    press('ArrowUp');
    expect(document.activeElement).toBe(radio('car'));

    expect(onSelect.mock.calls.map(([value]) => value)).toEqual(['car', 'house', 'car']);
    expect(stops()).toMatchObject({ car: '0', flat: '-1' });
    handle.destroy();
  });

  it('selects the item that is pressed, and moves the stop to it', () => {
    const { handle, onSelect } = mount();

    radio('house').click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('house', radio('house'));
    expect(stops()).toMatchObject({ flat: '-1', house: '0' });
    handle.destroy();
  });

  it('submits the form on Enter, and selects nothing', () => {
    const submitted = vi.fn((event: Event) => event.preventDefault());
    document.querySelector('form')!.addEventListener('submit', submitted);
    const { handle, onSelect } = mount();

    radio('flat').focus();
    expect(press('Enter').defaultPrevented).toBe(true);

    expect(submitted).toHaveBeenCalledOnce();
    expect(onSelect).not.toHaveBeenCalled();
    handle.destroy();
  });

  it('leaves the arrows and Enter of every other control alone', () => {
    const field = document.querySelector('form')!.appendChild(document.createElement('input'));
    const { handle, onSelect } = mount();

    field.focus();
    expect(press('ArrowRight').defaultPrevented).toBe(false);
    expect(press('Enter').defaultPrevented).toBe(false);

    expect(onSelect).not.toHaveBeenCalled();
    handle.destroy();
  });

  it('mirrors the inline arrows in a right-to-left root, and not the block ones', () => {
    document.querySelector('form')!.style.direction = 'rtl';
    const { handle, onSelect } = mount();

    radio('flat').focus();
    press('ArrowLeft');
    radio('flat').focus();
    press('ArrowDown');

    expect(onSelect.mock.calls.map(([value]) => value)).toEqual(['car', 'car']);
    handle.destroy();
  });

  it('follows a choice made elsewhere, and items that came and went, on refresh', () => {
    const { handle } = mount();

    radio('flat').remove();
    radio('car').setAttribute('aria-checked', 'true');
    handle.refresh();

    expect(stops()).toMatchObject({ car: '0', house: '-1' });
    handle.destroy();
  });

  it('answers nothing after destroy', () => {
    const { handle, onSelect } = mount();

    handle.destroy();
    radio('house').click();
    radio('flat').focus();
    press('ArrowRight');

    expect(onSelect).not.toHaveBeenCalled();
  });
});

function mount() {
  const onSelect = vi.fn();
  const handle = createRovingRadio(document.querySelector('form')!, { name: 'kind', onSelect });

  return { handle, onSelect };
}

function radio(value: string) {
  return document.querySelector<HTMLButtonElement>(`[role="radio"][value="${value}"]`)!;
}

function press(key: string) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  document.activeElement!.dispatchEvent(event);

  return event;
}

function stops() {
  return Object.fromEntries(
    [...document.querySelectorAll<HTMLButtonElement>('[role="radio"]')].map((item) => [
      item.value,
      item.getAttribute('tabindex'),
    ]),
  );
}
