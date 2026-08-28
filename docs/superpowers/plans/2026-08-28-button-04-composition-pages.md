# Storybook Composition, CI, and GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose the React and Angular Storybooks into one deterministic static artifact, verify it in CI, and publish `main` to GitHub Pages for human visual review.

**Architecture:** The React catalog is the composition host and references Angular by an environment-dependent URL. Both framework catalogs build independently inside their app directories; a tested Node assembler copies them into one Pages artifact with Angular under `/angular`.

**Tech Stack:** Storybook composition, Node.js 24 ESM, Turborepo, GitHub Actions, official GitHub Pages actions.

---

## Files

- Modify: `apps/storybook-react/package.json`
- Modify: `apps/storybook-react/.storybook/main.ts`
- Create: `apps/storybook-react/docs/Introduction.mdx`
- Modify: `apps/storybook-angular/package.json`
- Create: `scripts/assemble-storybook.mjs`
- Create: `scripts/assemble-storybook.test.mjs`
- Modify: `package.json`
- Modify: `turbo.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `pnpm-lock.yaml`

### Task 1: Test-Drive Static Catalog Assembly

- [ ] **Step 1: Write the failing assembler test**

Create `scripts/assemble-storybook.test.mjs`:

```js
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, parse, resolve } from 'node:path';
import test from 'node:test';

import { assembleStorybooks } from './assemble-storybook.mjs';

test('assembles React at the root and Angular below /angular', async () => {
  const root = await mkdtemp(join(tmpdir(), 'slotted-storybook-'));
  const reactDir = join(root, 'react');
  const angularDir = join(root, 'angular-source');
  const outputDir = join(root, 'site');
  await mkdir(reactDir);
  await mkdir(angularDir);
  await writeFile(join(reactDir, 'index.html'), 'react');
  await writeFile(join(reactDir, 'index.json'), '{}');
  await writeFile(join(angularDir, 'index.html'), 'angular');
  await writeFile(join(angularDir, 'index.json'), '{}');

  await assembleStorybooks({ reactDir, angularDir, outputDir });

  assert.equal(await readFile(join(outputDir, 'index.html'), 'utf8'), 'react');
  assert.equal(
    await readFile(join(outputDir, 'angular', 'index.html'), 'utf8'),
    'angular',
  );
});

test('fails when a Storybook index is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'slotted-storybook-missing-'));
  const reactDir = join(root, 'react');
  const angularDir = join(root, 'angular');
  await mkdir(reactDir);
  await mkdir(angularDir);
  await writeFile(join(reactDir, 'index.html'), 'react');
  await assert.rejects(
    assembleStorybooks({ reactDir, angularDir, outputDir: join(root, 'site') }),
    /React Storybook is missing index.json/,
  );
});

test('refuses to replace the filesystem root', async () => {
  const filesystemRoot = parse(resolve('/')).root;
  await assert.rejects(
    assembleStorybooks({
      reactDir: filesystemRoot,
      angularDir: filesystemRoot,
      outputDir: filesystemRoot,
    }),
    /Refusing unsafe Storybook output path/,
  );
});
```

- [ ] **Step 2: Run the test and observe failure**

```bash
node --test scripts/assemble-storybook.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/assemble-storybook.mjs`.

- [ ] **Step 3: Implement the safe assembler**

Create `scripts/assemble-storybook.mjs`:

```js
import { access, cp, mkdir, rm } from 'node:fs/promises';
import { parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

async function requireFile(path, message) {
  try {
    await access(path);
  } catch {
    throw new Error(message);
  }
}

export async function assembleStorybooks({ reactDir, angularDir, outputDir }) {
  const resolvedOutput = resolve(outputDir);
  if (resolvedOutput === parse(resolvedOutput).root) {
    throw new Error(`Refusing unsafe Storybook output path: ${resolvedOutput}`);
  }

  await requireFile(resolve(reactDir, 'index.html'), 'React Storybook is missing index.html');
  await requireFile(resolve(reactDir, 'index.json'), 'React Storybook is missing index.json');
  await requireFile(resolve(angularDir, 'index.html'), 'Angular Storybook is missing index.html');
  await requireFile(resolve(angularDir, 'index.json'), 'Angular Storybook is missing index.json');

  await rm(resolvedOutput, { recursive: true, force: true });
  await mkdir(resolvedOutput, { recursive: true });
  await cp(reactDir, resolvedOutput, { recursive: true });
  await cp(angularDir, resolve(resolvedOutput, 'angular'), { recursive: true });
}

const directPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (directPath && fileURLToPath(import.meta.url) === directPath) {
  const repositoryRoot = resolve(import.meta.dirname, '..');
  const outputDir = resolve(repositoryRoot, 'dist/storybook/site');
  if (!outputDir.endsWith('/dist/storybook/site')) {
    throw new Error(`Refusing unsafe Storybook output path: ${outputDir}`);
  }
  await assembleStorybooks({
    reactDir: resolve(repositoryRoot, 'apps/storybook-react/dist'),
    angularDir: resolve(repositoryRoot, 'apps/storybook-angular/dist'),
    outputDir,
  });
}
```

- [ ] **Step 4: Run tests and commit the assembler**

```bash
node --test scripts/assemble-storybook.test.mjs
git add scripts/assemble-storybook.mjs scripts/assemble-storybook.test.mjs
git commit -m "build: assemble composed storybook"
```

Expected: 3 tests pass, including the targeted missing-index failure and filesystem-root refusal.

### Task 2: Configure React as the Composition Host

- [ ] **Step 1: Add the Angular ref**

Replace `apps/storybook-react/.storybook/main.ts` with:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const angularUrl =
  process.env['STORYBOOK_ANGULAR_URL'] ?? 'http://devserver.local:6007';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    '../../../packages/react/src/**/*.stories.@(ts|tsx)',
    '../docs/**/*.mdx',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  refs: {
    angular: {
      title: 'Angular',
      url: angularUrl,
    },
  },
  typescript: { reactDocgen: 'react-docgen' },
};

export default config;
```

- [ ] **Step 2: Add shared conceptual documentation**

Add `@storybook/blocks` version `10.5.10` to `apps/storybook-react` devDependencies, then create `apps/storybook-react/docs/Introduction.mdx`:

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Introduction" />

# Slotted

Slotted is a multi-framework UI system. React and Angular share component contracts and theme products while keeping native framework APIs and implementations.

Use the toolbar to change theme, color scheme, and density. The React stories are local to this catalog; Angular is composed as an independent catalog.

## Visual review

This catalog prepares deterministic scenarios for human review. It does not use screenshots, visual regression, or autonomous AI visual approval.
```

- [ ] **Step 3: Make static output local to each app**

Change the two app scripts:

```text
// apps/storybook-react/package.json
"build:storybook": "STORYBOOK_ANGULAR_URL=./angular storybook build --config-dir .storybook --output-dir dist"

// apps/storybook-angular/package.json
"build:storybook": "storybook build --config-dir .storybook --output-dir dist"
```

The local React dev command uses `http://devserver.local:6007` by default so a browser outside the remote server can load the Angular child. Override `STORYBOOK_ANGULAR_URL` if the development hostname changes. Both Storybook dev scripts bind to `0.0.0.0`; this is development-only and does not affect the static Pages build.

- [ ] **Step 4: Install, build both children, and assemble**

```bash
pnpm install
pnpm --filter @slotted/storybook-react build:storybook
pnpm --filter @slotted/storybook-angular build:storybook
node scripts/assemble-storybook.mjs
test -f dist/storybook/site/index.json
test -f dist/storybook/site/angular/index.json
```

Expected: both builds exit `0`; the two final index assertions succeed.

- [ ] **Step 5: Commit composition and docs**

```bash
git add apps/storybook-react apps/storybook-angular/package.json pnpm-lock.yaml
git commit -m "docs: compose react and angular storybooks"
```

### Task 3: Add Stable Root Commands and Turbo Tasks

- [ ] **Step 1: Extend the root scripts without slowing the normal gate**

Add these scripts to the root `package.json` and update `check` exactly as shown:

```json
{
  "scripts": {
    "test:infrastructure": "node --test scripts/*.test.mjs",
    "storybook": "turbo run dev --parallel",
    "storybook:build": "turbo run build:storybook && node scripts/assemble-storybook.mjs",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:infrastructure"
  }
}
```

Preserve every existing script not shown. `pnpm check` runs only the two fast assembler tests; it does not build Storybook.

- [ ] **Step 2: Extend Turbo with package and Storybook tasks**

Replace `turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "build:storybook": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "verify": {
      "dependsOn": ["^verify"],
      "outputs": ["dist/**", "coverage/**"]
    }
  }
}
```

- [ ] **Step 3: Verify local commands and commit**

```bash
pnpm check
pnpm check:full
pnpm storybook:build
git diff --check
```

Expected: root infrastructure tests report 2 passing tests; all package checks and builds pass; the composed artifact contains both catalogs.

Commit:

```bash
git add package.json turbo.json pnpm-lock.yaml
git commit -m "build: add composed storybook commands"
```

### Task 4: Build Storybook in CI and Deploy Only `main`

- [ ] **Step 1: Replace the CI workflow with two parallel validation jobs and one conditional deployment**

Replace `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v7
      - name: Install pnpm
        uses: pnpm/action-setup@v6
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Validate repository
        run: pnpm check:full

  storybook:
    name: Build Storybook
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - name: Check out repository
        uses: actions/checkout@v7
      - name: Install pnpm
        uses: pnpm/action-setup@v6
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Build composed Storybook
        run: pnpm storybook:build
      - name: Upload review artifact
        uses: actions/upload-artifact@v6
        with:
          name: storybook-static
          path: dist/storybook/site
          if-no-files-found: error
      - name: Configure GitHub Pages
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: actions/configure-pages@v5
      - name: Upload GitHub Pages artifact
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@v4
        with:
          path: dist/storybook/site

  deploy:
    name: Deploy Storybook
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [validate, storybook]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

This workflow builds but does not publicly deploy pull requests. It contains no browser provider, screenshot step, or visual assertion.

- [ ] **Step 2: Validate workflow shape and commit**

Run:

```bash
pnpm check
git diff --check
git diff -- .github/workflows/ci.yml
```

Expected: local checks exit `0`; the workflow diff contains the `storybook` artifact job and a deploy job guarded to pushes on `main`.

Commit:

```bash
git add .github/workflows/ci.yml
git commit -m "ci: publish composed storybook to pages"
```

### Task 5: Document and Enable the Public Catalog

- [ ] **Step 1: Add the known catalog URL to README**

Add this section to `README.md`:

```markdown
## Component catalog

The composed React and Angular Storybook is published from `main` at [andrelopes-code.github.io/slotted](https://andrelopes-code.github.io/slotted/).

The catalog supports human visual review. It does not imply automated visual approval or npm package availability.
```

- [ ] **Step 2: Commit documentation**

```bash
git add README.md
git commit -m "docs: link public component catalog"
```

- [ ] **Step 3: Enable Pages with the workflow source if it is not already enabled**

First run the read-only check:

```bash
gh api repos/andrelopes-code/slotted/pages
```

Expected: either a Pages configuration with `build_type: workflow`, or HTTP 404 when Pages is not configured.

Only on HTTP 404, run the approved one-time repository mutation:

```bash
gh api repos/andrelopes-code/slotted/pages --method POST -f build_type=workflow
```

Expected: the response identifies `https://andrelopes-code.github.io/slotted/`. Do not create a custom domain or PR preview environment.

### Task 6: Final Local and Remote Verification

- [ ] **Step 1: Run fresh full local evidence**

```bash
pnpm install --frozen-lockfile
pnpm check:full
pnpm storybook:build
test -f dist/storybook/site/index.json
test -f dist/storybook/site/angular/index.json
git diff --check
git status --short
```

Expected: install, full checks, and both static builds exit `0`; both index assertions succeed; diff check is silent; worktree is clean after all commits.

- [ ] **Step 2: Integrate through the repository's selected branch-completion workflow**

Use the `finishing-a-development-branch` skill. If the work is already on `main` and the user authorizes a direct push, run:

```bash
git push origin main
```

Otherwise create or update the branch/PR selected by the user and merge it before expecting a Pages deployment. Pages must never deploy from the feature branch.

- [ ] **Step 3: Verify CI and Pages without browser automation**

After `main` updates:

```bash
gh run list --workflow CI --branch main --limit 1
gh api repos/andrelopes-code/slotted/pages
```

Expected: the latest CI run completes successfully and the Pages response reports the public URL. Use the HTTP URL only for human review; do not launch Playwright, collect screenshots, or let the agent approve the visual result.

- [ ] **Step 4: Request the single human visual review**

Report the public catalog URL and ask the user to review:

- React and Angular parity;
- light and dark schemes;
- comfortable and compact density;
- solid danger with white text;
- focus-visible, hover, active, and disabled presentation;
- leading and trailing content.

The implementation phase is complete only after the user supplies this visual decision. Record requested visual changes as a new bounded follow-up, not as open-ended browser exploration.
