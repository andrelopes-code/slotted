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

The component structure and behavior belong to this package. Styling comes from `@slotted/react/styles.css` plus a complete installed Slotted theme through CSS custom properties.

| Component      | Supported behavior                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `Button`       | Native action with loading, `fullWidth`, and structured content.                                |
| `ButtonLink`   | Native anchor or narrow router render adapter with disabled-link behavior.                      |
| `IconButton`   | Native icon-only action requiring an explicit accessible name, with loading.                    |
| `ToggleButton` | Native controlled action using `aria-pressed`.                                                  |
| `ButtonGroup`  | `div` with `role="group"`, horizontal/vertical orientation, and non-mutating child composition. |
