import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createActiveRemoval } from './active-removal';

/** The observer answers in a microtask, so the assertion has to wait for one. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

function mount(rows: readonly (readonly [string, number])[], active: string | null) {
  document.body.innerHTML = `<ul id="tree" tabindex="-1">${rows
    .map(([key, depth]) => `<li data-key="${key}" data-depth="${depth}" tabindex="-1"></li>`)
    .join('')}</ul>`;
  const container = document.getElementById('tree') as HTMLElement;
  const position = { active };
  const onMove = vi.fn((key: string | null) => {
    position.active = key;
  });
  const handle = createActiveRemoval(container, {
    nodeSelector: 'li',
    getActive: () => position.active,
    onMove,
  });
  const node = (key: string) =>
    container.querySelector<HTMLElement>(`[data-key="${key}"]`) as HTMLElement;
  return { container, handle, node, onMove };
}

const ROWS = [
  ['top', 0],
  ['a', 1],
  ['b', 1],
  ['c', 1],
  ['next', 0],
] as const;

describe('createActiveRemoval', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('moves to the next sibling', async () => {
    const { node, onMove } = mount(ROWS, 'b');
    node('b').focus();

    node('b').remove();
    await settled();

    expect(onMove).toHaveBeenCalledWith('c');
    expect(document.activeElement).toBe(node('c'));
  });

  it('moves to the previous sibling before the next branch', async () => {
    const { node, onMove } = mount(ROWS, 'c');

    node('c').remove();
    await settled();

    expect(onMove).toHaveBeenCalledWith('b');
  });

  it('moves to the parent when the whole level left', async () => {
    const { node, onMove } = mount(ROWS, 'b');

    for (const key of ['a', 'b', 'c']) node(key).remove();
    await settled();

    expect(onMove).toHaveBeenCalledWith('top');
  });

  it('passes over a disabled neighbor', async () => {
    const { node, onMove } = mount(ROWS, 'b');
    node('c').setAttribute('aria-disabled', 'true');

    node('b').remove();
    await settled();

    expect(onMove).toHaveBeenCalledWith('a');
  });

  it('holds focus in the container when no node is left', async () => {
    const { container, node, onMove } = mount([['only', 0]], 'only');
    node('only').focus();

    node('only').remove();
    await settled();

    expect(onMove).toHaveBeenCalledWith(null);
    expect(document.activeElement).toBe(container);
  });

  it('takes no focus from elsewhere', async () => {
    const { node } = mount(ROWS, 'b');

    node('b').remove();
    await settled();

    expect(document.activeElement).toBe(document.body);
  });

  it('waits for an active node that has yet to arrive', async () => {
    const { container, onMove } = mount(ROWS, 'later');

    container.append(document.createElement('li'));
    await settled();

    expect(onMove).not.toHaveBeenCalled();
  });

  it('moves nothing once destroyed', async () => {
    const { handle, node, onMove } = mount(ROWS, 'b');

    handle.destroy();
    node('b').remove();
    await settled();

    expect(onMove).not.toHaveBeenCalled();
  });
});
