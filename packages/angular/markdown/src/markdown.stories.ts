import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlContainer } from '@slotted/angular/container';
import { SlLink } from '@slotted/angular/link';
import { SlTag } from '@slotted/angular/tag';
import { completeMarkdown, fromMarkedTokens, prepareMarkdown } from '@slotted/core/markdown';
import type { MarkdownNode } from '@slotted/core/markdown';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { marked } from 'marked';
import { provideSlotted } from '@slotted/angular/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import { SlMarkdown, SlMarkdownChildren, SlMarkdownEmpty, SlMarkdownNode } from './markdown';
import type { MarkdownTaskChange } from './markdown';
import { provideMarkdownDefaults } from './markdown-defaults';
import { ANGULAR_MARKDOWN_DOCS, ANGULAR_MARKDOWN_TOKENS } from './markdown.docs';

/* ── Samples: the runbook of a platform team ───────────────────────────── */

const md = (source: string): MarkdownNode => fromMarkedTokens(marked.lexer(source));

const RUNBOOK = `# Publish a service

A deploy is three decisions: **where** the code runs, *when* it changes and who is notified. Read the [prerequisites](#prerequisites) first, and the [CLI reference](https://docs.acme.example/cli) when a flag is unclear. The old ~~blue-green~~ flow was removed.

## Prerequisites

- An account with the \`deploy\` permission on the target project.
- The CLI, installed with \`npm i -g @acme/cli\`.
  - Version 4 or later.
  - Authenticated once with \`acme login\`.
- A service definition on the main branch.

## Steps

3. Build the image.
4. Push it to the registry.
5. Promote the release.

> A deploy that cannot be reverted is not a deploy: it is a migration, and needs another review.

---

Reviewed by the platform team on September 24, 2026.`;

const PLANS = `| Plan | Seats | Monthly price |
| :---- | :-----: | -----------: |
| Team | 10 | $120.00 |
| Business | 50 | R$ 1.450,00 |
| Enterprise | unlimited | contact sales |`;

const REGIONS = `| Region | Instances | Last deploy | Owner | Status | Version |
| --- | ---: | --- | --- | --- | --- |
| sa-east-1 | 3 | 2026-09-24 14:02 | platform | healthy | 4.18.2 |
| us-east-2 | 5 | 2026-09-23 09:41 | payments | degraded | 4.18.1 |
| eu-west-1 | 2 | 2026-09-22 18:15 | billing | healthy | 4.17.9 |`;

const CODE = `The whole pipeline is one call:

\`\`\`ts title="deploy.ts" {2}
import { deploy } from '@acme/cli';
await deploy({ env: 'production', wait: true });
\`\`\`

It resolves when every instance responds healthy. The logs are in:

\`\`\`sh showLineNumbers
acme logs --service checkout --since 15m
acme logs --service checkout --level warn
\`\`\``;

const TASKS = `- [x] Write the migration
- [ ] Review with **the data team**, whose approval the change needs before Friday
- [ ] Publish
  - [ ] Tag the release
  - [ ] Notify support
- A plain item keeps its marker.`;

const ALERTS = `> [!NOTE]
> Os deploys correm pela ordem em que foram enfileirados.

> [!TIP]
> Pass \`--wait\` to block until every instance is healthy.

> [!IMPORTANT]
> Production needs a second approver.

> [!WARNING]
> A deploy during a migration waits for the migration to finish.
>
> It is not canceled.

> [!CAUTION]
> Reverting deletes the instances the deploy created.`;

const FOOTNOTES: MarkdownNode = {
  type: 'root',
  children: [
    {
      type: 'paragraph',
      children: [
        { type: 'text', value: 'Latency dropped by a third' },
        { type: 'footnoteReference', identifier: 'p95' },
        { type: 'text', value: ' after the cache moved to the edge' },
        { type: 'footnoteReference', identifier: 'edge' },
        { type: 'text', value: ', and the cost per request dropped with it' },
        { type: 'footnoteReference', identifier: 'p95' },
        { type: 'text', value: '.' },
      ],
    },
    {
      type: 'footnoteDefinition',
      identifier: 'p95',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Measured at the 95th percentile in the week of September 14.' },
          ],
        },
      ],
    },
    {
      type: 'footnoteDefinition',
      identifier: 'edge',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Twelve regions.' }] }],
    },
    {
      type: 'footnoteDefinition',
      identifier: 'unused',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Nunca referida.' }] }],
    },
  ],
};

const LINKS = `The [status page](https://status.acme.example) and the [API documentation](https://docs.acme.example/api) open in another tab. The [internal dashboard](/dashboards/deploys) and the [steps section](#steps) stay in this one. Write to the [platform team](mailto:platform@acme.example).`;

const HOSTILE = `A message received from outside:

<script>alert('x')</script>

[Claim the prize](javascript:alert(document.cookie)) · [other](JaVaScRiPt:alert(1)) · [data](data:text/html;base64,PHNjcmlwdD4=)

![sales chart](data:image/svg+xml;base64,PHN2Zz4=) and <b>raw bold</b>.

A legitimate link: [changelog](https://docs.acme.example/changelog).`;

const MENTIONS = `@anna.shaw approved the deploy and @brian.cole will follow along. Details in the [dashboard](/dashboards/deploys).`;

const ANSWER = `## Incident summary

Region **sa-east-1** was degraded for 14 minutes because the \`health-check\` of the checkout service pointed to an old port.

1. Deploy 4.18.1 changed the port to \`8443\`.
2. The load balancer kept probing \`8080\`.
3. The instances were removed one by one.

\`\`\`sh
acme lb update checkout --health-port 8443
\`\`\`

See the [full timeline](https://status.acme.example/incidents/2026-09-23).`;

const ACCESSIBLE = `# Release checklist

Check the [status](https://status.acme.example).

| Step | Owner |
| --- | --- |
| Migration | data |

\`\`\`sh
acme deploy --env production
\`\`\`

- [ ] Confirmar com o suporte`;

/** Walks the text of a tree and lifts every `@name` into a node of its own. */
function withMentions(tree: MarkdownNode): MarkdownNode {
  const walk = (node: MarkdownNode): MarkdownNode => {
    if (!node.children) return node;
    const children = node.children.flatMap((child): MarkdownNode[] => {
      if (child.type !== 'text' || !child.value?.includes('@')) return [walk(child)];
      return child.value
        .split(/(@[a-z.]+[a-z])/)
        .filter(Boolean)
        .map((piece) =>
          piece.startsWith('@')
            ? { type: 'mention', value: piece.slice(1) }
            : { type: 'text', value: piece },
        );
    });
    return { ...node, children };
  };
  return walk(tree);
}

/** Flips the n-th task marker in the source. */
function toggleTask(source: string, index: number, checked: boolean): string {
  let seen = -1;
  return source.replace(/^(\s*[-*+] )\[( |x)\]/gim, (match, bullet: string) => {
    seen += 1;
    return seen === index ? `${bullet}[${checked ? 'x' : ' '}]` : match;
  });
}

/* ── Demonstrations with state of their own ───────────────────────────── */

@Component({
  selector: 'sl-markdown-demo-tasks',
  imports: [SlMarkdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div slMarkdown editableTasks [tree]="tree()" (taskChange)="toggle($event)"></div>`,
})
class EditableTasksDemo {
  protected readonly source = signal(TASKS);
  protected readonly tree = computed(() => md(this.source()));
  protected toggle(change: MarkdownTaskChange): void {
    this.source.update((current) => toggleTask(current, change.index, change.checked));
  }
}

@Component({
  selector: 'sl-markdown-demo-renderers',
  imports: [SlMarkdown, SlMarkdownChildren, SlMarkdownNode, SlLink, SlTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slMarkdown [tree]="tree">
      <ng-template slMarkdownNode="mention" let-element>
        <span slTag size="sm">&#64;{{ element.node?.value }}</span>
      </ng-template>
      <ng-template slMarkdownNode="link" let-element>
        <a slLink [href]="element.href" (click)="go($event, element.href)"
          ><ng-container [slMarkdownChildren]="element"
        /></a>
      </ng-template>
    </div>
    <p class="slotted-demo-scene__note">Rota atual: {{ route() }}</p>
  `,
})
class RenderersDemo {
  protected readonly tree = withMentions(md(MENTIONS));
  protected readonly route = signal('/');
  protected go(event: Event, href: string | undefined): void {
    event.preventDefault();
    this.route.set(href ?? '/');
  }
}

@Component({
  selector: 'sl-markdown-demo-streaming',
  imports: [SlMarkdown, SlButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slMarkdown idPrefix="answer-" [streaming]="running()" [tree]="tree()"></div>
    <p>
      <button slButton type="button" size="sm" variant="outline" (click)="start()">
        Transmitir a resposta de novo
      </button>
    </p>
  `,
})
class StreamingDemo {
  private readonly length = signal(ANSWER.length);
  protected readonly running = signal(false);
  protected readonly tree = computed(() => md(completeMarkdown(ANSWER.slice(0, this.length()))));
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  protected start(): void {
    clearInterval(this.timer);
    this.length.set(0);
    this.running.set(true);
    this.timer = setInterval(() => {
      const next = Math.min(ANSWER.length, this.length() + 7);
      this.length.set(next);
      if (next === ANSWER.length) {
        clearInterval(this.timer);
        this.running.set(false);
      }
    }, 40);
  }
}

@Component({
  selector: 'sl-markdown-demo-failing',
  imports: [SlMarkdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    slMarkdown
    retryable
    [loading]="loading()"
    [status]="failed() ? 'error' : 'ready'"
    [tree]="null"
    (retry)="reload()"
  ></div>`,
})
class FailingSourceDemo {
  protected readonly loading = signal(false);
  protected readonly failed = signal(true);
  protected reload(): void {
    this.failed.set(false);
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.failed.set(true);
    }, 1500);
  }
}

@Component({
  selector: 'sl-markdown-demo-docs',
  imports: [SlMarkdown, SlContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideMarkdownDefaults({ headingAnchors: true })],
  template: `
    <nav aria-label="On this page">
      <ul>
        @for (heading of outline.headings; track heading.id) {
          <li>
            <a [href]="'#' + heading.id">{{ heading.text }}</a>
          </li>
        }
      </ul>
    </nav>
    <div slContainer size="measure">
      <div slMarkdown [messages]="{ anchor: 'Link to: {heading}' }" [tree]="tree"></div>
    </div>
  `,
})
class DocsPageDemo {
  protected readonly tree = md(RUNBOOK);
  protected readonly outline = prepareMarkdown(this.tree);
}

@Component({
  selector: 'sl-markdown-demo-alerts',
  imports: [SlMarkdown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
  template: `<div slMarkdown [tree]="tree"></div>`,
})
class TranslatedAlertsDemo {
  protected readonly tree = md(ALERTS);
}

/* ── The page ─────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_MARKDOWN_DOCS.markdown.scenes, {
    playground: Playground,
    document: Document,
    tables: Tables,
    code: Code,
    tasks: Tasks,
    alerts: Alerts,
    footnotes: Footnotes,
    links: Links,
    sanitisation: Sanitisation,
    renderers: Renderers,
    streaming: Streaming,
    states: States,
    composition: Composition,
    accessibility: Accessibility,
  });

const IMPORTS = [
  SlMarkdown,
  SlMarkdownEmpty,
  SlLink,
  EditableTasksDemo,
  RenderersDemo,
  StreamingDemo,
  FailingSourceDemo,
  DocsPageDemo,
  TranslatedAlertsDemo,
];

const SAMPLES = {
  accessible: md(ACCESSIBLE),
  alertsOff: md(ALERTS.split('\n\n')[0] ?? ''),
  code: md(CODE),
  footnoteMessages: { footnotes: 'Notas' },
  footnotes: FOOTNOTES,
  hostile: md(HOSTILE),
  internalDomain: (href: string) =>
    /^https?:\/\//.test(href) && !href.startsWith('https://docs.acme.example'),
  links: md(LINKS),
  narrowAllow: ['paragraph', 'text', 'emphasis', 'strong', 'link'],
  note: md('## Quick note\n\n- Deploy at **2 PM**\n- See the [dashboard](/dashboards)'),
  plans: md(PLANS),
  regions: md(REGIONS),
  runbook: md(RUNBOOK),
  tasks: md(TASKS),
  whitespace: md('   '),
};

interface MarkdownStoryArgs {
  flow?: 'tight' | 'normal' | 'loose';
  headingAnchors?: boolean;
  headingOffset?: number;
  size?: 'md' | 'lg' | 'xl';
}

const meta: Meta<MarkdownStoryArgs> = {
  title: 'Components/Markdown',
  component: SlMarkdown,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Markdown',
        description:
          'A document drawn from an mdast tree, in prose typography: headings with a stable id, tables, fences in code-block, tasks, GitHub alerts and notes, external links — and no source string in innerHTML.',
        framework: 'Angular',
        ...ANGULAR_MARKDOWN_DOCS.markdown,
        tokens: ANGULAR_MARKDOWN_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<MarkdownStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it.
 */
const scene = (label: string, note: string, body: string, layout = 'block') => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (...scenes: string[]) =>
  `<div class="slotted-demo-grid" data-columns="1">${scenes.join('')}</div>`;

export const Playground: Story = {
  args: { flow: 'normal', headingAnchors: true, headingOffset: 0, size: 'lg' },
  argTypes: {
    flow: { control: 'inline-radio', options: ['tight', 'normal', 'loose'] },
    headingAnchors: { control: 'boolean' },
    headingOffset: { control: { max: 5, min: 0, type: 'number' } },
    size: { control: 'inline-radio', options: ['md', 'lg', 'xl'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...SAMPLES },
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <div
    slMarkdown
    [flow]="flow"
    [headingAnchors]="headingAnchors"
    [headingOffset]="headingOffset"
    [size]="size"
    [tree]="runbook"
  ></div>
</div>`,
  }),
};

export const Document: Story = {
  parameters: scenario('document'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'A runbook, with anchors',
        'The heading gives the id prerequisites, the same one the internal link in the first paragraph follows. The ordered list starts at 3 because the source starts at 3.',
        `<div slMarkdown headingAnchors [tree]="runbook"></div>`,
      ),
    ),
  }),
};

export const Tables: Story = {
  parameters: scenario('tables'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'Logical alignment',
        'Plan at the start, seats in the center, price at the end. Switch the direction in the toolbar: the price moves to the left, which is where reading ends in RTL.',
        `<div slMarkdown [tree]="plans"></div>`,
      ),
      scene(
        'Wider than the column',
        'Six columns in a 360 px measure: the table scrolls inside its own box, and Tab reaches it with the region’s name.',
        `<div class="slotted-demo-measure"><div slMarkdown [tree]="regions"></div></div>`,
      ),
    ),
  }),
};

export const Code: Story = {
  parameters: scenario('code'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'title, {2} and showLineNumbers',
        'The first fence has a title and the second line highlighted; the second has line numbers. Each has the code-block copy button, and the space between them and the text is the region’s flow.',
        `<div slMarkdown [tree]="code"></div>`,
      ),
    ),
  }),
};

export const Tasks: Story = {
  parameters: scenario('tasks'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'Read only',
        'Without editableTasks: the checkboxes stay focusable and announce that they are read only; a click changes nothing.',
        `<div slMarkdown [tree]="tasks"></div>`,
      ),
      scene(
        'Editable through the source',
        'Check a task: the request rewrites the [ ] in the source, the parser runs again and the checkbox changes with the new tree — the source is the only source of truth.',
        `<sl-markdown-demo-tasks />`,
      ),
    ),
  }),
};

export const Alerts: Story = {
  parameters: scenario('alerts'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'The five alerts',
        'Note, tip, important, warning and caution, each in its own tone and with its own glyph; the warning has two paragraphs and the second follows the region’s flow.',
        `<sl-markdown-demo-alerts />`,
      ),
      scene(
        '[alerts]="false"',
        'The same source with reading turned off: the alert is a quote again, with the [!NOTE] marker in view.',
        `<div slMarkdown [alerts]="false" [tree]="alertsOff"></div>`,
      ),
    ),
  }),
};

export const Footnotes: Story = {
  parameters: scenario('footnotes'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'Two notes, three references',
        'Note 1 is referenced twice and has two back arrows; the definition nobody references does not appear. Follow a reference and return by the arrow.',
        `<div slMarkdown [messages]="footnoteMessages" [tree]="footnotes"></div>`,
      ),
    ),
  }),
};

export const Links: Story = {
  parameters: scenario('links'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'By default',
        'The two https addresses carry the exit glyph and the new-tab hint; the path, the anchor and the mailto are plain links.',
        `<div slMarkdown [tree]="links"></div>`,
      ),
      scene(
        'The home domain is internal',
        'isExternal treats docs.acme.example as part of the application: only the status page opens in another tab.',
        `<div slMarkdown [isExternal]="internalDomain" [tree]="links"></div>`,
      ),
    ),
  }),
};

export const Sanitisation: Story = {
  parameters: scenario('sanitisation'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'A hostile source',
        'The script and the raw bold disappear; the three executable links stay as text; the data: image stays as its alternative text. Only the changelog is a link.',
        `<div slMarkdown [tree]="hostile"></div>`,
      ),
      scene(
        'allow and unwrapDisallowed',
        'Only paragraphs, text, emphasis and links: the list and the heading hand their text to the parent instead of disappearing.',
        `<div slMarkdown unwrapDisallowed [allow]="narrowAllow" [tree]="note"></div>`,
      ),
    ),
  }),
};

export const Renderers: Story = {
  parameters: scenario('renderers'),
  render: () => ({
    template: grid(
      scene(
        'A router link and a mention',
        'Press the link: the template navigates without reloading. The mentions are mention nodes created by a pass over the tree and drawn as slTag.',
        `<sl-markdown-demo-renderers />`,
      ),
    ),
  }),
};

export const Streaming: Story = {
  parameters: scenario('streaming'),
  render: () => ({
    template: grid(
      scene(
        'Seven characters every 40 ms',
        'During the stream, bold and inline code appear formatted before the closing marker arrives, and the fence is a block from the first line. What is already on screen does not flicker.',
        `<sl-markdown-demo-streaming />`,
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'loading',
        'A three-line paragraph with the last line shorter, in the region’s typography, after the skeleton delay. The root gets aria-busy.',
        `<div slMarkdown loading [tree]="null"></div>`,
      ),
      scene(
        'Empty',
        'Only whitespace in the source: the empty part with the projected content, which is where the action that creates the first text goes.',
        `<div slMarkdown [tree]="whitespace"><span slMarkdownEmpty>This service has no runbook yet. <a slLink href="#new">Write the first one</a>.</span></div>`,
      ),
      scene(
        'Error, with retry',
        'Press Try again: the request loads again and fails again after a second and a half, so the whole cycle can be seen.',
        `<sl-markdown-demo-failing />`,
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      scene(
        'Outline, measure and labels in English',
        'The outline comes from prepareMarkdown with the same ids the headings draw, so each entry reaches its heading. The provider decides the anchors and their name once.',
        `<sl-markdown-demo-docs />`,
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: SAMPLES,
    template: grid(
      scene(
        'Everything Tab reaches',
        'A heading with an anchor one level below the page, an external link, a table, a fence and a read-only task that stays focusable: step through with Tab and hear each stop.',
        `<div slMarkdown headingAnchors [headingOffset]="1" [tree]="accessible"></div>`,
      ),
    ),
  }),
};
