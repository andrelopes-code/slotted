# @slotted/angular

Idiomatic Angular components for Slotted. This workspace package is private and remains unpublished while the initial component system is being built.

Import components through their public secondary entrypoint and attach them to their native element:

```ts
import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';

@Component({
  imports: [SlButton],
  template: `<button slButton>Save</button>`,
})
export class Actions {}
```

The button family retains native semantics: use `button[slButton]`, `a[slButtonLink]`,
`button[slIconButton]`, `button[slToggleButton]`, and `div[slButtonGroup]`.

`slButton` and `slIconButton` expose `loading`; this blocks activation without making
the native button disabled, and `loadingText` can replace the visible label. A disabled
`slButtonLink` exposes `aria-disabled`, prevents activation and navigation, and is removed
from the tab sequence. `slToggleButton` is controlled through its `pressed` input and
`pressedChange` output.

```ts
@Component({
  imports: [SlButton, SlButtonGroup, SlButtonLink, SlToggleButton],
  template: `
    <div slButtonGroup aria-label="Editing actions" orientation="horizontal">
      <button slButton [loading]="saving">Save</button>
      <button slToggleButton [pressed]="preview" (pressedChange)="preview = $event">Preview</button>
      <a slButtonLink href="/discard" [disabled]="saving">Discard</a>
    </div>
  `,
})
export class Actions {
  saving = false;
  preview = false;
}
```

The component structure and behavior belong to this package. Product-level visual decisions come from an installed Slotted theme through CSS custom properties.
