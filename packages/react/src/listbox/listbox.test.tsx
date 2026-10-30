import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/listbox/contract.json';
import { Glyph, Icon } from '../icon';
import { Listbox } from './listbox';
import { ListboxDefaultsProvider } from './listbox-defaults';
import {
  ListboxGroup,
  ListboxIcon,
  ListboxIndicator,
  ListboxLabel,
  ListboxMeta,
  ListboxOption,
} from './listbox-parts';
import type { ListboxHandle, ListboxProps, ListboxValue } from './listbox.types';

const REGIONS = ['africa', 'asia', 'europe', 'oceania', 'americas'];

const box = () => screen.getByRole('listbox');
const options = () => screen.getAllByRole('option');
const option = (index: number) => options()[index] as HTMLElement;
const byKey = (key: string) =>
  box().querySelector<HTMLElement>(`[data-key="${key}"]`) as HTMLElement;

function Regions({
  disabledKeys = [],
  ...props
}: Partial<ListboxProps> & { disabledKeys?: string[] }) {
  return (
    <Listbox aria-label="Region" {...props}>
      {REGIONS.map((key) => (
        <ListboxOption
          key={key}
          value={key}
          {...(disabledKeys.includes(key) ? { disabled: true } : {})}
        >
          <ListboxIndicator />
          <ListboxLabel>{key}</ListboxLabel>
        </ListboxOption>
      ))}
    </Listbox>
  );
}

describe('Listbox, identity and wiring', () => {
  it('is selected in public by the family identifier and its parts', () => {
    render(<Regions className="page-picker" />);

    expect(box().tagName).toBe('DIV');
    expect(box()).toHaveAttribute('data-ui', 'listbox');
    expect(box()).toHaveAttribute('data-part', 'root');
    expect(box()).toHaveClass('page-picker');
    expect(option(0)).toHaveAttribute('data-part', 'option');
    expect(option(0).querySelector("[data-part='indicator']")).not.toBeNull();
  });

  it('declares the axes it was given, so a stylesheet can reach every one', () => {
    render(<Regions size="lg" variant="plain" orientation="horizontal" indicator="none" />);

    expect(box()).toHaveAttribute('data-size', 'lg');
    expect(box()).toHaveAttribute('data-variant', 'plain');
    expect(box()).toHaveAttribute('data-orientation', 'horizontal');
    expect(box()).toHaveAttribute('data-indicator', 'none');
    expect(box()).toHaveAttribute('aria-orientation', 'horizontal');
  });

  /** `vertical` is the role's own default, so writing it says nothing twice. */
  it('writes aria-orientation only when the options are not vertical', () => {
    render(<Regions />);
    expect(box()).not.toHaveAttribute('aria-orientation');
  });

  it('says it takes more than one choice only when it does', () => {
    const { rerender } = render(<Regions />);
    expect(box()).not.toHaveAttribute('aria-multiselectable');

    rerender(<Regions selectionMode="multiple" />);
    expect(box()).toHaveAttribute('aria-multiselectable', 'true');
  });

  /** The pattern forbids a listbox that carries both attributes. */
  it('indicates selection with aria-selected and never with aria-checked', () => {
    render(<Regions defaultValue="europe" />);

    expect(byKey('europe')).toHaveAttribute('aria-selected', 'true');
    expect(byKey('africa')).toHaveAttribute('aria-selected', 'false');
    for (const node of options()) expect(node).not.toHaveAttribute('aria-checked');
  });

  it('drops aria-selected entirely when nothing can be chosen', () => {
    render(<Regions selectionMode="none" />);
    for (const node of options()) expect(node).not.toHaveAttribute('aria-selected');
  });

  it('drops the indicator when the axis says the ground is enough', () => {
    render(<Regions indicator="none" defaultValue="europe" />);
    expect(byKey('europe').querySelector("[data-part='indicator']")).toBeNull();
  });

  /** The option's own artwork is content the column holds; no stylesheet fills it. */
  it('holds the artwork it is given in the icon column', () => {
    render(
      <Listbox aria-label="Region">
        <ListboxOption value="europe">
          <ListboxIcon>
            <Icon>
              <Glyph name="dot" />
            </Icon>
          </ListboxIcon>
          <ListboxLabel>europe</ListboxLabel>
        </ListboxOption>
      </Listbox>,
    );
    const mark = byKey('europe').querySelector("[data-part='icon'] > [data-ui='icon'] > svg");
    expect(mark).toHaveAttribute('data-glyph', 'dot');
  });

  /** The tick is an element, not a mask: an svg glyph inside the icon box. */
  it('draws the tick as a check glyph inside the indicator', () => {
    render(<Regions defaultValue="europe" />);
    const indicator = byKey('europe').querySelector("[data-part='indicator']");
    expect(indicator?.querySelector("[data-ui='icon'] > svg[data-glyph='check']")).not.toBeNull();
  });
});

describe('Listbox, single selection', () => {
  /**
   * CB11 verified from this family's side: the root holds focus and
   * `aria-activedescendant` names the option, so the option refuses the press
   * that would take focus off it. The rule was already here; this is its guard.
   */
  it('refuses the press that would move focus off the root', () => {
    render(<Regions defaultValue="africa" />);

    const moved = fireEvent.pointerDown(byKey('europe'));

    expect(moved).toBe(false);
    fireEvent.click(byKey('europe'));
    expect(byKey('europe')).toHaveAttribute('data-selected', '');
  });

  it('replaces whatever was chosen', () => {
    render(<Regions defaultValue="africa" />);

    fireEvent.click(byKey('europe'));
    expect(byKey('europe')).toHaveAttribute('data-selected', '');
    expect(byKey('africa')).not.toHaveAttribute('data-selected');
  });

  it('lets the reader unchoose by pressing the chosen option again', () => {
    render(<Regions defaultValue="europe" />);

    fireEvent.click(byKey('europe'));
    expect(byKey('europe')).not.toHaveAttribute('data-selected');
  });

  it('refuses to empty itself when the consumer says it may not', () => {
    render(<Regions defaultValue="europe" disallowEmptySelection />);

    fireEvent.click(byKey('europe'));
    expect(byKey('europe')).toHaveAttribute('data-selected', '');
  });

  it('reports one key rather than a set', () => {
    const onValueChange = vi.fn();
    render(<Regions onValueChange={onValueChange} />);

    fireEvent.click(byKey('asia'));
    expect(onValueChange.mock.calls[0]?.[0]).toBe('asia');
  });
});

describe('Listbox, multiple selection', () => {
  const Multi = (props: Partial<ListboxProps>) => <Regions selectionMode="multiple" {...props} />;

  it('adds and removes one option at a time with no modifier held', () => {
    render(<Multi />);

    fireEvent.click(byKey('asia'));
    fireEvent.click(byKey('europe'));
    expect(byKey('asia')).toHaveAttribute('data-selected', '');
    expect(byKey('europe')).toHaveAttribute('data-selected', '');

    fireEvent.click(byKey('asia'));
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
  });

  it('reports the set in the collection order rather than the order picked', () => {
    const onValueChange = vi.fn();
    render(<Multi onValueChange={onValueChange} />);

    fireEvent.click(byKey('oceania'));
    fireEvent.click(byKey('africa'));
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual(['africa', 'oceania']);
  });

  it('selects a range from the anchor with Shift held', () => {
    render(<Multi />);

    fireEvent.click(byKey('asia'));
    fireEvent.click(byKey('oceania'), { shiftKey: true });
    for (const key of ['asia', 'europe', 'oceania']) {
      expect(byKey(key)).toHaveAttribute('data-selected', '');
    }
    expect(byKey('africa')).not.toHaveAttribute('data-selected');
  });

  /** The pattern's optional shortcut, and its optional second half. */
  it('selects everything with the accelerator, and clears on the second press', () => {
    render(<Multi />);

    fireEvent.keyDown(box(), { key: 'a', ctrlKey: true });
    expect(options().every((node) => node.hasAttribute('data-selected'))).toBe(true);

    fireEvent.keyDown(box(), { key: 'a', ctrlKey: true });
    expect(options().some((node) => node.hasAttribute('data-selected'))).toBe(false);
  });

  it('refuses the accelerator when the consumer has turned it off', () => {
    render(<Multi disallowSelectAll />);

    fireEvent.keyDown(box(), { key: 'a', ctrlKey: true });
    expect(options().some((node) => node.hasAttribute('data-selected'))).toBe(false);
  });

  it('moves and toggles with Shift and an arrow', () => {
    render(<Multi />);

    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: 'ArrowDown', shiftKey: true });
    expect(byKey('asia')).toHaveAttribute('data-selected', '');
    expect(byKey('africa')).not.toHaveAttribute('data-selected');
  });
});

describe('Listbox, the alternative selection model', () => {
  const Replace = (props: Partial<ListboxProps>) => (
    <Regions selectionMode="multiple" selectionBehavior="replace" {...props} />
  );

  it('makes a plain press the whole selection', () => {
    render(<Replace defaultValue={['africa', 'asia']} />);

    fireEvent.click(byKey('europe'));
    expect(byKey('europe')).toHaveAttribute('data-selected', '');
    expect(byKey('africa')).not.toHaveAttribute('data-selected');
  });

  /** The one press that says "this one as well", and it means that in both models. */
  it('adds one with the accelerator held', () => {
    render(<Replace defaultValue={['africa']} />);

    fireEvent.click(byKey('europe'), { ctrlKey: true });
    expect(byKey('africa')).toHaveAttribute('data-selected', '');
    expect(byKey('europe')).toHaveAttribute('data-selected', '');
  });

  it('moves without selecting when the accelerator is held', () => {
    render(<Replace defaultValue={['africa']} />);

    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: 'ArrowDown', ctrlKey: true });
    expect(byKey('asia')).toHaveAttribute('data-current', '');
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
  });
});

describe('Listbox, the keyboard', () => {
  it('lands on the chosen option when focus arrives, and on the first when none is', () => {
    const { unmount } = render(<Regions defaultValue="europe" />);
    fireEvent.focus(box());
    expect(byKey('europe')).toHaveAttribute('data-current', '');
    unmount();

    render(<Regions />);
    fireEvent.focus(box());
    expect(byKey('africa')).toHaveAttribute('data-current', '');
  });

  it('moves along the block axis and stops at the ends', () => {
    render(<Regions />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('asia')).toHaveAttribute('data-current', '');

    fireEvent.keyDown(box(), { key: 'ArrowUp' });
    expect(byKey('africa')).toHaveAttribute('data-current', '');

    fireEvent.keyDown(box(), { key: 'ArrowUp' });
    expect(byKey('africa')).toHaveAttribute('data-current', '');
  });

  it('wraps only when the consumer asked it to', () => {
    render(<Regions loop />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'ArrowUp' });
    expect(byKey('americas')).toHaveAttribute('data-current', '');
  });

  it('goes to the ends with Home and End', () => {
    render(<Regions />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'End' });
    expect(byKey('americas')).toHaveAttribute('data-current', '');

    fireEvent.keyDown(box(), { key: 'Home' });
    expect(byKey('africa')).toHaveAttribute('data-current', '');
  });

  it('travels a page at a time and clamps rather than wrapping', () => {
    render(<Regions pageSize={3} />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'PageDown' });
    expect(byKey('oceania')).toHaveAttribute('data-current', '');

    fireEvent.keyDown(box(), { key: 'PageDown' });
    expect(byKey('americas')).toHaveAttribute('data-current', '');
  });

  it('chooses the active option with Space and with Enter', () => {
    const { unmount } = render(<Regions />);
    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: ' ' });
    expect(byKey('africa')).toHaveAttribute('data-selected', '');
    unmount();

    render(<Regions />);
    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(byKey('africa')).toHaveAttribute('data-selected', '');
  });

  it('moves the selection with focus only when asked', () => {
    const { unmount } = render(<Regions />);
    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
    unmount();

    render(<Regions selectOnFocus />);
    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('asia')).toHaveAttribute('data-selected', '');
  });

  /** The mirror is read from the element, so a page that only sets `dir` is right. */
  it('reads the inline axis in a horizontal listbox', () => {
    render(<Regions orientation="horizontal" />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'ArrowRight' });
    expect(byKey('asia')).toHaveAttribute('data-current', '');
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('asia')).toHaveAttribute('data-current', '');
  });

  /** A row is `columns` options away, which is one number rather than a layout read. */
  it('steps a row at a time in a two-dimensional arrangement', () => {
    render(<Regions columns={2} />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('europe')).toHaveAttribute('data-current', '');
    fireEvent.keyDown(box(), { key: 'ArrowRight' });
    expect(byKey('oceania')).toHaveAttribute('data-current', '');
    expect(box()).toHaveAttribute('data-layout', 'grid');
  });

  it('finds an option by the characters typed at it', () => {
    render(<Regions />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'e' });
    expect(byKey('europe')).toHaveAttribute('data-current', '');
  });

  it('reads a space as a character once a sequence is open', () => {
    render(
      <Listbox aria-label="Cities">
        <ListboxOption value="a">
          <ListboxLabel>New York</ListboxLabel>
        </ListboxOption>
        <ListboxOption value="b">
          <ListboxLabel>Newark</ListboxLabel>
        </ListboxOption>
      </Listbox>,
    );
    fireEvent.focus(box());

    for (const key of ['n', 'e', 'w', ' ', 'y']) fireEvent.keyDown(box(), { key });
    expect(byKey('a')).toHaveAttribute('data-current', '');
    expect(byKey('a')).not.toHaveAttribute('data-selected');
  });
});

describe('Listbox, disabled and read-only', () => {
  it('keeps a disabled option in the set and skips it by default', () => {
    render(<Regions disabledKeys={['asia']} />);
    fireEvent.focus(box());

    expect(byKey('asia')).toHaveAttribute('aria-disabled', 'true');
    expect(byKey('asia')).not.toHaveAttribute('disabled');
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('europe')).toHaveAttribute('data-current', '');
  });

  it('lands on a disabled option when discoverability matters more', () => {
    render(<Regions disabledKeys={['asia']} navigateDisabled />);
    fireEvent.focus(box());

    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('asia')).toHaveAttribute('data-current', '');
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
  });

  it('never chooses a disabled option, however it is pressed', () => {
    render(<Regions disabledKeys={['asia']} />);

    fireEvent.click(byKey('asia'));
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
  });

  it('answers nothing at all while the whole control is disabled', () => {
    render(<Regions disabled />);

    expect(box()).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(byKey('asia'));
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
  });

  /** `readonly` stays focusable and reachable; it is not `disabled` in a grey coat. */
  it('refuses a change while keeping every option reachable', () => {
    render(<Regions readOnly defaultValue="africa" />);
    fireEvent.focus(box());

    expect(box()).toHaveAttribute('aria-readonly', 'true');
    fireEvent.click(byKey('asia'));
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
    expect(byKey('asia')).toHaveAttribute('data-current', '');
  });
});

describe('Listbox, the controlled and uncontrolled pair', () => {
  it('waits for the consumer while it is controlled', () => {
    render(<Regions value="africa" />);

    fireEvent.click(byKey('asia'));
    expect(byKey('africa')).toHaveAttribute('data-selected', '');
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
  });

  it('moves when the consumer answers', () => {
    function Controlled() {
      const [value, setValue] = useState<ListboxValue>('africa');
      return <Regions value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);

    fireEvent.click(byKey('asia'));
    expect(byKey('asia')).toHaveAttribute('data-selected', '');
  });

  it('carries the reason and the value it replaces', () => {
    const onValueChange = vi.fn();
    render(<Regions defaultValue="africa" onValueChange={onValueChange} />);

    fireEvent.click(byKey('asia'));
    const request = onValueChange.mock.calls[0]?.[1];
    expect(request.reason).toBe('pointer');
    expect(request.previous).toBe('africa');
    expect(request.value).toBe('asia');
    expect(request.source).toBeDefined();
  });

  it('says keyboard when a key moved it', () => {
    const onValueChange = vi.fn();
    render(<Regions onValueChange={onValueChange} />);

    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: ' ' });
    expect(onValueChange.mock.calls[0]?.[1].reason).toBe('keyboard');
  });

  it('lets the consumer refuse a change before anything commits', () => {
    render(<Regions onValueChange={(_value, request) => request.cancel()} />);

    fireEvent.click(byKey('asia'));
    expect(byKey('asia')).not.toHaveAttribute('data-selected');
  });

  it('holds the active option as a value of its own', () => {
    const onActiveKeyChange = vi.fn();
    render(<Regions activeKey="europe" onActiveKeyChange={onActiveKeyChange} />);

    expect(byKey('europe')).toHaveAttribute('data-current', '');
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(onActiveKeyChange).toHaveBeenCalledWith(
      'oceania',
      expect.objectContaining({ reason: 'keyboard' }),
    );
    expect(byKey('europe')).toHaveAttribute('data-current', '');
  });

  it('starts an uncontrolled listbox from the value it was given once', () => {
    const { rerender } = render(<Regions defaultValue="africa" />);
    rerender(<Regions defaultValue="asia" />);
    expect(byKey('africa')).toHaveAttribute('data-selected', '');
  });
});

describe('Listbox, the focus model', () => {
  it('roves the tab stop while the whole set is in the DOM', () => {
    render(<Regions />);

    expect(box()).toHaveAttribute('data-focus-mode', 'roving');
    expect(box()).toHaveAttribute('tabindex', '0');

    fireEvent.focus(box());
    expect(byKey('africa')).toHaveAttribute('tabindex', '0');
    expect(byKey('asia')).toHaveAttribute('tabindex', '-1');
    expect(box()).toHaveAttribute('tabindex', '-1');
    expect(box()).not.toHaveAttribute('aria-activedescendant');
  });

  /**
   * The whole reason the axis exists: an element carrying `tabindex="0"` that
   * is recycled out of the DOM takes focus to the body with it.
   */
  it('names the active option instead of roving once the set is windowed', () => {
    render(
      <Listbox
        aria-label="Cities"
        virtual
        itemSize={32}
        items={REGIONS}
        getKey={(key) => key}
        getLabel={(key) => key}
        renderOption={(key) => <ListboxLabel>{key}</ListboxLabel>}
        defaultActiveKey="asia"
      />,
    );

    expect(box()).toHaveAttribute('data-focus-mode', 'activedescendant');
    expect(box()).toHaveAttribute('tabindex', '0');
    expect(box().getAttribute('aria-activedescendant')).toBe(byKey('asia').id);
  });

  it('takes the model the consumer states over the one it would have read', () => {
    render(<Regions focusMode="activedescendant" defaultActiveKey="asia" />);

    expect(box()).toHaveAttribute('data-focus-mode', 'activedescendant');
    expect(box().getAttribute('aria-activedescendant')).toBe(byKey('asia').id);
  });
});

describe('Listbox, a collection it was handed', () => {
  const CITIES = [
    { id: 'oslo', name: 'Oslo' },
    { id: 'bergen', name: 'Bergen' },
    { id: 'tromso', name: 'Tromsø' },
  ];

  const Cities = (props: Partial<ListboxProps<(typeof CITIES)[number]>>) => (
    <Listbox
      aria-label="Cities"
      items={CITIES}
      getKey={(city) => city.id}
      getLabel={(city) => city.name}
      renderOption={(city) => <ListboxLabel>{city.name}</ListboxLabel>}
      {...props}
    />
  );

  it('renders one option per item, keyed by what the consumer said', () => {
    render(<Cities />);
    expect(options()).toHaveLength(3);
    expect(byKey('tromso')).toHaveTextContent('Tromsø');
  });

  /**
   * The pattern asks for the pair exactly when the whole set is not in the DOM,
   * which is what a `totalCount` says and what windowing produces.
   */
  it('tells the reader how large the set is when only part of it has loaded', () => {
    render(<Cities totalCount={4000} />);

    expect(byKey('oslo')).toHaveAttribute('aria-setsize', '4000');
    expect(byKey('oslo')).toHaveAttribute('aria-posinset', '1');
    expect(byKey('tromso')).toHaveAttribute('aria-posinset', '3');
  });

  /**
   * With declarative children the whole set is in the DOM and the platform
   * counts it. A number React could only read from the DOM would be nothing on
   * the server and a count on the client, which is a hydration mismatch.
   */
  it('writes neither when the whole set is already in the DOM', () => {
    render(<Regions />);
    expect(option(0)).not.toHaveAttribute('aria-setsize');
    expect(option(0)).not.toHaveAttribute('aria-posinset');
  });

  it('says what it holds when it holds nothing', () => {
    render(<Cities items={[]} emptyContent="No city matches that name." />);
    expect(screen.getByText('No city matches that name.')).toHaveAttribute('data-part', 'empty');
  });

  it('asks for another page once the end of the loaded set is rendered', () => {
    const onLoadMore = vi.fn();
    render(<Cities hasMore loading={false} onLoadMore={onLoadMore} loaderContent="Loading…" />);

    expect(onLoadMore).toHaveBeenCalled();
    expect(screen.getByText('Loading…')).toHaveAttribute('data-part', 'loader');
  });

  it('does not ask again while a request is already out', () => {
    const onLoadMore = vi.fn();
    render(<Cities hasMore loading onLoadMore={onLoadMore} />);
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});

describe('Listbox, groups', () => {
  it('names a group written by hand, and holds its options inside it', () => {
    render(
      <Listbox aria-label="Fruit">
        <ListboxGroup label="Pome">
          <ListboxOption value="apple">
            <ListboxLabel>Apple</ListboxLabel>
          </ListboxOption>
        </ListboxGroup>
      </Listbox>,
    );

    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('data-part', 'group');
    expect(group).toHaveAccessibleName('Pome');
    expect(group.querySelector("[data-part='option']")).not.toBeNull();
  });

  it('names a group built from a collection, and keeps the two index spaces apart', () => {
    render(
      <Listbox
        aria-label="Fruit"
        sections={[
          { key: 'pome', label: 'Pome', items: ['Apple', 'Pear'] },
          { key: 'berry', label: 'Berry', items: ['Gooseberry'] },
        ]}
        getKey={(name) => name as string}
        getLabel={(name) => name as string}
        renderOption={(name) => <ListboxLabel>{name as string}</ListboxLabel>}
        totalCount={3}
      />,
    );

    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAccessibleName('Pome');
    expect(options()).toHaveLength(3);
    expect(byKey('Gooseberry')).toHaveAttribute('aria-posinset', '3');
  });
});

describe('Listbox, forms and the field around it', () => {
  it('submits one hidden input per chosen key', () => {
    render(<Regions selectionMode="multiple" name="region" defaultValue={['africa', 'asia']} />);

    const hidden = box().querySelectorAll<HTMLInputElement>('input[type="hidden"]');
    expect([...hidden].map((input) => input.value)).toEqual(['africa', 'asia']);
    expect(hidden[0]?.name).toBe('region');
  });

  it('says it is required and invalid when it is', () => {
    render(<Regions required invalid />);

    expect(box()).toHaveAttribute('aria-required', 'true');
    expect(box()).toHaveAttribute('aria-invalid', 'true');
    expect(box()).toHaveAttribute('data-required', '');
    expect(box()).toHaveAttribute('data-invalid', '');
  });

  it('says it is still filling', () => {
    render(<Regions loading />);
    expect(box()).toHaveAttribute('aria-busy', 'true');
    expect(box()).toHaveAttribute('data-loading', '');
  });
});

describe('Listbox, composition and escape hatches', () => {
  it('takes an application default and still lets an instance win', () => {
    render(
      <ListboxDefaultsProvider size="sm" variant="plain">
        <Regions />
        <Regions size="lg" aria-label="Second" />
      </ListboxDefaultsProvider>,
    );

    const boxes = screen.getAllByRole('listbox');
    expect(boxes[0]).toHaveAttribute('data-size', 'sm');
    expect(boxes[0]).toHaveAttribute('data-variant', 'plain');
    expect(boxes[1]).toHaveAttribute('data-size', 'lg');
  });

  it('renders the root into another element without losing its wiring', () => {
    render(<Regions render={(props) => <section {...props} />} />);

    expect(box().tagName).toBe('SECTION');
    expect(box()).toHaveAttribute('data-ui', 'listbox');
  });

  it('runs the consumer handler as well as its own', () => {
    const onKeyDown = vi.fn();
    render(<Regions onKeyDown={onKeyDown} />);

    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(byKey('asia')).toHaveAttribute('data-current', '');
  });

  it('lets the consumer handler stop the family from answering', () => {
    render(<Regions onKeyDown={(event) => event.preventDefault()} />);

    fireEvent.focus(box());
    fireEvent.keyDown(box(), { key: 'ArrowDown' });
    expect(byKey('asia')).not.toHaveAttribute('data-current');
  });

  it('reaches the native element and the three actions it cannot express', () => {
    const ref = createRef<HTMLDivElement>();
    const handle = createRef<ListboxHandle>();
    render(<Regions ref={ref} handleRef={handle} defaultActiveKey="europe" />);

    expect(ref.current).toBe(box());
    expect(handle.current?.getElement()).toBe(box());
    expect(handle.current?.getActiveKey()).toBe('europe');

    handle.current?.focus();
    expect(document.activeElement).toBe(byKey('europe'));

    const into = vi.fn();
    byKey('asia').scrollIntoView = into;
    handle.current?.scrollToKey('asia');
    expect(into).toHaveBeenCalled();
  });

  it('passes a native attribute through to the element that owns it', () => {
    render(<Regions id="region-picker" data-testid="picker" />);
    expect(box()).toHaveAttribute('id', 'region-picker');
    expect(box()).toHaveAttribute('data-testid', 'picker');
  });

  it('carries the option value and the label a reader hears', () => {
    render(
      <Listbox aria-label="Plans">
        <ListboxOption value="pro" textValue="Professional">
          <ListboxLabel>Pro</ListboxLabel>
          <ListboxMeta>$20</ListboxMeta>
        </ListboxOption>
      </Listbox>,
    );

    expect(byKey('pro')).toHaveAttribute('data-text-value', 'Professional');
    expect(byKey('pro').querySelector("[data-part='meta']")).toHaveTextContent('$20');
  });
});

describe('Listbox, the contract it answers', () => {
  it('renders every part the contract declares', () => {
    render(
      <Listbox
        aria-label="Everything"
        sections={[{ key: 'one', label: 'One', items: ['a'] }]}
        getKey={(name) => name as string}
        renderOption={() => (
          <>
            <ListboxIndicator />
            <ListboxLabel>a</ListboxLabel>
          </>
        )}
        hasMore
        loaderContent="More"
      />,
    );

    const present = new Set(
      [...box().querySelectorAll('[data-part]')].map((node) => node.getAttribute('data-part')),
    );
    present.add('root');
    for (const part of ['root', 'group', 'group-label', 'option', 'indicator', 'label', 'loader']) {
      expect([...present]).toContain(part);
    }
  });

  it('agrees with the contract about its defaults', () => {
    render(<Regions />);
    const declared = contract.members.listbox.defaults;

    expect(box()).toHaveAttribute('data-size', declared.size);
    expect(box()).toHaveAttribute('data-variant', declared.variant);
    expect(box()).toHaveAttribute('data-orientation', declared.orientation);
    expect(box()).toHaveAttribute('data-indicator', declared.indicator);
    expect(box()).toHaveAttribute('data-focus-mode', 'roving');
  });
});
