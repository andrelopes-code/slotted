# Tabs and Roving Focus Design

## Outcome

The `tabs` family ships in React and Angular, and `@slotted/core` becomes real, carrying its first module: roving focus.

`Tabs` is the first component whose keyboard model both frameworks must implement identically, which is what makes it the right first caller of the shared layer. Focus movement is arithmetic over a list of elements and reads no framework state, so writing it twice would duplicate the part most likely to diverge.

## What `core/focus` Owns, and What It Does Not

The module moves focus and manages `tabindex`. It does not decide what focus means.

That split matters for tabs specifically. The WAI-ARIA pattern allows two activation modes: automatic, where moving focus also selects, and manual, where an arrow key moves focus and `Enter` or `Space` selects. If the module owned selection it would need to know about panels, controlled values, and framework change events. Instead it reports movement, and `Tabs` decides what to do with it.

```ts
createRovingTabindex(
  container: HTMLElement,
  options: {
    itemSelector: string;
    loop?: boolean;                       // default true
    onMove?: (index: number, item: HTMLElement) => void;
    orientation?: () => 'horizontal' | 'vertical';  // default horizontal
  },
): {
  destroy(): void;
  refresh(): void;
  setActive(index: number): void;
};
```

`orientation` is a getter rather than a value because a consumer may change it at runtime, and a getter avoids an `update` call that only one option would need.

The module gives the active item `tabindex="0"` and every other item `tabindex="-1"`, so the group is one tab stop. It handles `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, and `End`, respecting orientation, and skips items carrying `disabled` or `aria-disabled="true"`. `refresh()` re-reads the item list after the caller adds or removes one. `setActive(index)` moves the tab stop without moving focus, which is what a programmatic selection change needs.

Signatures stay malleable until a second caller — `Toolbar`, `Menu`, `Listbox`, or `Tree` — confirms them. Nothing is published.

## Package

`@slotted/core` is created at layer rank 20, already reserved and enforced in `scripts/verify-layers.mjs`. It imports nothing from this repository and no framework. Every export is a pure function or an imperative function that takes an element and returns a disposer, so it is testable in jsdom without React or Angular.

```
packages/core/src/focus/roving-tabindex.ts
```

Subpath exports mirror the modules, so importing roving focus never pulls in what later modules add.

## Family Anatomy

| Member | Native element | Role | Responsibility |
| --- | --- | --- | --- |
| `tabs` | `div` | — | Owns the selected value, the orientation, and the identifiers |
| `tabList` | `div` | `tablist` | Hosts the roving tab stop |
| `tab` | `button` | `tab` | Selects its panel; carries `aria-selected` and `aria-controls` |
| `tabPanel` | `div` | `tabpanel` | Labelled by its tab; one tab stop when selected |

Identifiers derive from one base, as in the field family: `<base>-tab-<value>` and `<base>-panel-<value>`. A tab's `aria-controls` and a panel's `aria-labelledby` therefore resolve without registration or ordering between siblings.

## Activation

Both modes, `automatic` by default, which is what the WAI-ARIA pattern recommends when revealing a panel is cheap.

- `automatic`: arrow keys move focus and select in the same step.
- `manual`: arrow keys move focus only; `Enter` or `Space` selects.

`manual` exists because a panel whose content is expensive to render should not be built on every arrow press. That is a real requirement for dense applications, and it is one property rather than a second component.

## Selection

React offers the controlled and uncontrolled duality of PRD §28.8: `defaultValue`, or `value` with `onValueChange`. Angular exposes a `value` model input, so `[(value)]` works and `valueChange` fires.

Values are strings the consumer chooses. The library mints no indices: an index-keyed API breaks whenever a tab is inserted.

## Panels

Every panel stays mounted, and an unselected one carries the `hidden` attribute.

Unmounting would discard state a consumer put inside — a half-filled form, a scroll position, an open dialog — and recovering it would become the consumer's problem in every application. Keeping panels mounted costs render time on first paint, which a consumer who cares can avoid by rendering their own conditional content inside the panel. The reverse is not available to them.

## States

`selected` and `disabled` on `tab`, both already in the shared vocabulary as `data-selected` and `data-disabled`. `orientation` becomes a family-level axis, as `buttonGroup` already models it.

## Styling

`@slotted/styles/tabs/tabs.css`, authored once, consumed by both frameworks, with its token list verified against the stylesheet.

Overflow uses scroll affordances, never a menu: the catalog records that `Menu` sits three tiers later, and an overflow menu is additive to the parts contract rather than structural, so it can arrive without breaking anything.

## Testing

- `@slotted/core` in jsdom, with no framework: arrow movement in both orientations, `Home` and `End`, looping and clamping, disabled items skipped, `tabindex` maintained, `destroy` removing listeners.
- Contract, through `assertContractShape` plus the family's own assertions.
- Behaviour per framework: identifiers, `aria-controls` and `aria-labelledby` resolving, both activation modes, controlled and uncontrolled selection, panels hidden rather than unmounted.
- Style and tokens, in `@slotted/styles`.
- Storybook, one page per framework, driven by the contract's scenarios.

## Out of Scope

Overflow affordances, closable tabs, and drag reordering. Each needs a real requirement before entering, per PRD §39.
