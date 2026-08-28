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

The component structure and behavior belong to this package. Product-level visual decisions come from an installed Slotted theme through CSS custom properties.
