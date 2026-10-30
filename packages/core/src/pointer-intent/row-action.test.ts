import { afterEach, describe, expect, it } from 'vitest';

import { isRowAction } from './row-action';

describe('isRowAction', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.getSelection()?.removeAllRanges();
  });

  function row() {
    document.body.innerHTML = `
      <table><tbody><tr id="row">
        <td id="plain">Mercado <span id="inner">Centro</span></td>
        <td><a id="link" href="#m"><span id="in-link">Market</span></a></td>
        <td><button id="button" type="button">Category</button></td>
        <td><div id="custom" role="button">More</div></td>
      </tr></tbody></table>
      <div id="portal"><button id="item" role="menuitem">Edit</button></div>`;
    return document.getElementById('row') as HTMLElement;
  }
  const at = (id: string) => document.getElementById(id);

  it('takes a click on a plain cell or on text inside it', () => {
    const element = row();
    expect(isRowAction(element, at('plain'))).toBe(true);
    expect(isRowAction(element, at('inner'))).toBe(true);
  });

  it('leaves a click on a control, or inside one, to the control', () => {
    const element = row();
    for (const id of ['link', 'in-link', 'button', 'custom']) {
      expect(isRowAction(element, at(id)), id).toBe(false);
    }
  });

  it('never takes a click that landed outside the row, as one in a portal does', () => {
    expect(isRowAction(row(), at('item'))).toBe(false);
  });

  it('leaves a click that ended a text selection inside the row alone', () => {
    const element = row();
    const range = document.createRange();
    range.selectNodeContents(at('plain') as HTMLElement);
    document.getSelection()?.addRange(range);
    expect(isRowAction(element, at('plain'))).toBe(false);
  });
});
