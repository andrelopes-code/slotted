# Angular Button and Angular Storybook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the native Angular Button secondary entrypoint, prove it against the shared contract, and render the equivalent story matrix in a static Angular Storybook.

**Architecture:** Angular owns a standalone attribute-selector component attached to a native button. Angular CLI and `ng-packagr` emit Angular Package Format with partial compilation; the Angular CLI Vitest builder runs jsdom unit tests, and Storybook Angular Vite renders colocated CSF stories.

**Tech Stack:** Angular 22.1, Angular CLI 22.1, ng-packagr 22.1, TypeScript 6, Vitest 4, jsdom 30, Storybook Angular Vite 10.5.

---

## Files

- Modify: `package.json`
- Create: `angular.json`
- Modify: `packages/angular/README.md`
- Create: `packages/angular/package.json`
- Create: `packages/angular/ng-package.json`
- Create: `packages/angular/tsconfig.lib.json`
- Create: `packages/angular/tsconfig.lib.prod.json`
- Create: `packages/angular/tsconfig.spec.json`
- Create: `packages/angular/src/public-api.ts`
- Create: `packages/angular/button/ng-package.json`
- Create: `packages/angular/button/src/public-api.ts`
- Create: `packages/angular/button/src/button.constants.ts`
- Create: `packages/angular/button/src/button.ts`
- Create: `packages/angular/button/src/button.css`
- Create: `packages/angular/button/src/button.spec.ts`
- Create: `packages/angular/button/src/button.styles.test.mjs`
- Create: `packages/angular/button/src/button.stories.ts`
- Create: `packages/angular/button/src/button.stories.spec.ts`
- Create: `apps/storybook-angular/package.json`
- Create: `apps/storybook-angular/tsconfig.json`
- Create: `apps/storybook-angular/.storybook/main.ts`
- Create: `apps/storybook-angular/.storybook/preview.ts`
- Modify: `pnpm-lock.yaml`

### Task 1: Configure the Angular Library Workspace

- [ ] **Step 1: Install the exact Angular test and build toolchain at the workspace root**

Run:

```bash
pnpm add -Dw --save-exact @angular/build@22.1.6 @angular/cli@22.1.6 @angular/common@22.1.4 @angular/compiler@22.1.4 @angular/compiler-cli@22.1.4 @angular/core@22.1.4 @angular/platform-browser@22.1.4 jsdom@30.0.1 ng-packagr@22.1.1 rxjs@7.8.2 vitest@4.1.11
```

Expected: root `devDependencies` and `pnpm-lock.yaml` update without installing Karma or any browser provider.

- [ ] **Step 2: Create the Angular workspace target**

Create `angular.json`:

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": { "analytics": false },
  "projects": {
    "slotted-angular": {
      "projectType": "library",
      "root": "packages/angular",
      "sourceRoot": "packages/angular",
      "prefix": "sl",
      "architect": {
        "build": {
          "builder": "@angular/build:ng-packagr",
          "options": {
            "project": "packages/angular/ng-package.json"
          },
          "configurations": {
            "production": {
              "tsConfig": "packages/angular/tsconfig.lib.prod.json"
            },
            "development": {
              "tsConfig": "packages/angular/tsconfig.lib.json"
            }
          },
          "defaultConfiguration": "production"
        },
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "tsConfig": "packages/angular/tsconfig.spec.json"
          }
        }
      }
    }
  }
}
```

- [ ] **Step 3: Create the package and ng-packagr entrypoints**

Create `packages/angular/package.json`:

```json
{
  "name": "@slotted/angular",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "scripts": {
    "build": "ng build slotted-angular",
    "test": "ng test slotted-angular --watch=false",
    "typecheck": "ng build slotted-angular --configuration development",
    "verify": "pnpm test && pnpm build"
  },
  "peerDependencies": {
    "@angular/common": ">=22.1.0 <23",
    "@angular/core": ">=22.1.0 <23"
  }
}
```

Create `packages/angular/ng-package.json`:

```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "dist",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
```

Create `packages/angular/button/ng-package.json`:

```json
{
  "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "src/public-api.ts"
  }
}
```

Create `packages/angular/src/public-api.ts`:

```ts
export {};
```

- [ ] **Step 4: Add strict library and test TypeScript configs**

Create `packages/angular/tsconfig.lib.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "lib": ["ES2022", "DOM"],
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "target": "ES2022",
    "types": []
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictTemplates": true
  },
  "exclude": ["**/*.spec.ts", "**/*.stories.ts"]
}
```

Create `packages/angular/tsconfig.lib.prod.json`:

```json
{
  "extends": "./tsconfig.lib.json",
  "angularCompilerOptions": {
    "compilationMode": "partial"
  }
}
```

Create `packages/angular/tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.lib.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc/spec",
    "types": ["vitest/globals"]
  },
  "include": ["button/src/**/*.spec.ts", "button/src/**/*.d.ts"]
}
```

### Task 2: Test-Drive the Native Angular Button

- [ ] **Step 1: Define framework-owned constants**

Create `packages/angular/button/src/button.constants.ts`:

```ts
export const BUTTON_VARIANTS = ['solid', 'outline', 'ghost'] as const;
export const BUTTON_TONES = ['accent', 'neutral', 'danger'] as const;
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonType = 'button' | 'submit' | 'reset';
```

- [ ] **Step 2: Write the failing TestBed suite**

Create `packages/angular/button/src/button.spec.ts`:

```ts
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
} from './button.constants';
import { SlButton } from './button';

@Component({
  imports: [SlButton],
  template: `
    <button
      slButton
      [variant]="variant()"
      [tone]="tone()"
      [size]="size()"
      [type]="type()"
      [disabled]="disabled()"
      (click)="onClick()"
    >
      <span slButtonLeading>L</span>
      Save
      <span slButtonTrailing>T</span>
    </button>
  `,
})
class TestHost {
  readonly variant = signal<'solid' | 'outline' | 'ghost'>('solid');
  readonly tone = signal<'accent' | 'neutral' | 'danger'>('accent');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  readonly disabled = signal(false);
  readonly clickSpy = vi.fn();
  onClick() { this.clickSpy(); }
}

describe('SlButton', () => {
  it('renders native safe defaults and logical parts', async () => {
    const fixture = TestBed.createComponent(TestHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.localName).toBe(contract.nativeElement);
    expect(button.dataset['slottedComponent']).toBe(contract.component);
    expect(button.type).toBe(contract.defaults.type);
    expect(button.dataset['variant']).toBe(contract.defaults.variant);
    expect(button.dataset['tone']).toBe(contract.defaults.tone);
    expect(button.dataset['size']).toBe(contract.defaults.size);
    const parts = [...button.querySelectorAll('[data-part]')].map((part) =>
      part.getAttribute('data-part'),
    );
    expect(parts).toEqual(contract.parts);
  });

  it('updates inputs and preserves native events', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.variant.set('outline');
    fixture.componentInstance.type.set('submit');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.dataset['variant']).toBe('outline');
    expect(button.type).toBe('submit');
    expect(fixture.componentInstance.clickSpy).toHaveBeenCalledOnce();
  });

  it('preserves native disabled behavior', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.dataset['state']).toBe('disabled');
    expect(fixture.componentInstance.clickSpy).not.toHaveBeenCalled();
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
pnpm --filter @slotted/angular test
```

Expected: FAIL because `./button` does not exist. At this boundary the package contains only this suite, so a framework-specific include flag adds no useful selectivity. Do not add a browser runner.

- [ ] **Step 4: Implement the native attribute-selector component**

Create `packages/angular/button/src/button.ts`:

```ts
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import type {
  ButtonSize,
  ButtonTone,
  ButtonType,
  ButtonVariant,
} from './button.constants';

@Component({
  selector: 'button[slButton]',
  standalone: true,
  template: `
    <span data-part="leading"><ng-content select="[slButtonLeading]"></ng-content></span>
    <span data-part="label"><ng-content></ng-content></span>
    <span data-part="trailing"><ng-content select="[slButtonTrailing]"></ng-content></span>
  `,
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'slotted-button',
    'data-slotted-component': 'button',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-state]': 'disabled() ? "disabled" : null',
    '[disabled]': 'disabled()',
    '[attr.type]': 'type()',
  },
})
export class SlButton {
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<ButtonSize>('md');
  readonly tone = input<ButtonTone>('accent');
  readonly type = input<ButtonType>('button');
  readonly variant = input<ButtonVariant>('solid');
}
```

Create an empty `packages/angular/button/src/button.css`.

Create `packages/angular/button/src/public-api.ts`:

```ts
export { SlButton } from './button';
export type {
  ButtonSize,
  ButtonTone,
  ButtonType,
  ButtonVariant,
} from './button.constants';
```

- [ ] **Step 5: Run the test before styling**

```bash
pnpm --filter @slotted/angular test
```

Expected: 4 tests pass in Vitest/jsdom with no real browser process.

### Task 3: Implement the Theme-Driven Angular CSS

- [ ] **Step 1: Replace the empty stylesheet**

Replace `packages/angular/button/src/button.css`:

```css
@layer slotted.components {
  :host {
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

  :host([data-tone='neutral']) {
    --_solid: var(--slotted-tone-neutral-solid);
    --_solid-hover: var(--slotted-tone-neutral-solid-hover);
    --_solid-active: var(--slotted-tone-neutral-solid-active);
    --_on-solid: var(--slotted-tone-neutral-on-solid);
    --_border: var(--slotted-tone-neutral-border);
    --_text: var(--slotted-tone-neutral-text);
    --_subtle-hover: var(--slotted-tone-neutral-subtle-hover);
    --_subtle-active: var(--slotted-tone-neutral-subtle-active);
  }

  :host([data-tone='danger']) {
    --_solid: var(--slotted-tone-danger-solid);
    --_solid-hover: var(--slotted-tone-danger-solid-hover);
    --_solid-active: var(--slotted-tone-danger-solid-active);
    --_on-solid: var(--slotted-tone-danger-on-solid);
    --_border: var(--slotted-tone-danger-border);
    --_text: var(--slotted-tone-danger-text);
    --_subtle-hover: var(--slotted-tone-danger-subtle-hover);
    --_subtle-active: var(--slotted-tone-danger-subtle-active);
  }

  :host([data-variant='solid']) {
    background: var(--_solid, ButtonFace);
    border-color: var(--_solid, ButtonBorder);
    color: var(--_on-solid, ButtonText);
  }

  :host([data-variant='outline']) {
    background: var(--slotted-button-outline-background, transparent);
    border-color: var(--_border, ButtonBorder);
    color: var(--_text, ButtonText);
  }

  :host([data-variant='ghost']) {
    background: var(--slotted-button-ghost-background, transparent);
    color: var(--_text, ButtonText);
    text-decoration: var(--slotted-button-ghost-text-decoration, none);
  }

  :host([data-variant='solid']:hover:not(:disabled)) {
    background: var(--_solid-hover, Highlight);
    border-color: var(--_solid-hover, Highlight);
  }

  :host([data-variant='solid']:active:not(:disabled)) {
    background: var(--_solid-active, Highlight);
    border-color: var(--_solid-active, Highlight);
  }

  :host(:is([data-variant='outline'], [data-variant='ghost']):hover:not(:disabled)) {
    background: var(--_subtle-hover, color-mix(in srgb, currentColor 10%, transparent));
  }

  :host(:is([data-variant='outline'], [data-variant='ghost']):active:not(:disabled)) {
    background: var(--_subtle-active, color-mix(in srgb, currentColor 18%, transparent));
  }

  :host(:focus-visible) {
    outline: var(--slotted-focus-ring-width, 2px) solid
      var(--slotted-focus-ring-color, Highlight);
    outline-offset: var(--slotted-focus-ring-offset, 2px);
  }

  :host(:disabled) {
    background: var(--slotted-disabled-background, GrayText);
    border-color: var(--slotted-disabled-border, GrayText);
    color: var(--slotted-disabled-foreground, Canvas);
    cursor: not-allowed;
    opacity: 1;
  }

  :host([data-size='sm']) {
    font-size: var(--slotted-button-font-size-sm, 0.75rem);
    min-height: var(--slotted-button-height-sm, 1.875rem);
    padding-inline: var(--slotted-button-padding-inline-sm, 0.625rem);
  }

  :host([data-size='md']) {
    font-size: var(--slotted-button-font-size-md, 0.8125rem);
    min-height: var(--slotted-button-height-md, 2.125rem);
    padding-inline: var(--slotted-button-padding-inline-md, 0.8125rem);
  }

  :host([data-size='lg']) {
    font-size: var(--slotted-button-font-size-lg, 0.875rem);
    min-height: var(--slotted-button-height-lg, 2.375rem);
    padding-inline: var(--slotted-button-padding-inline-lg, 1rem);
  }

  [data-part='leading'],
  [data-part='trailing'] {
    align-items: center;
    display: inline-flex;
    inline-size: var(--slotted-button-icon-size, 1em);
    justify-content: center;
  }

  [data-part='leading']:empty,
  [data-part='trailing']:empty {
    display: none;
  }
}
```

- [ ] **Step 2: Add a deterministic state-selector check**

Create `packages/angular/button/src/button.styles.test.mjs`:

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
    default: ':host {',
    hover: ":host([data-variant='solid']:hover:not(:disabled))",
    active: ":host([data-variant='solid']:active:not(:disabled))",
    'focus-visible': ':host(:focus-visible)',
    disabled: ':host(:disabled)',
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
    "test": "ng test slotted-angular --watch=false && node --test button/src/button.styles.test.mjs"
  }
}
```

Run:

```bash
pnpm --filter @slotted/angular test
```

Expected: 4 Vitest component tests and 1 Node CSS contract test pass. State coverage is verified from source CSS without a browser or screenshot pass.

- [ ] **Step 3: Build APF artifacts and commit the package**

Update `packages/angular/README.md` to document the private `@slotted/angular/button` entrypoint, native `button[slButton]` usage, and unpublished status.

Run:

```bash
pnpm --filter @slotted/angular verify
test -f packages/angular/dist/button/package.json
test -d packages/angular/dist/fesm2022
test -d packages/angular/dist/types
```

Expected: 4 Vitest component tests and 1 Node CSS contract test pass, APF partial compilation succeeds, and the secondary entrypoint metadata exists.

Commit:

```bash
git add angular.json package.json packages/angular pnpm-lock.yaml
git commit -m "feat(angular): add button entrypoint"
```

### Task 4: Add the Equivalent Angular Story Matrix

- [ ] **Step 1: Create colocated Angular stories**

Create `packages/angular/button/src/button.stories.ts`:

```ts
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import type { ButtonSize, ButtonTone, ButtonVariant } from './button.constants';
import { SlButton } from './button';

interface ButtonStoryArgs {
  disabled: boolean;
  label: string;
  size: ButtonSize;
  tone: ButtonTone;
  variant: ButtonVariant;
}

const meta: Meta<ButtonStoryArgs> = {
  title: 'Components/Button',
  component: SlButton,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [SlButton] })],
  args: { disabled: false, label: 'Save changes', size: 'md', tone: 'accent', variant: 'solid' },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'outline', 'ghost'] },
    tone: { control: 'select', options: ['accent', 'neutral', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => ({
    props: args,
    template: `<button slButton [variant]="variant" [tone]="tone" [size]="size" [disabled]="disabled">{{ label }}</button>`,
  }),
};

export default meta;
type Story = StoryObj<ButtonStoryArgs>;

export const Overview: Story = {};
export const Variants: Story = { render: () => ({ template: `<div style="display:flex;gap:12px"><button slButton variant="solid">solid</button><button slButton variant="outline">outline</button><button slButton variant="ghost">ghost</button></div>` }) };
export const Tones: Story = { render: () => ({ template: `<div style="display:flex;gap:12px"><button slButton tone="accent">accent</button><button slButton tone="neutral">neutral</button><button slButton tone="danger">danger</button></div>` }) };
export const Sizes: Story = { render: () => ({ template: `<div style="display:flex;gap:12px"><button slButton size="sm">sm</button><button slButton size="md">md</button><button slButton size="lg">lg</button></div>` }) };
export const States: Story = { render: () => ({ template: `<div style="display:flex;gap:12px"><button slButton>Enabled</button><button slButton disabled>Disabled</button></div>` }) };
export const Content: Story = { render: () => ({ template: `<button slButton><span slButtonLeading aria-hidden="true">+</span>Create<span slButtonTrailing aria-hidden="true">⌘S</span></button>` }) };
export const Densities: Story = { render: () => ({ template: `<div style="display:flex;gap:12px"><div data-slotted-density="comfortable"><button slButton>Comfortable</button></div><div data-slotted-density="compact"><button slButton>Compact</button></div></div>` }) };
export const Schemes: Story = { render: () => ({ template: `<div style="display:flex;gap:12px"><div data-slotted-scheme="light" style="padding:16px;background:#f8fafc"><button slButton>Light</button></div><div data-slotted-scheme="dark" style="padding:16px;background:#111827"><button slButton>Dark</button></div></div>` }) };
export const Accessibility: Story = { render: () => ({ template: `<div><button slButton aria-describedby="save-help">Save</button><p id="save-help">Saves the current document.</p></div>` }) };
```

- [ ] **Step 2: Test story coverage against the shared contract**

Create `packages/angular/button/src/button.stories.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/button/contract.json';
import * as storyModule from './button.stories';

describe('SlButton stories', () => {
  it('matches the required story scenarios', () => {
    const names = Object.keys(storyModule)
      .filter((name) => name !== 'default')
      .map((name) => `${name[0]?.toLowerCase()}${name.slice(1)}`);
    expect(names.sort()).toEqual([...contract.stories].sort());
  });
});
```

- [ ] **Step 3: Add Storybook authoring dependencies to the Angular package**

Update `packages/angular/package.json` devDependencies to:

```json
{
  "devDependencies": {
    "@storybook/angular-vite": "10.5.10",
    "storybook": "10.5.10"
  }
}
```

Then run:

```bash
pnpm install
pnpm --filter @slotted/angular test
```

Expected: 5 Angular Vitest tests and 1 Node CSS contract test pass, including exact story-scenario parity.

### Task 5: Configure the Angular Storybook App

- [ ] **Step 1: Create the app manifest and TypeScript config**

Create `apps/storybook-angular/package.json`:

```json
{
  "name": "@slotted/storybook-angular",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "storybook dev --host 0.0.0.0 --port 6007 --no-open --config-dir .storybook",
    "build:storybook": "storybook build --config-dir .storybook --output-dir dist",
    "typecheck": "tsc -p tsconfig.json --noEmit --pretty false",
    "verify": "pnpm typecheck"
  },
  "dependencies": {
    "@angular/common": "22.1.4",
    "@angular/core": "22.1.4",
    "@angular/platform-browser": "22.1.4",
    "@slotted/angular": "workspace:*",
    "@slotted/theme-default": "workspace:*",
    "@slotted/tokens": "workspace:*",
    "rxjs": "7.8.2"
  },
  "devDependencies": {
    "@compodoc/compodoc": "2.0.0",
    "@storybook/addon-a11y": "10.5.10",
    "@storybook/addon-docs": "10.5.10",
    "@storybook/angular-vite": "10.5.10",
    "@types/node": "24.13.3",
    "storybook": "10.5.10",
    "typescript": "6.0.3",
    "vite": "8.2.2"
  }
}
```

Create `apps/storybook-angular/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "types": ["node"]
  },
  "include": [".storybook", "../../packages/angular/button/src/**/*.stories.ts"]
}
```

- [ ] **Step 2: Configure Angular Vite Storybook**

Create `apps/storybook-angular/.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/angular-vite',
    options: {
      compodoc: true,
      tsconfig: '../../packages/angular/tsconfig.lib.json',
    },
  },
  stories: ['../../../packages/angular/button/src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
};

export default config;
```

Create `apps/storybook-angular/.storybook/preview.ts`:

```ts
import '@slotted/tokens/styles.css';
import '@slotted/theme-default/styles.css';

import { componentWrapperDecorator } from '@storybook/angular-vite';
import type { Preview } from '@storybook/angular-vite';

const preview: Preview = {
  initialGlobals: { theme: 'default', scheme: 'light', density: 'comfortable' },
  globalTypes: {
    theme: { toolbar: { icon: 'paintbrush', items: ['default'] } },
    scheme: { toolbar: { icon: 'contrast', items: ['light', 'dark'] } },
    density: { toolbar: { icon: 'component', items: ['comfortable', 'compact'] } },
  },
  decorators: [
    componentWrapperDecorator((story, context) => {
      const { density, scheme, theme } = context.globals;
      const background = scheme === 'dark' ? '#111827' : '#f8fafc';
      return `<div data-slotted-theme="${theme}" data-slotted-scheme="${scheme}" data-slotted-density="${density}" style="min-height:100vh;padding:24px;background:${background}">${story}</div>`;
    }),
  ],
  parameters: {
    a11y: { test: 'todo' },
    controls: { expanded: true },
  },
};

export default preview;
```

- [ ] **Step 3: Install and build the static Angular catalog**

```bash
pnpm install
pnpm --filter @slotted/tokens build
pnpm --filter @slotted/theme-default build
pnpm --filter @slotted/angular build
pnpm --filter @slotted/storybook-angular typecheck
pnpm --filter @slotted/storybook-angular build:storybook
```

Expected: all builds exit `0`; `apps/storybook-angular/dist/index.html` and `apps/storybook-angular/dist/index.json` exist. `@storybook/angular-vite` may report its documented preview status, but no browser-test provider is installed.

- [ ] **Step 4: Commit Storybook and lockfile changes**

```bash
git add packages/angular/button/src/button.stories.ts packages/angular/button/src/button.stories.spec.ts packages/angular/package.json apps/storybook-angular pnpm-lock.yaml
git commit -m "docs(angular): add button storybook"
```

### Task 6: Verify Plan 3 as an Independent Boundary

- [ ] **Step 1: Run fresh filtered verification**

```bash
pnpm --filter @slotted/angular verify
pnpm --filter @slotted/storybook-angular typecheck
pnpm --filter @slotted/storybook-angular build:storybook
git diff --check
git status --short
```

Expected: 5 Angular Vitest tests and 1 Node CSS contract test pass, APF and Storybook builds exit `0`, diff check is silent, and the worktree is clean.

Stop here. Plan 3 has delivered an independently runnable Angular catalog. Composition and publication remain out of scope until Plan 4.
