# @slotted/react

Idiomatic React components for Slotted. This workspace package is private and remains unpublished while the initial component system is being built.

Import components through their public subpath and load the package stylesheet once in the consuming application:

```tsx
import { Button } from '@slotted/react/button';
import '@slotted/react/styles.css';

export function Actions() {
  return <Button>Save</Button>;
}
```

The component structure and behavior belong to this package. Product-level visual decisions come from an installed Slotted theme through CSS custom properties.
