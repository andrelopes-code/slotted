import { NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/tree/contract.json';
import { SlTree } from './tree';
import type { TreeChangeRequest, TreeExpansionRequest, TreeValue } from './tree';
import { provideTreeDefaults } from './tree-defaults';
import { SlTreeGroup, SlTreeIcon, SlTreeMeta, SlTreeNode } from './tree-parts';

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

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SlTree, SlTreeIcon, SlTreeMeta, SlTreeNode],
  template: `<div
    slTree
    aria-label="Files"
    [nodes]="roots"
    [getKey]="key"
    [getLabel]="name"
    [getChildren]="children"
    [hasChildren]="branch"
    [isNodeDisabled]="locked"
    [isNodeLoading]="fetching"
    [selectionMode]="selectionMode()"
    [selectionCascade]="cascade()"
    [structure]="structure()"
    [navigateDisabled]="navigateDisabled()"
    [query]="query()"
    [(expandedKeys)]="expanded"
    [(value)]="value"
    [(activeKey)]="activeKey"
    (valueRequest)="requests.push($event)"
    (expandedKeysRequest)="expansions.push($event)"
  ></div>`,
})
class Host {
  readonly roots = ROOTS;
  readonly key = (entry: Entry) => entry.id;
  readonly name = (entry: Entry) => entry.name;
  readonly children = (entry: Entry) => entry.entries;
  readonly branch = (entry: Entry) => entry.entries !== undefined || entry.more !== undefined;
  readonly locked = (entry: Entry) => entry.locked === true;
  readonly fetching = (entry: Entry) => entry.id === this.loadingKey();

  readonly selectionMode = signal<'none' | 'single' | 'multiple'>('single');
  readonly cascade = signal<'none' | 'descendants'>('none');
  readonly structure = signal<'auto' | 'nested' | 'flat'>('auto');
  readonly navigateDisabled = signal(false);
  readonly query = signal<string | undefined>(undefined);
  readonly loadingKey = signal<string | undefined>(undefined);

  readonly expanded = signal<readonly string[]>(['src', 'lib']);
  readonly value = signal<TreeValue>(null);
  readonly activeKey = signal<string | null>(null);
  readonly requests: TreeChangeRequest[] = [];
  readonly expansions: TreeExpansionRequest[] = [];
}

function mount() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector("[data-ui='tree']") as HTMLElement;
  const canvas = root.querySelector("[data-part='canvas']") as HTMLElement;
  const byKey = (key: string) => root.querySelector<HTMLElement>(`[data-key="${key}"]`);
  const rowOf = (key: string) => byKey(key)?.querySelector<HTMLElement>("[data-part='row']");
  const keys = () =>
    [...root.querySelectorAll<HTMLElement>("[data-part='node']")].map(
      (node) => node.dataset['key'],
    );
  const press = (key: string, init: MouseEventInit = {}) => {
    rowOf(key)?.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
    fixture.detectChanges();
  };
  const type = (key: string, init: KeyboardEventInit = {}) => {
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
    fixture.detectChanges();
  };
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    canvas,
    byKey,
    rowOf,
    keys,
    press,
    type,
  };
}

describe('the shape it renders', () => {
  it('writes the identifier and the parts the contract declares', () => {
    const { root, canvas } = mount();
    expect(root.dataset['part']).toBe('root');
    expect(canvas.getAttribute('role')).toBe('tree');
    expect(canvas.dataset['part']).toBe('canvas');
    for (const part of ['node', 'row', 'label', 'expander', 'guide']) {
      expect(root.querySelector(`[data-part='${part}']`)).not.toBeNull();
    }
    expect(contract.members.tree.parts).toContain('canvas');
  });

  /** The chevron is the Glyph element on a branch, and a leaf's box stays empty. */
  it('draws the chevron on every branch and nothing on a leaf', () => {
    const { byKey } = mount();
    const chevron = (key: string) =>
      byKey(key)?.querySelector(
        ":scope > [data-part='row'] > [data-part='expander'] > [data-ui='icon'] > svg[data-glyph]",
      );
    expect(chevron('src')?.getAttribute('data-glyph')).toBe('chevron-right');
    expect(chevron('index.ts')).toBeNull();
    expect(
      byKey('index.ts')?.querySelector(":scope > [data-part='row'] > [data-part='expander']"),
    ).not.toBeNull();
  });

  it('holds only what is open, in reading order', () => {
    const { host, fixture, keys } = mount();
    host.expanded.set(['src']);
    fixture.detectChanges();
    expect(keys()).toEqual(['src', 'index.ts', 'lib', 'docs', 'readme.md']);
  });

  /** A leaf carrying `aria-expanded` is announced as a parent. */
  it('gives aria-expanded to branches and to nothing else', () => {
    const { byKey } = mount();
    expect(byKey('src')?.getAttribute('aria-expanded')).toBe('true');
    expect(byKey('docs')?.getAttribute('aria-expanded')).toBe('false');
    expect(byKey('index.ts')?.hasAttribute('aria-expanded')).toBe(false);
  });

  it('names every node from its own label and never from its subtree', () => {
    const { byKey } = mount();
    const node = byKey('src') as HTMLElement;
    const label = node.querySelector("[data-part='label']") as HTMLElement;
    expect(node.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.textContent?.trim()).toBe('src');
  });

  /** With the nesting in the DOM the browser computes all three. */
  it('writes no level properties while the nesting is there to be read', () => {
    const { byKey } = mount();
    expect(byKey('lib')?.hasAttribute('aria-level')).toBe(false);
    expect(byKey('lib')?.hasAttribute('aria-setsize')).toBe(false);
  });

  it('states the level itself once the rows are laid flat', () => {
    const { host, fixture, byKey } = mount();
    host.structure.set('flat');
    fixture.detectChanges();
    expect(byKey('lib')?.getAttribute('aria-level')).toBe('2');
    expect(byKey('lib')?.getAttribute('aria-setsize')).toBe('2');
    expect(byKey('lib')?.getAttribute('aria-posinset')).toBe('2');
  });
});

describe('expansion', () => {
  it('opens a closed branch with the forward arrow and does not move', () => {
    const { host, fixture, type, byKey } = mount();
    host.expanded.set([]);
    host.activeKey.set('docs');
    fixture.detectChanges();
    type('ArrowRight');
    expect(byKey('docs')?.getAttribute('aria-expanded')).toBe('true');
    expect(host.activeKey()).toBe('docs');
  });

  it('moves into an open branch with the second press', () => {
    const { host, fixture, type } = mount();
    host.expanded.set(['src']);
    host.activeKey.set('src');
    fixture.detectChanges();
    type('ArrowRight');
    expect(host.activeKey()).toBe('index.ts');
  });

  it('closes an open branch with the backward arrow', () => {
    const { host, fixture, type, byKey } = mount();
    host.activeKey.set('lib');
    fixture.detectChanges();
    type('ArrowLeft');
    expect(byKey('lib')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('walks to the parent from a leaf', () => {
    const { host, fixture, type } = mount();
    host.activeKey.set('index.ts');
    fixture.detectChanges();
    type('ArrowLeft');
    expect(host.activeKey()).toBe('src');
  });

  it('opens every sibling at the level with the asterisk', () => {
    const { host, fixture, type, byKey } = mount();
    host.expanded.set([]);
    host.activeKey.set('readme.md');
    fixture.detectChanges();
    type('*');
    expect(byKey('src')?.getAttribute('aria-expanded')).toBe('true');
    expect(byKey('docs')?.getAttribute('aria-expanded')).toBe('true');
  });

  /** The active node moves to the branch before the DOM loses the row. */
  it('takes the keyboard with it when a branch closes under it', () => {
    const { host, fixture, press, byKey } = mount();
    host.activeKey.set('a.ts');
    fixture.detectChanges();
    press('lib');
    expect(byKey('a.ts')).toBeNull();
    expect(host.activeKey()).toBe('lib');
  });

  it('carries the reason on every request', () => {
    const { host, fixture, type } = mount();
    host.expanded.set([]);
    host.activeKey.set('docs');
    fixture.detectChanges();
    type('ArrowRight');
    expect(host.expansions[0]?.reason).toBe('keyboard');
  });
});

describe('selection', () => {
  it('chooses one node and hands back a scalar', () => {
    const { host, press, byKey } = mount();
    press('index.ts');
    expect(host.value()).toBe('index.ts');
    expect(byKey('index.ts')?.getAttribute('aria-selected')).toBe('true');
  });

  it('hands back the set in multiple, and writes aria-checked instead', () => {
    const { host, fixture, press, byKey } = mount();
    host.selectionMode.set('multiple');
    fixture.detectChanges();
    press('index.ts');
    press('a.ts');
    expect(host.value()).toEqual(['index.ts', 'a.ts']);
    expect(byKey('a.ts')?.getAttribute('aria-checked')).toBe('true');
    expect(byKey('a.ts')?.hasAttribute('aria-selected')).toBe(false);
  });

  /** The pattern forbids a tree carrying both attributes. */
  it('never writes both selection attributes at once', () => {
    const { root } = mount();
    for (const node of root.querySelectorAll("[data-part='node']")) {
      expect(node.hasAttribute('aria-checked') && node.hasAttribute('aria-selected')).toBe(false);
    }
  });

  it('refuses a disabled node', () => {
    const { host, fixture, press } = mount();
    host.selectionMode.set('multiple');
    fixture.detectChanges();
    press('b.ts');
    expect(host.value()).toBeNull();
    expect(host.requests).toHaveLength(0);
  });

  it('toggles with Space', () => {
    const { host, fixture, type, byKey } = mount();
    host.selectionMode.set('multiple');
    host.activeKey.set('index.ts');
    fixture.detectChanges();
    type(' ');
    expect(byKey('index.ts')?.dataset['selected']).toBe('');
    type(' ');
    expect(byKey('index.ts')?.dataset['selected']).toBeUndefined();
  });

  it('carries a reason a consumer can tell apart', () => {
    const { host, fixture, press, type } = mount();
    host.activeKey.set('index.ts');
    fixture.detectChanges();
    press('index.ts');
    expect(host.requests[0]?.reason).toBe('pointer');
    type(' ');
    expect(host.requests[1]?.reason).toBe('keyboard');
  });

  it('steps over a disabled node unless told not to', () => {
    const { host, fixture, type } = mount();
    host.activeKey.set('a.ts');
    fixture.detectChanges();
    type('ArrowDown');
    expect(host.activeKey()).toBe('docs');
    host.navigateDisabled.set(true);
    host.activeKey.set('a.ts');
    fixture.detectChanges();
    type('ArrowDown');
    expect(host.activeKey()).toBe('b.ts');
  });
});

describe('the cascade', () => {
  it('takes every enabled descendant with the branch, and leaves the disabled one', () => {
    const { host, fixture, press } = mount();
    host.selectionMode.set('multiple');
    host.cascade.set('descendants');
    fixture.detectChanges();
    press('src');
    expect(host.value()).not.toContain('b.ts');
    expect(host.value()).toContain('a.ts');
  });

  it('marks a branch that holds part of a selection', () => {
    const { host, fixture, byKey } = mount();
    host.selectionMode.set('multiple');
    host.cascade.set('descendants');
    host.value.set(['index.ts']);
    fixture.detectChanges();
    expect(byKey('src')?.dataset['indeterminate']).toBe('');
    const mark = (key: string) =>
      byKey(key)
        ?.querySelector(":scope > [data-part='row'] > [data-part='indicator'] svg[data-glyph]")
        ?.getAttribute('data-glyph');
    expect(mark('src')).toBe('minus');
    expect(mark('index.ts')).toBe('check');
  });

  it('says a collapsed branch still holds one', () => {
    const { host, fixture, byKey } = mount();
    host.selectionMode.set('multiple');
    host.cascade.set('descendants');
    host.expanded.set(['src']);
    host.value.set(['a.ts']);
    fixture.detectChanges();
    expect(byKey('lib')?.dataset['selectedWithin']).toBe('');
  });
});

describe('what the consumer owns', () => {
  it('paints a branch that is fetching, and busies its group', () => {
    const { host, fixture, byKey } = mount();
    host.loadingKey.set('lib');
    fixture.detectChanges();
    const node = byKey('lib') as HTMLElement;
    expect(node.dataset['loading']).toBe('');
    expect(node.querySelector("[data-part='loader']")).not.toBeNull();
    expect(node.querySelector("[data-part='group']")?.getAttribute('aria-busy')).toBe('true');
  });

  it('keeps the ancestors of a match', () => {
    const { host, fixture, keys } = mount();
    host.expanded.set([]);
    host.query.set('a.ts');
    fixture.detectChanges();
    expect(keys()).toContain('a.ts');
    expect(keys()).toContain('lib');
    expect(keys()).not.toContain('readme.md');
  });
});

describe('the ecosystem', () => {
  /** A tree that holds a choice belongs in a form, and Angular has the seam. */
  it('writes to and reads from a reactive control', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, SlTree],
      template: `<div
        slTree
        aria-label="Files"
        [formControl]="control"
        [nodes]="roots"
        [getKey]="key"
        [getLabel]="name"
        [getChildren]="children"
        [expandedKeys]="['src']"
        required
      ></div>`,
    })
    class FormHost {
      readonly roots = ROOTS;
      readonly key = (entry: Entry) => entry.id;
      readonly name = (entry: Entry) => entry.name;
      readonly children = (entry: Entry) => entry.entries;
      readonly control = new FormControl<TreeValue>(null);
    }

    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector("[data-ui='tree']") as HTMLElement;
    const { control } = fixture.componentInstance;

    expect(control.errors).toEqual({ required: true });

    control.setValue('index.ts');
    fixture.detectChanges();
    expect(root.querySelector<HTMLElement>('[data-key="index.ts"]')?.dataset['selected']).toBe('');

    root
      .querySelector<HTMLElement>('[data-key="src"] [data-part="row"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(control.value).toBe('src');
    expect(control.errors).toBeNull();
  });

  it('lets an application set the defaults once', () => {
    TestBed.configureTestingModule({
      providers: [provideTreeDefaults({ size: 'lg', variant: 'plain', expandOn: 'expander' })],
    });
    const { root } = mount();
    expect(root.dataset['size']).toBe('lg');
    expect(root.dataset['variant']).toBe('plain');
    expect(root.dataset['expandOn']).toBe('expander');
  });
});

describe('the composed shape', () => {
  @Component({
    standalone: true,
    imports: [SlTree, SlTreeGroup, SlTreeNode, SlTreeIcon, SlTreeMeta],
    template: `<div slTree aria-label="Composed" [(expandedKeys)]="expanded">
      <li slTreeNode value="a" label="A">
        <span slTreeIcon>·</span>
        <span slTreeMeta>2</span>
        <ul slTreeGroup>
          <li slTreeNode value="b" label="B"></li>
        </ul>
      </li>
    </div>`,
  })
  class ComposedHost {
    readonly expanded = signal<readonly string[]>(['a']);
  }

  it('counts the depth from the markup rather than from the consumer', () => {
    const fixture = TestBed.createComponent(ComposedHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector<HTMLElement>('[data-key="a"]')?.dataset['depth']).toBe('0');
    expect(root.querySelector<HTMLElement>('[data-key="b"]')?.dataset['depth']).toBe('1');
  });

  /**
   * Angular creates projected content with the parent's own view and only
   * decides where to place it, so a branch that is closed — and whose group is
   * therefore not rendered — is still known to be a branch.
   */
  it('knows a closed branch is a branch', () => {
    const fixture = TestBed.createComponent(ComposedHost);
    fixture.componentInstance.expanded.set([]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const node = root.querySelector<HTMLElement>('[data-key="a"]');
    expect(node?.dataset['branch']).toBe('');
    expect(node?.getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('[data-key="b"]')).toBeNull();
  });

  it('projects the consumer’s own cells into the row', () => {
    const fixture = TestBed.createComponent(ComposedHost);
    fixture.detectChanges();
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-key="a"] [data-part="row"]',
    ) as HTMLElement;
    expect(row.querySelector("[data-part='icon']")).not.toBeNull();
    expect(row.querySelector("[data-part='meta']")?.textContent).toBe('2');
  });
});

/**
 * A hierarchy of unknown depth is written in Angular as one template that calls
 * itself. Every instance of it is declared at the root, so the element injector
 * of a nested node never meets the node it is rendered inside; the depth is the
 * nesting of the document the reader sees.
 */
describe('a recursive template', () => {
  interface Branch {
    id: string;
    children: Branch[];
  }

  @Component({
    standalone: true,
    imports: [NgTemplateOutlet, SlTree, SlTreeGroup, SlTreeNode],
    template: `<div slTree aria-label="Recursive" [expandedKeys]="expanded()">
      <ng-container [ngTemplateOutlet]="branch" [ngTemplateOutletContext]="{ $implicit: roots }" />
      <ng-template #branch let-nodes>
        @for (node of nodes; track node.id) {
          <li
            slTreeNode
            [value]="node.id"
            [label]="node.id"
            [hasChildren]="node.children.length > 0"
          >
            @if (node.children.length > 0) {
              <ul slTreeGroup>
                <ng-container
                  [ngTemplateOutlet]="branch"
                  [ngTemplateOutletContext]="{ $implicit: node.children }"
                />
              </ul>
            }
          </li>
        }
      </ng-template>
    </div>`,
  })
  class RecursiveHost {
    readonly expanded = signal<readonly string[]>([]);
    readonly roots: Branch[] = [
      { id: 'a', children: [{ id: 'b', children: [{ id: 'c', children: [] }] }] },
    ];
  }

  it('counts the depth from the nesting it renders', async () => {
    const fixture = TestBed.createComponent(RecursiveHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.expanded.set(['a', 'b']);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const depth = (key: string) =>
      root.querySelector<HTMLElement>(`[data-key="${key}"]`)?.dataset['depth'];
    expect([depth('a'), depth('b'), depth('c')]).toEqual(['0', '1', '2']);
  });
});
