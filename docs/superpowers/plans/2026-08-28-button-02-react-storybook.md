# React Button and React Storybook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the native React Button package, prove it against the shared contract, and render its complete initial story matrix in a static React Storybook.

**Architecture:** React owns its component, types, CSS, tests, and colocated stories. Vite emits ESM and CSS, TypeScript emits declarations, Vitest/jsdom checks semantics without a browser, and Storybook consumes the package plus the default theme.

**Tech Stack:** React 19.2.8, TypeScript 6, Vite 8.2.2, Vitest 4.1.11, Testing Library 16.3.3, jsdom 30, Storybook 10.5.10.

---

## Files

- Modify: `packages/react/README.md`
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/tsconfig.build.json`
- Create: `packages/react/vite.config.ts`
- Create: `packages/react/vitest.config.ts`
- Create: `packages/react/src/index.ts`
- Create: `packages/react/src/button/button.constants.ts`
- Create: `packages/react/src/button/button.types.ts`
- Create: `packages/react/src/button/button.tsx`
- Create: `packages/react/src/button/button.css`
- Create: `packages/react/src/button/button.test.tsx`
- Create: `packages/react/src/button/button.styles.test.mjs`
- Create: `packages/react/src/button/button.stories.tsx`
- Create: `packages/react/src/button/button.stories.test.ts`
- Create: `packages/react/src/button/index.ts`
- Create: `apps/storybook-react/package.json`
- Create: `apps/storybook-react/tsconfig.json`
- Create: `apps/storybook-react/.storybook/main.ts`
- Create: `apps/storybook-react/.storybook/preview.tsx`
- Modify: `pnpm-lock.yaml`

### Task 1: Configure a Private, Buildable React Package

- [ ] **Step 1: Replace the directory anchor with a package manifest**

Create `packages/react/package.json`:

```json
{
  "name": "@slotted/react",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/index.js"
    },
    "./button": {
      "types": "./dist/types/button/index.d.ts",
      "import": "./dist/button.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "scripts": {
    "build": "vite build && tsc -p tsconfig.build.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit --pretty false",
    "verify": "pnpm test && pnpm typecheck && pnpm build"
  },
  "peerDependencies": {
    "react": ">=19.2.0 <20"
  },
  "devDependencies": {
    "@storybook/react-vite": "10.5.10",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/node": "24.13.3",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.5",
    "@vitejs/plugin-react": "6.1.1",
    "jsdom": "30.0.1",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "storybook": "10.5.10",
    "vite": "8.2.2",
    "vitest": "4.1.11"
  }
}
```

- [ ] **Step 2: Add TypeScript configurations**

Create `packages/react/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "target": "ES2022",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```

Create `packages/react/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "noEmit": false,
    "outDir": "dist/types",
    "rootDir": "src",
    "types": ["react", "react-dom"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["src/**/*.test.*", "src/**/*.stories.*"]
}
```

- [ ] **Step 3: Add Vite and Vitest configurations**

Create `packages/react/vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      cssFileName: 'styles',
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        button: resolve(import.meta.dirname, 'src/button/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
```

Create `packages/react/vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
  },
});
```

- [ ] **Step 4: Install and confirm the empty package typechecks**

```bash
pnpm install
pnpm --filter @slotted/react typecheck
```

Expected: installation succeeds; typecheck initially fails only because `src` entry files do not exist. Do not commit until Task 2 supplies them.

### Task 2: Test-Drive the Native React Button

- [ ] **Step 1: Define the framework-owned constants and types**

Create `packages/react/src/button/button.constants.ts`:

```ts
export const BUTTON_VARIANTS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_TONES = ['accent', 'neutral', 'danger'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
```

Create `packages/react/src/button/button.types.ts`:

```ts
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
} from './button.constants';

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  leading?: ReactNode;
  size?: ButtonSize;
  tone?: ButtonTone;
  trailing?: ReactNode;
  type?: ButtonType;
  variant?: ButtonVariant;
}
```

- [ ] **Step 2: Write the failing semantic and parity tests**

Create `packages/react/src/button/button.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
} from './button.constants';
import { Button } from './button';

describe('Button', () => {
  it('renders native safe defaults', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.localName).toBe(contract.nativeElement);
    expect(button).toHaveAttribute('data-slotted-component', contract.component);
    expect(button).toHaveAttribute('type', contract.defaults.type);
    expect(button).toHaveAttribute('data-variant', contract.defaults.variant);
    expect(button).toHaveAttribute('data-tone', contract.defaults.tone);
    expect(button).toHaveAttribute('data-size', contract.defaults.size);
  });

  it('forwards native attributes, events, and refs', () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} name="save" type="submit" onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current?.name).toBe('save');
    expect(ref.current?.type).toBe('submit');
  });

  it('renders logical content parts', () => {
    render(<Button leading="L" trailing="T">Label</Button>);
    const button = screen.getByRole('button');
    const parts = [...button.querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );
    expect(parts).toEqual(contract.parts);
  });

  it('preserves native disabled behavior', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('matches the shared contract axes', () => {
    expect(BUTTON_VARIANTS).toEqual(contract.axes.variant);
    expect(BUTTON_TONES).toEqual(contract.axes.tone);
    expect(BUTTON_SIZES).toEqual(contract.axes.size);
  });
});
```

- [ ] **Step 3: Run the focused test and observe failure**

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.test.tsx
```

Expected: FAIL because `./button` does not exist.

- [ ] **Step 4: Implement the minimal component**

Create `packages/react/src/button/button.tsx`:

```tsx
import './button.css';

import type { ButtonProps } from './button.types';

export function Button({
  children,
  className,
  disabled,
  leading,
  size = 'md',
  tone = 'accent',
  trailing,
  type = 'button',
  variant = 'solid',
  ...nativeProps
}: ButtonProps) {
  const classes = ['slotted-button', className].filter(Boolean).join(' ');

  return (
    <button
      {...nativeProps}
      className={classes}
      data-size={size}
      data-slotted-component="button"
      data-state={disabled ? 'disabled' : undefined}
      data-tone={tone}
      data-variant={variant}
      disabled={disabled}
      type={type}
    >
      {leading === undefined ? null : <span data-part="leading">{leading}</span>}
      <span data-part="label">{children}</span>
      {trailing === undefined ? null : <span data-part="trailing">{trailing}</span>}
    </button>
  );
}
```

- [ ] **Step 5: Create entrypoints**

Create `packages/react/src/button/index.ts`:

```ts
export { Button } from './button';
export type {
  ButtonProps,
  ButtonSize,
  ButtonTone,
  ButtonType,
  ButtonVariant,
} from './button.types';
```

Create `packages/react/src/index.ts`:

```ts
export * from './button';
```

- [ ] **Step 6: Run tests before styling**

Create an empty `packages/react/src/button/button.css`, then run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.test.tsx
```

Expected: 5 tests pass.

### Task 3: Implement the Theme-Driven Button CSS

- [ ] **Step 1: Replace the empty stylesheet**

Replace `packages/react/src/button/button.css`:

```css
@layer slotted.components {
  .slotted-button {
    --_solid: var(--slotted-tone-accent-solid);
    --_solid-hover: var(--slotted-tone-accent-solid-hover);
    --_solid-active: var(--slotted-tone-accent-solid-active);
    --_on-solid: var(--slotted-tone-accent-on-solid);
    --_border: var(--slotted-tone-accent-border);
    --_text: var(--slotted-tone-accent-text);
    --_subtle-hover: var(--slotted-tone-accent-subtle-hover);
    --_subtle-active: var(--slotted-tone-accent-subtle-active);

    align-items: center;
    appearance: none;
    border: var(--slotted-control-border-width, 1px) solid transparent;
    border-radius: var(--slotted-control-radius, 4px);
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    font-family: var(--slotted-control-font-family, system-ui, sans-serif);
    font-weight: var(--slotted-control-font-weight, 600);
    gap: var(--slotted-button-gap, 0.5rem);
    justify-content: center;
    line-height: 1;
    text-decoration: none;
    transition:
      background-color var(--slotted-control-transition-duration, 120ms)
        var(--slotted-control-transition-easing, ease),
      border-color var(--slotted-control-transition-duration, 120ms)
        var(--slotted-control-transition-easing, ease),
      color var(--slotted-control-transition-duration, 120ms)
        var(--slotted-control-transition-easing, ease);
    user-select: none;
    white-space: nowrap;
  }

  .slotted-button[data-tone='neutral'] {
    --_solid: var(--slotted-tone-neutral-solid);
    --_solid-hover: var(--slotted-tone-neutral-solid-hover);
    --_solid-active: var(--slotted-tone-neutral-solid-active);
    --_on-solid: var(--slotted-tone-neutral-on-solid);
    --_border: var(--slotted-tone-neutral-border);
    --_text: var(--slotted-tone-neutral-text);
    --_subtle-hover: var(--slotted-tone-neutral-subtle-hover);
    --_subtle-active: var(--slotted-tone-neutral-subtle-active);
  }

  .slotted-button[data-tone='danger'] {
    --_solid: var(--slotted-tone-danger-solid);
    --_solid-hover: var(--slotted-tone-danger-solid-hover);
    --_solid-active: var(--slotted-tone-danger-solid-active);
    --_on-solid: var(--slotted-tone-danger-on-solid);
    --_border: var(--slotted-tone-danger-border);
    --_text: var(--slotted-tone-danger-text);
    --_subtle-hover: var(--slotted-tone-danger-subtle-hover);
    --_subtle-active: var(--slotted-tone-danger-subtle-active);
  }

  .slotted-button[data-variant='solid'] {
    background: var(--_solid, ButtonFace);
    border-color: var(--_solid, ButtonBorder);
    color: var(--_on-solid, ButtonText);
  }

  .slotted-button[data-variant='outline'] {
    background: var(--slotted-button-outline-background, transparent);
    border-color: var(--_border, ButtonBorder);
    color: var(--_text, ButtonText);
  }

  .slotted-button[data-variant='ghost'] {
    background: var(--slotted-button-ghost-background, transparent);
    color: var(--_text, ButtonText);
    text-decoration: var(--slotted-button-ghost-text-decoration, none);
  }

  .slotted-button[data-variant='solid']:hover:not(:disabled) {
    background: var(--_solid-hover, Highlight);
    border-color: var(--_solid-hover, Highlight);
  }

  .slotted-button[data-variant='solid']:active:not(:disabled) {
    background: var(--_solid-active, Highlight);
    border-color: var(--_solid-active, Highlight);
  }

  .slotted-button:is([data-variant='outline'], [data-variant='ghost']):hover:not(:disabled) {
    background: var(--_subtle-hover, color-mix(in srgb, currentColor 10%, transparent));
  }

  .slotted-button:is([data-variant='outline'], [data-variant='ghost']):active:not(:disabled) {
    background: var(--_subtle-active, color-mix(in srgb, currentColor 18%, transparent));
  }

  .slotted-button:focus-visible {
    outline: var(--slotted-focus-ring-width, 2px) solid
      var(--slotted-focus-ring-color, Highlight);
    outline-offset: var(--slotted-focus-ring-offset, 2px);
  }

  .slotted-button:disabled {
    background: var(--slotted-disabled-background, GrayText);
    border-color: var(--slotted-disabled-border, GrayText);
    color: var(--slotted-disabled-foreground, Canvas);
    cursor: not-allowed;
    opacity: 1;
  }

  .slotted-button[data-size='sm'] {
    font-size: var(--slotted-button-font-size-sm, 0.75rem);
    min-height: var(--slotted-button-height-sm, 1.875rem);
    padding-inline: var(--slotted-button-padding-inline-sm, 0.625rem);
  }

  .slotted-button[data-size='md'] {
    font-size: var(--slotted-button-font-size-md, 0.8125rem);
    min-height: var(--slotted-button-height-md, 2.125rem);
    padding-inline: var(--slotted-button-padding-inline-md, 0.8125rem);
  }

  .slotted-button[data-size='lg'] {
    font-size: var(--slotted-button-font-size-lg, 0.875rem);
    min-height: var(--slotted-button-height-lg, 2.375rem);
    padding-inline: var(--slotted-button-padding-inline-lg, 1rem);
  }

  .slotted-button [data-part='leading'],
  .slotted-button [data-part='trailing'] {
    align-items: center;
    display: inline-flex;
    inline-size: var(--slotted-button-icon-size, 1em);
    justify-content: center;
  }
}
```

- [ ] **Step 2: Add a deterministic state-selector check**

Create `packages/react/src/button/button.styles.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/button/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./button.css', import.meta.url), 'utf8');

test('implements every contract state in framework-owned CSS', () => {
  const selectors = {
    default: '.slotted-button {',
    hover: ".slotted-button[data-variant='solid']:hover:not(:disabled)",
    active: ".slotted-button[data-variant='solid']:active:not(:disabled)",
    'focus-visible': '.slotted-button:focus-visible',
    disabled: '.slotted-button:disabled',
  };

  assert.deepEqual(Object.keys(selectors).sort(), [...contract.states].sort());
  for (const selector of Object.values(selectors)) {
    assert.ok(css.includes(selector), `Missing state selector: ${selector}`);
  }
});
```

Change the package test script to:

```json
{
  "scripts": {
    "test": "vitest run && node --test src/button/button.styles.test.mjs"
  }
}
```

Run:

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.test.tsx
```

Expected: 5 Vitest component tests and 1 Node CSS contract test pass. This verifies state coverage from source CSS without a browser or screenshot pass.

- [ ] **Step 3: Build, inspect exports, and commit the package**

Update `packages/react/README.md` to state that the package is private, uses `@slotted/react/button`, requires `@slotted/react/styles.css`, and remains unpublished.

Run:

```bash
pnpm --filter @slotted/react verify
test -f packages/react/dist/button.js
test -f packages/react/dist/types/button/index.d.ts
test -f packages/react/dist/styles.css
```

Expected: 5 Vitest component tests and 1 Node CSS contract test pass; typecheck and build exit `0`; all three artifact checks succeed.

Commit:

```bash
git add packages/react pnpm-lock.yaml
git commit -m "feat(react): add button package"
```

### Task 4: Add the Complete React Story Matrix

- [ ] **Step 1: Create colocated stories**

Create `packages/react/src/button/button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Save changes' },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline', 'ghost'] },
    tone: { control: 'select', options: ['accent', 'neutral', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const rowStyle = { display: 'flex', flexWrap: 'wrap', gap: 12 } as const;

export const Overview: Story = {};

export const Variants: Story = {
  render: () => <div style={rowStyle}>{(['solid', 'outline', 'ghost'] as const).map((variant) => <Button key={variant} variant={variant}>{variant}</Button>)}</div>,
};

export const Tones: Story = {
  render: () => <div style={rowStyle}>{(['accent', 'neutral', 'danger'] as const).map((tone) => <Button key={tone} tone={tone}>{tone}</Button>)}</div>,
};

export const Sizes: Story = {
  render: () => <div style={rowStyle}>{(['sm', 'md', 'lg'] as const).map((size) => <Button key={size} size={size}>{size}</Button>)}</div>,
};

export const States: Story = {
  render: () => <div style={rowStyle}><Button>Enabled</Button><Button disabled>Disabled</Button></div>,
};

export const Content: Story = {
  render: () => <Button leading={<span aria-hidden="true">+</span>} trailing={<span aria-hidden="true">⌘S</span>}>Create</Button>,
};

export const Densities: Story = {
  render: () => <div style={rowStyle}><div data-slotted-density="comfortable"><Button>Comfortable</Button></div><div data-slotted-density="compact"><Button>Compact</Button></div></div>,
};

export const Schemes: Story = {
  render: () => <div style={rowStyle}><div data-slotted-scheme="light" style={{ padding: 16, background: '#f8fafc' }}><Button>Light</Button></div><div data-slotted-scheme="dark" style={{ padding: 16, background: '#111827' }}><Button>Dark</Button></div></div>,
};

export const Accessibility: Story = {
  render: () => <div><Button aria-describedby="save-help">Save</Button><p id="save-help">Saves the current document.</p></div>,
};
```

- [ ] **Step 2: Test story coverage against the contract**

Create `packages/react/src/button/button.stories.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import * as storyModule from './button.stories';

describe('Button stories', () => {
  it('matches the required story scenarios', () => {
    const names = Object.keys(storyModule)
      .filter((name) => name !== 'default')
      .map((name) => `${name[0]?.toLowerCase()}${name.slice(1)}`);
    expect(names.sort()).toEqual([...contract.stories].sort());
  });
});
```

- [ ] **Step 3: Run the story-coverage test**

```bash
pnpm --filter @slotted/react exec vitest run src/button/button.stories.test.ts
```

Expected: 1 test passes and the exact nine scenarios match.

### Task 5: Configure the React Storybook App

- [ ] **Step 1: Create the app manifest and TypeScript config**

Create `apps/storybook-react/package.json`:

```json
{
  "name": "@slotted/storybook-react",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "storybook dev --host 0.0.0.0 --port 6006 --no-open --config-dir .storybook",
    "build:storybook": "storybook build --config-dir .storybook --output-dir dist",
    "typecheck": "tsc -p tsconfig.json --noEmit --pretty false",
    "verify": "pnpm typecheck"
  },
  "dependencies": {
    "@slotted/react": "workspace:*",
    "@slotted/theme-default": "workspace:*",
    "@slotted/tokens": "workspace:*",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "10.5.10",
    "@storybook/addon-docs": "10.5.10",
    "@storybook/react-vite": "10.5.10",
    "@types/node": "24.13.3",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.5",
    "storybook": "10.5.10",
    "typescript": "6.0.3",
    "vite": "8.2.2"
  }
}
```

Create `apps/storybook-react/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "types": ["react", "react-dom", "node"]
  },
  "include": [".storybook", "../../packages/react/src/**/*.stories.tsx"]
}
```

- [ ] **Step 2: Configure Storybook and its human-inspection addons**

Create `apps/storybook-react/.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../../../packages/react/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  typescript: { reactDocgen: 'react-docgen' },
};

export default config;
```

Create `apps/storybook-react/.storybook/preview.tsx`:

```tsx
import '@slotted/tokens/styles.css';
import '@slotted/theme-default/styles.css';
import '@slotted/react/styles.css';

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  initialGlobals: { theme: 'default', scheme: 'light', density: 'comfortable' },
  globalTypes: {
    theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
    scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
    density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
  },
  decorators: [
    (Story, context) => {
      const { density, scheme, theme } = context.globals;
      return <div data-slotted-theme={theme} data-slotted-scheme={scheme} data-slotted-density={density} style={{ minHeight: '100vh', padding: 24, background: scheme === 'dark' ? '#111827' : '#f8fafc' }}><Story /></div>;
    },
  ],
  parameters: {
    a11y: { test: 'todo' },
    controls: { expanded: true },
  },
};

export default preview;
```

- [ ] **Step 3: Install and build the static React catalog**

```bash
pnpm install
pnpm --filter @slotted/tokens build
pnpm --filter @slotted/theme-default build
pnpm --filter @slotted/react build
pnpm --filter @slotted/storybook-react typecheck
pnpm --filter @slotted/storybook-react build:storybook
```

Expected: all builds exit `0`; `apps/storybook-react/dist/index.html` and `apps/storybook-react/dist/index.json` exist. Do not launch Playwright or collect screenshots.

- [ ] **Step 4: Commit Storybook and lockfile changes**

```bash
git add packages/react/src/button/button.stories.tsx packages/react/src/button/button.stories.test.ts apps/storybook-react pnpm-lock.yaml
git commit -m "docs(react): add button storybook"
```

### Task 6: Verify Plan 2 as an Independent Boundary

- [ ] **Step 1: Run fresh filtered verification**

```bash
pnpm --filter @slotted/react verify
pnpm --filter @slotted/storybook-react typecheck
pnpm --filter @slotted/storybook-react build:storybook
git diff --check
git status --short
```

Expected: 6 React Vitest tests and 1 Node CSS contract test pass, package and Storybook builds exit `0`, diff check is silent, and the worktree is clean.

Stop here. Plan 2 has delivered an independently runnable React catalog. Composition and publication remain out of scope until Plan 4.
