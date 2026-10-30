import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/tree/contract.json';
import { Tree } from './tree';
import { TreeDefaultsProvider } from './tree-defaults';
import { TreeNode } from './tree-parts';
import type { TreeHandle, TreeProps, TreeValue } from './tree.types';

interface Entry {
  id: string;
  name: string;
  entries?: Entry[];
  locked?: boolean;
  more?: number;
}

/**
 *  src
 *    index.ts
 *    lib
 *      a.ts
 *      b.ts   (disabled)
 *  docs       (three children nobody has fetched)
 *  readme.md
 */
const ROOTS: Entry[] = [
  {
    id: 'src',
    name: 'src',
    entries: [
      { id: 'index.ts', name: 'index.ts' },
      {
        id: 'lib',
        name: 'lib',
        entries: [
          { id: 'a.ts', name: 'a.ts' },
          { id: 'b.ts', name: 'b.ts', locked: true },
        ],
      },
    ],
  },
  { id: 'docs', name: 'docs', more: 3 },
  { id: 'readme.md', name: 'readme.md' },
];

const tree = () => screen.getByRole('tree');
const items = () => screen.getAllByRole('treeitem');
const byKey = (key: string) => tree().querySelector<HTMLElement>(`[data-key="${key}"]`);
const row = (key: string) => byKey(key)?.querySelector<HTMLElement>("[data-part='row']");
const names = () => items().map((item) => item.dataset['key']);

function Files(props: Partial<TreeProps<Entry>>) {
  return (
    <Tree<Entry>
      aria-label="Files"
      nodes={ROOTS}
      getKey={(entry) => entry.id}
      getLabel={(entry) => entry.name}
      getChildren={(entry) => entry.entries}
      hasChildren={(entry) => entry.entries !== undefined || entry.more !== undefined}
      getChildrenCount={(entry) => entry.more}
      isNodeDisabled={(entry) => entry.locked === true}
      defaultExpandedKeys={['src', 'lib']}
      {...props}
    />
  );
}

describe('the shape it renders', () => {
  it('writes the identifier and the parts the contract declares', () => {
    const { container } = render(<Files />);
    const root = container.querySelector("[data-ui='tree']") as HTMLElement;
    expect(root.dataset['part']).toBe('root');
    expect(tree().dataset['part']).toBe('canvas');
    for (const part of ['node', 'row', 'label', 'expander', 'guide']) {
      expect(root.querySelector(`[data-part='${part}']`)).not.toBeNull();
    }
    expect(contract.members.tree.parts).toContain('canvas');
  });

  /** The chevron is the Glyph element on a branch, and a leaf's box stays empty. */
  it('draws the chevron on every branch and nothing on a leaf', () => {
    render(<Files />);
    const chevron = (key: string) =>
      byKey(key)?.querySelector(
        ":scope > [data-part='row'] > [data-part='expander'] > [data-ui='icon'] > svg[data-glyph]",
      );
    expect(chevron('src')).toHaveAttribute('data-glyph', 'chevron-right');
    expect(chevron('index.ts')).toBeNull();
    expect(
      byKey('index.ts')?.querySelector(":scope > [data-part='row'] > [data-part='expander']"),
    ).not.toBeNull();
  });

  /** A collapsed branch renders no group, so its children are not in the set. */
  it('holds only what is open, in reading order', () => {
    render(<Files defaultExpandedKeys={['src']} />);
    expect(names()).toEqual(['src', 'index.ts', 'lib', 'docs', 'readme.md']);
  });

  /** A leaf carrying `aria-expanded` is announced as a parent. */
  it('gives aria-expanded to branches and to nothing else', () => {
    render(<Files />);
    expect(byKey('src')?.getAttribute('aria-expanded')).toBe('true');
    expect(byKey('docs')?.getAttribute('aria-expanded')).toBe('false');
    expect(byKey('index.ts')?.hasAttribute('aria-expanded')).toBe(false);
  });

  /**
   * A `treeitem` contains the group holding its children, so a name computed
   * from its contents is the whole subtree read aloud.
   */
  it('names every node from its own label and never from its subtree', () => {
    render(<Files />);
    const node = byKey('src') as HTMLElement;
    const label = node.querySelector("[data-part='label']") as HTMLElement;
    expect(node.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.textContent).toBe('src');
  });

  /** With the nesting in the DOM the browser computes all three. */
  it('writes no level properties while the nesting is there to be read', () => {
    render(<Files />);
    const node = byKey('lib') as HTMLElement;
    expect(node.hasAttribute('aria-level')).toBe(false);
    expect(node.hasAttribute('aria-setsize')).toBe(false);
    expect(node.hasAttribute('aria-posinset')).toBe(false);
  });

  it('states the level itself once the rows are laid flat', () => {
    render(<Files structure="flat" />);
    const node = byKey('lib') as HTMLElement;
    expect(node.getAttribute('aria-level')).toBe('2');
    expect(node.getAttribute('aria-setsize')).toBe('2');
    expect(node.getAttribute('aria-posinset')).toBe('2');
  });

  it('says which selection mode it is in, which is what the cursor reads', () => {
    const { container } = render(<Files selectionMode="multiple" />);
    const root = container.querySelector("[data-ui='tree']") as HTMLElement;
    expect(root.dataset['selection']).toBe('multiple');
    expect(tree().getAttribute('aria-multiselectable')).toBe('true');
  });
});

describe('expansion', () => {
  it('opens a closed branch with the forward arrow and does not move', () => {
    render(<Files defaultExpandedKeys={[]} defaultActiveKey="docs" />);
    fireEvent.keyDown(tree(), { key: 'ArrowRight' });
    expect(byKey('docs')?.getAttribute('aria-expanded')).toBe('true');
    expect(byKey('docs')?.dataset['current']).toBe('');
  });

  it('moves into an open branch with the second press', () => {
    render(<Files defaultExpandedKeys={['src']} defaultActiveKey="src" />);
    fireEvent.keyDown(tree(), { key: 'ArrowRight' });
    expect(byKey('index.ts')?.dataset['current']).toBe('');
  });

  it('does nothing on a leaf', () => {
    render(<Files defaultActiveKey="index.ts" />);
    fireEvent.keyDown(tree(), { key: 'ArrowRight' });
    expect(byKey('index.ts')?.dataset['current']).toBe('');
    expect(names()).toContain('index.ts');
  });

  it('closes an open branch with the backward arrow', () => {
    render(<Files defaultActiveKey="lib" />);
    fireEvent.keyDown(tree(), { key: 'ArrowLeft' });
    expect(byKey('lib')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('walks to the parent from a leaf', () => {
    render(<Files defaultActiveKey="index.ts" />);
    fireEvent.keyDown(tree(), { key: 'ArrowLeft' });
    expect(byKey('src')?.dataset['current']).toBe('');
  });

  it('does nothing at the root level', () => {
    render(<Files defaultActiveKey="readme.md" />);
    fireEvent.keyDown(tree(), { key: 'ArrowLeft' });
    expect(byKey('readme.md')?.dataset['current']).toBe('');
  });

  /** Optional in the pattern, and two surveyed implementations ship it. */
  it('opens every sibling at the level with the asterisk', () => {
    render(<Files defaultExpandedKeys={[]} defaultActiveKey="readme.md" />);
    fireEvent.keyDown(tree(), { key: '*' });
    expect(byKey('src')?.getAttribute('aria-expanded')).toBe('true');
    expect(byKey('docs')?.getAttribute('aria-expanded')).toBe('true');
  });

  /**
   * Closing a branch that holds the active node moves the active node to the
   * branch, before the DOM loses the element that held it.
   */
  it('takes the keyboard with it when a branch closes under it', () => {
    const onActive = vi.fn();
    render(<Files defaultActiveKey="a.ts" onActiveKeyChange={onActive} />);
    fireEvent.click(row('lib') as HTMLElement);
    expect(onActive).toHaveBeenCalled();
    expect(byKey('a.ts')).toBeNull();
    expect(byKey('lib')?.dataset['current']).toBe('');
  });

  it('carries the reason on every request', () => {
    const onExpanded = vi.fn();
    render(<Files defaultActiveKey="docs" onExpandedKeysChange={onExpanded} />);
    fireEvent.keyDown(tree(), { key: 'ArrowRight' });
    expect(onExpanded.mock.calls[0]?.[1].reason).toBe('keyboard');
    fireEvent.click(row('readme.md') as HTMLElement);
    fireEvent.click(row('src') as HTMLElement);
    expect(onExpanded.mock.calls[1]?.[1].reason).toBe('pointer');
  });

  it('holds the set when the consumer owns it', () => {
    const onExpanded = vi.fn();
    render(<Files expandedKeys={['src']} onExpandedKeysChange={onExpanded} />);
    fireEvent.click(row('src') as HTMLElement);
    expect(onExpanded).toHaveBeenCalled();
    expect(byKey('src')?.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('movement', () => {
  it('walks the visible rows and skips what is closed', () => {
    render(<Files defaultExpandedKeys={['src']} defaultActiveKey="index.ts" />);
    fireEvent.keyDown(tree(), { key: 'ArrowDown' });
    expect(byKey('lib')?.dataset['current']).toBe('');
    fireEvent.keyDown(tree(), { key: 'ArrowDown' });
    expect(byKey('docs')?.dataset['current']).toBe('');
  });

  it('answers Home and End', () => {
    render(<Files defaultActiveKey="lib" />);
    fireEvent.keyDown(tree(), { key: 'End' });
    expect(byKey('readme.md')?.dataset['current']).toBe('');
    fireEvent.keyDown(tree(), { key: 'Home' });
    expect(byKey('src')?.dataset['current']).toBe('');
  });

  it('steps over a disabled node unless told not to', () => {
    render(<Files defaultActiveKey="a.ts" />);
    fireEvent.keyDown(tree(), { key: 'ArrowDown' });
    expect(byKey('docs')?.dataset['current']).toBe('');
  });

  it('lands on a disabled node when navigateDisabled says so', () => {
    render(<Files defaultActiveKey="a.ts" navigateDisabled />);
    fireEvent.keyDown(tree(), { key: 'ArrowDown' });
    expect(byKey('b.ts')?.dataset['current']).toBe('');
  });

  it('moves to the node whose name is typed', () => {
    render(<Files defaultActiveKey="src" />);
    fireEvent.keyDown(tree(), { key: 'd' });
    expect(byKey('docs')?.dataset['current']).toBe('');
  });

  it('holds one tab stop, on the node the keyboard is on', () => {
    render(<Files defaultActiveKey="lib" />);
    expect(byKey('lib')?.tabIndex).toBe(0);
    expect(byKey('src')?.tabIndex).toBe(-1);
    expect(tree().tabIndex).toBe(-1);
  });

  it('puts the tab stop on the tree itself while nothing is active', () => {
    render(<Files />);
    expect(tree().tabIndex).toBe(0);
  });
});

describe('selection', () => {
  it('chooses one node and hands back a scalar', () => {
    const onChange = vi.fn();
    render(<Files onValueChange={onChange} />);
    fireEvent.click(row('index.ts') as HTMLElement);
    expect(onChange.mock.calls[0]?.[0]).toBe('index.ts');
    expect(byKey('index.ts')?.getAttribute('aria-selected')).toBe('true');
  });

  it('hands back the set in multiple, and writes aria-checked instead', () => {
    const onChange = vi.fn();
    render(<Files selectionMode="multiple" onValueChange={onChange} />);
    fireEvent.click(row('index.ts') as HTMLElement);
    fireEvent.click(row('a.ts') as HTMLElement);
    expect(onChange.mock.calls[1]?.[0]).toEqual(['index.ts', 'a.ts']);
    expect(byKey('a.ts')?.getAttribute('aria-checked')).toBe('true');
    expect(byKey('a.ts')?.hasAttribute('aria-selected')).toBe(false);
  });

  /** The pattern forbids a tree carrying both attributes. */
  it('never writes both selection attributes at once', () => {
    render(<Files selectionMode="multiple" defaultValue={['a.ts']} />);
    for (const node of items()) {
      expect(node.hasAttribute('aria-checked') && node.hasAttribute('aria-selected')).toBe(false);
    }
  });

  it('writes neither attribute when nothing is selectable', () => {
    render(<Files selectionMode="none" />);
    expect(byKey('src')?.hasAttribute('aria-selected')).toBe(false);
    expect(byKey('src')?.hasAttribute('aria-checked')).toBe(false);
  });

  it('toggles with Space and never with a modifier the pattern does not name', () => {
    render(<Files selectionMode="multiple" defaultActiveKey="index.ts" />);
    fireEvent.keyDown(tree(), { key: ' ' });
    expect(byKey('index.ts')?.dataset['selected']).toBe('');
    fireEvent.keyDown(tree(), { key: ' ' });
    expect(byKey('index.ts')?.dataset['selected']).toBeUndefined();
  });

  it('selects a run from the anchor with Shift and Space', () => {
    render(<Files selectionMode="multiple" defaultActiveKey="index.ts" />);
    fireEvent.keyDown(tree(), { key: ' ' });
    fireEvent.keyDown(tree(), { key: 'ArrowDown' });
    fireEvent.keyDown(tree(), { key: 'ArrowDown' });
    fireEvent.keyDown(tree(), { key: ' ', shiftKey: true });
    expect(byKey('lib')?.dataset['selected']).toBe('');
    expect(byKey('a.ts')?.dataset['selected']).toBe('');
  });

  it('takes every enabled node with Control and A, and clears on the second press', () => {
    render(<Files selectionMode="multiple" defaultActiveKey="src" />);
    fireEvent.keyDown(tree(), { key: 'a', ctrlKey: true });
    expect(byKey('index.ts')?.dataset['selected']).toBe('');
    expect(byKey('b.ts')?.dataset['selected']).toBeUndefined();
    fireEvent.keyDown(tree(), { key: 'a', ctrlKey: true });
    expect(byKey('index.ts')?.dataset['selected']).toBeUndefined();
  });

  it('refuses a disabled node', () => {
    const onChange = vi.fn();
    render(<Files selectionMode="multiple" onValueChange={onChange} />);
    fireEvent.click(row('b.ts') as HTMLElement);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets the consumer own the value', () => {
    function Owned() {
      const [value, setValue] = useState<TreeValue>('src');
      return <Files value={value} onValueChange={(next) => setValue(next)} />;
    }
    render(<Owned />);
    fireEvent.click(row('index.ts') as HTMLElement);
    expect(byKey('index.ts')?.dataset['selected']).toBe('');
    expect(byKey('src')?.dataset['selected']).toBeUndefined();
  });

  it('carries a reason a consumer can tell apart', () => {
    const onChange = vi.fn();
    render(<Files onValueChange={onChange} defaultActiveKey="index.ts" />);
    fireEvent.click(row('index.ts') as HTMLElement);
    expect(onChange.mock.calls[0]?.[1].reason).toBe('pointer');
    fireEvent.keyDown(tree(), { key: ' ' });
    expect(onChange.mock.calls[1]?.[1].reason).toBe('keyboard');
  });
});

describe('the cascade', () => {
  const Cascading = (props: Partial<TreeProps<Entry>>) => (
    <Files selectionMode="multiple" selectionCascade="descendants" {...props} />
  );

  it('takes every enabled descendant with the branch', () => {
    const onChange = vi.fn();
    render(<Cascading onValueChange={onChange} />);
    fireEvent.click(row('lib') as HTMLElement);
    expect(onChange.mock.calls[0]?.[0]).toEqual(['lib', 'a.ts']);
  });

  /** A disabled descendant is decided by nobody but the reader that can reach it. */
  it('leaves a disabled descendant where it was', () => {
    const onChange = vi.fn();
    render(<Cascading onValueChange={onChange} />);
    fireEvent.click(row('src') as HTMLElement);
    expect(onChange.mock.calls[0]?.[0]).not.toContain('b.ts');
  });

  it('marks a branch that holds part of a selection', () => {
    render(<Cascading defaultValue={['index.ts']} />);
    expect(byKey('src')?.dataset['indeterminate']).toBe('');
    expect(byKey('src')?.dataset['selected']).toBeUndefined();
    const mark = (key: string) =>
      byKey(key)
        ?.querySelector(":scope > [data-part='row'] > [data-part='indicator'] svg[data-glyph]")
        ?.getAttribute('data-glyph');
    expect(mark('src')).toBe('minus');
    expect(mark('index.ts')).toBe('check');
  });

  it('says a collapsed branch still holds one', () => {
    render(<Cascading defaultValue={['a.ts']} defaultExpandedKeys={['src']} />);
    expect(byKey('lib')?.dataset['selectedWithin']).toBe('');
  });
});

describe('what the consumer owns', () => {
  it('paints a branch that is fetching, and busies its group', () => {
    render(
      <Files isNodeLoading={(entry) => entry.id === 'lib'} defaultExpandedKeys={['src', 'lib']} />,
    );
    const node = byKey('lib') as HTMLElement;
    expect(node.dataset['loading']).toBe('');
    expect(node.querySelector("[data-part='loader']")).not.toBeNull();
    expect(node.querySelector("[data-part='group']")?.getAttribute('aria-busy')).toBe('true');
  });

  it('holds a branch whose children have not arrived', () => {
    render(<Files />);
    expect(byKey('docs')?.dataset['branch']).toBe('');
    expect(byKey('docs')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the ancestors of a match and marks the span', () => {
    render(<Files query="tre" nodes={[{ id: 'x', name: 'tree.ts' }, ...ROOTS]} />);
    expect(names()).toEqual(['x']);
    expect(tree().querySelector('mark')?.textContent).toBe('tre');
  });

  it('opens the branches a match sits under', () => {
    render(<Files defaultExpandedKeys={[]} query="a.ts" />);
    expect(names()).toEqual(['src', 'lib', 'a.ts']);
  });

  it('shows the empty content when a query matches nothing', () => {
    render(<Files query="zzz" emptyContent="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });
});

describe('what the platform gets', () => {
  it('submits one hidden input per chosen key', () => {
    const { container } = render(
      <Files name="files" selectionMode="multiple" defaultValue={['src', 'a.ts']} />,
    );
    const inputs = [...container.querySelectorAll<HTMLInputElement>('input[name="files"]')];
    expect(inputs.map((input) => input.value)).toEqual(['src', 'a.ts']);
  });

  it('reaches the root element and the imperative actions', () => {
    const handle = createRef<TreeHandle>();
    const { container } = render(<Files handleRef={handle} defaultExpandedKeys={[]} />);
    expect(handle.current?.getElement()).toBe(container.querySelector("[data-ui='tree']"));
    act(() => handle.current?.expandAll());
    expect(byKey('a.ts')).not.toBeNull();
    act(() => handle.current?.collapseAll());
    expect(byKey('index.ts')).toBeNull();
  });

  it('opens the path to a node it is asked to reveal', () => {
    const handle = createRef<TreeHandle>();
    render(<Files handleRef={handle} defaultExpandedKeys={[]} />);
    act(() => handle.current?.expand('a.ts'));
    expect(byKey('a.ts')).not.toBeNull();
  });

  it('runs the consumer’s own handler beside its own', () => {
    const onClick = vi.fn();
    render(
      <Tree aria-label="Composed">
        <TreeNode value="one" label="One" onClick={onClick} />
      </Tree>,
    );
    fireEvent.click(row('one') as HTMLElement);
    expect(onClick).toHaveBeenCalled();
    expect(byKey('one')?.dataset['selected']).toBe('');
  });

  it('lets an application set the defaults once', () => {
    const { container } = render(
      <TreeDefaultsProvider size="lg" variant="plain" expandOn="expander">
        <Files />
      </TreeDefaultsProvider>,
    );
    const root = container.querySelector("[data-ui='tree']") as HTMLElement;
    expect(root.dataset['size']).toBe('lg');
    expect(root.dataset['variant']).toBe('plain');
    expect(root.dataset['expandOn']).toBe('expander');
  });

  it('lets one tree state its own value against the provider', () => {
    const { container } = render(
      <TreeDefaultsProvider size="lg">
        <Files size="sm" />
      </TreeDefaultsProvider>,
    );
    expect((container.querySelector("[data-ui='tree']") as HTMLElement).dataset['size']).toBe('sm');
  });
});

describe('the composed shape', () => {
  it('counts the depth from the markup rather than from the consumer', () => {
    render(
      <Tree aria-label="Composed" defaultExpandedKeys={['a']}>
        <TreeNode value="a" label="A">
          <TreeNode value="b" label="B" />
        </TreeNode>
      </Tree>,
    );
    expect(byKey('a')?.dataset['depth']).toBe('0');
    expect(byKey('b')?.dataset['depth']).toBe('1');
  });

  it('stays nested however the structure axis is set', () => {
    const { container } = render(
      <Tree aria-label="Composed" structure="flat">
        <TreeNode value="a" label="A" />
      </Tree>,
    );
    expect((container.querySelector("[data-ui='tree']") as HTMLElement).dataset['structure']).toBe(
      'nested',
    );
  });

  it('opens only the branch the chevron was pressed on', () => {
    render(
      <Tree aria-label="Composed" expandOn="expander">
        <TreeNode value="a" label="A">
          <TreeNode value="b" label="B" />
        </TreeNode>
      </Tree>,
    );
    const expander = byKey('a')?.querySelector("[data-part='expander']") as HTMLElement;
    fireEvent.click(expander);
    expect(byKey('b')).not.toBeNull();
    expect(byKey('a')?.dataset['selected']).toBeUndefined();
  });
});

describe('the window', () => {
  const MANY = Array.from({ length: 400 }, (_, index) => ({
    id: `row-${index}`,
    name: `Row ${index}`,
  }));

  /**
   * A window renders a slice, and a slice cannot preserve nesting — so the
   * windowed tree writes the three properties the pattern requires under
   * exactly that condition and carries no group at all.
   */
  it('lays the rows flat and states each level', () => {
    const { container } = render(
      <Tree
        aria-label="Many"
        nodes={MANY}
        getKey={(entry: { id: string }) => entry.id}
        getLabel={(entry: { name: string }) => entry.name}
        virtual
        itemSize={32}
      />,
    );
    const root = container.querySelector("[data-ui='tree']") as HTMLElement;
    expect(root.dataset['structure']).toBe('flat');
    expect(tree().querySelector("[data-part='group']")).toBeNull();
    expect(byKey('row-0')?.getAttribute('aria-level')).toBe('1');
    expect(byKey('row-0')?.getAttribute('aria-setsize')).toBe('400');
  });

  it('renders a slice rather than four hundred rows', () => {
    render(
      <Tree
        aria-label="Many"
        nodes={MANY}
        getKey={(entry: { id: string }) => entry.id}
        getLabel={(entry: { name: string }) => entry.name}
        virtual
        itemSize={32}
      />,
    );
    expect(items().length).toBeLessThan(MANY.length);
  });

  /** The canvas states the height of the list it holds a slice of. */
  it('sizes the canvas from the whole list', () => {
    render(
      <Tree
        aria-label="Many"
        nodes={MANY}
        getKey={(entry: { id: string }) => entry.id}
        getLabel={(entry: { name: string }) => entry.name}
        virtual
        itemSize={32}
      />,
    );
    expect(tree().style.getPropertyValue('--_canvas-size')).toBe(`${400 * 32}px`);
  });

  /** A rotating tab stop cannot survive its own element being recycled. */
  it('names the active node rather than moving a tab stop into the window', () => {
    render(
      <Tree
        aria-label="Many"
        nodes={MANY}
        getKey={(entry: { id: string }) => entry.id}
        getLabel={(entry: { name: string }) => entry.name}
        virtual
        itemSize={32}
        defaultActiveKey="row-0"
      />,
    );
    const { container } = { container: document.body };
    const root = container.querySelector("[data-ui='tree']") as HTMLElement;
    expect(root.dataset['focusMode']).toBe('activedescendant');
    expect(tree().getAttribute('aria-activedescendant')).toBe(byKey('row-0')?.id);
    expect(byKey('row-0')?.hasAttribute('tabindex')).toBe(false);
  });

  /**
   * An `aria-activedescendant` whose target has been recycled names an id that
   * is not in the document, and the reader is then operating a widget with no
   * focused node at all.
   */
  it('keeps the active node rendered when the window has moved past it', () => {
    render(
      <Tree
        aria-label="Many"
        nodes={MANY}
        getKey={(entry: { id: string }) => entry.id}
        getLabel={(entry: { name: string }) => entry.name}
        virtual
        itemSize={32}
        defaultActiveKey="row-399"
      />,
    );
    const node = byKey('row-399');
    expect(node).not.toBeNull();
    expect(node?.dataset['pinned']).toBe('');
    expect(node?.style.getPropertyValue('--slotted-tree-row-offset')).toBe(`${399 * 32}px`);
  });
});

describe('the first paint of a window', () => {
  const MANY = Array.from({ length: 400 }, (_, index) => ({
    id: `row-${index}`,
    name: `Row ${index}`,
  }));

  /**
   * A viewport of nought renders a window of one row. Measured after the paint,
   * that one row is what a reader is shown first — and a tree of four hundred
   * that opens showing its first name is a tree that looks broken until the
   * reader nudges it.
   */
  it('renders more than one row before anything is scrolled', () => {
    const { container } = render(
      <Tree
        aria-label="Many"
        nodes={MANY}
        getKey={(entry: { id: string }) => entry.id}
        getLabel={(entry: { name: string }) => entry.name}
        virtual
        itemSize={32}
      />,
    );
    const root = container.querySelector("[data-ui='tree']") as HTMLElement;
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 416 });
    fireEvent.scroll(root);
    expect(items().length).toBeGreaterThan(1);
  });
});
