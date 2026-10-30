import { completeMarkdown, fromMarkedTokens, prepareMarkdown } from '@slotted/core/markdown';
import type { MarkdownNode } from '@slotted/core/markdown';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { marked } from 'marked';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Container } from '../container';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Link } from '../link';
import { Tag } from '../tag';
import { Markdown } from './markdown';
import { MarkdownDefaultsProvider } from './markdown-defaults';
import { REACT_MARKDOWN_DOCS, REACT_MARKDOWN_TOKENS } from './markdown.docs';
import type { MarkdownProps } from './markdown.types';

/* ── Samples: the runbook of a platform team ───────────────────────────── */

const md = (source: string): MarkdownNode => fromMarkedTokens(marked.lexer(source));

const RUNBOOK = `# Publishing a service

A deploy is three decisions: **where** the code runs, *when* it changes and who is notified. Read the [prerequisites](#prerequisites) first, and the [CLI reference](https://docs.acme.example/cli) when a flag is unclear. The old ~~blue-green~~ flow has been removed.

## Prerequisites

- An account with the \`deploy\` permission on the target project.
- The CLI, installed with \`npm i -g @acme/cli\`.
  - Version 4 or higher.
  - Authenticated once with \`acme login\`.
- A service definition on the main branch.

## Steps

3. Build the image.
4. Push it to the registry.
5. Promote the release.

> A deploy that cannot be rolled back is not a deploy: it is a migration, and calls for another review.

---

Reviewed by the platform team on September 24, 2026.`;

const TABLES = `| Plan | Seats | Monthly price |
| :---- | :-----: | -----------: |
| Team | 10 | $120.00 |
| Business | 50 | R$ 1.450,00 |
| Enterprise | unlimited | on request |

| Region | Instances | Last deploy | Owner | Status | Version |
| --- | ---: | --- | --- | --- | --- |
| sa-east-1 | 3 | 2026-09-24 14:02 | platform | healthy | 4.18.2 |
| us-east-2 | 5 | 2026-09-23 09:41 | payments | degraded | 4.18.1 |
| eu-west-1 | 2 | 2026-09-22 18:15 | billing | healthy | 4.17.9 |`;

const CODE = `The whole pipeline is a single call:

\`\`\`ts title="deploy.ts" {2}
import { deploy } from '@acme/cli';
await deploy({ env: 'production', wait: true });
\`\`\`

It resolves when every instance responds healthy. The logs are kept in:

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
> Pass \`--wait\` to block until all instances are healthy.

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

const LINKS = `The [status page](https://status.acme.example) and the [API documentation](https://docs.acme.example/api) open in a new tab. The [internal dashboard](/dashboards/deploys) and the [steps section](#steps) stay in this one. Write to the [platform team](mailto:platform@acme.example).`;

const HOSTILE = `A message received from outside:

<script>alert('x')</script>

[Claim your prize](javascript:alert(document.cookie)) · [other](JaVaScRiPt:alert(1)) · [data](data:text/html;base64,PHNjcmlwdD4=)

![sales chart](data:image/svg+xml;base64,PHN2Zz4=) and <b>raw bold</b>.

A legitimate link: [changelog](https://docs.acme.example/changelog).`;

const MENTIONS = `@anna.stone approved the deploy and @brian.lee will follow it. Details in the [dashboard](/dashboards/deploys).`;

const ANSWER = `## Incident summary

Region **sa-east-1** was degraded for 14 minutes because the checkout service's \`health-check\` pointed to an old port.

1. Deploy 4.18.1 changed the port to \`8443\`.
2. The load balancer kept probing \`8080\`.
3. Instances were removed one by one.

\`\`\`sh
acme lb update checkout --health-port 8443
\`\`\`

Veja a [linha do tempo completa](https://status.acme.example/incidents/2026-09-23).`;

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

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_MARKDOWN_DOCS.markdown.scenes, {
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

const meta = {
  title: 'Components/Markdown',
  component: Markdown,
  args: { tree: md(RUNBOOK) },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Markdown',
        description:
          'A document drawn from an mdast tree, in the prose typography: headings with stable id, tables, code-block fences, tasks, GitHub alerts and footnotes, external links — and no source string in innerHTML.',
        framework: 'React',
        ...REACT_MARKDOWN_DOCS.markdown,
        tokens: REACT_MARKDOWN_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

function Single({ children, label, note }: { children: ReactNode; label: string; note: string }) {
  return (
    <Grid columns={1}>
      <Scene label={label} note={note}>
        {children}
      </Scene>
    </Grid>
  );
}

export const Playground: Story = {
  args: {
    flow: 'normal',
    headingAnchors: true,
    headingOffset: 0,
    size: 'lg',
    tree: md(RUNBOOK),
  },
  argTypes: {
    flow: { control: 'inline-radio', options: ['tight', 'normal', 'loose'] },
    headingAnchors: { control: 'boolean' },
    headingOffset: { control: { max: 5, min: 0, type: 'number' } },
    size: { control: 'inline-radio', options: ['md', 'lg', 'xl'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Markdown {...args} />
    </div>
  ),
};

export const Document: Story = {
  parameters: scenario('document'),
  render: () => (
    <Single
      label="A runbook, with anchors"
      note="The heading gives the id prerequisites, the same one the internal link in the first paragraph follows. The ordered list starts at 3 because the source starts at 3."
    >
      <Markdown headingAnchors tree={md(RUNBOOK)} />
    </Single>
  ),
};

export const Tables: Story = {
  parameters: scenario('tables'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Logical alignment"
        note="Plan at the start, seats at the center, price at the end. Switch the direction in the toolbar: the price moves to the left, which is where reading ends in RTL."
      >
        <Markdown tree={md(TABLES.split('\n\n')[0] ?? '')} />
      </Scene>
      <Scene
        label="Wider than the column"
        note="Six columns in a 360 px measure: the table scrolls inside its own box, and Tab reaches it with the region name."
      >
        <Measure>
          <Markdown tree={md(TABLES.split('\n\n')[1] ?? '')} />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Code: Story = {
  parameters: scenario('code'),
  render: () => (
    <Single
      label="title, {2} and showLineNumbers"
      note="The first fence has a title and the second line highlighted; the second has line numbers. Each has the code-block copy button, and the space between them and the text is the region flow."
    >
      <Markdown tree={md(CODE)} />
    </Single>
  ),
};

function EditableTasks() {
  const [source, setSource] = useState(TASKS);
  const tree = useMemo(() => md(source), [source]);
  return (
    <Markdown
      onTaskChange={({ checked, index }) =>
        setSource((current) => toggleTask(current, index, checked))
      }
      tree={tree}
    />
  );
}

export const Tasks: Story = {
  parameters: scenario('tasks'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Read-only"
        note="Without onTaskChange: the checkboxes stay focusable and report that they are read-only; a click changes nothing."
      >
        <Markdown tree={md(TASKS)} />
      </Scene>
      <Scene
        label="Editable through the source"
        note="Check a task: the request rewrites the [ ] in the source, the parser runs again and the checkbox changes with the new tree — the source is the single truth."
      >
        <EditableTasks />
      </Scene>
    </Grid>
  ),
};

export const Alerts: Story = {
  parameters: scenario('alerts'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The five alerts"
        note="Note, tip, important, warning and caution, each in its own tone and with its own glyph; the warning has two paragraphs and the second follows the region flow."
      >
        <Markdown tree={md(ALERTS)} />
      </Scene>
      <Scene
        label="alerts={false}"
        note="The same source with the reading turned off: each alert goes back to being a quote with the [!NOTE] marker in view."
      >
        <Markdown alerts={false} tree={md(ALERTS.split('\n\n')[0] ?? '')} />
      </Scene>
    </Grid>
  ),
};

export const Footnotes: Story = {
  parameters: scenario('footnotes'),
  render: () => (
    <Single
      label="Two notes, three references"
      note="Note 1 is referenced twice and has two back arrows; the definition nobody references does not appear. Follow a reference and return by the arrow."
    >
      <Markdown messages={{ footnotes: 'Notes' }} tree={FOOTNOTES} />
    </Single>
  ),
};

export const Links: Story = {
  parameters: scenario('links'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="By default"
        note="The two https addresses carry the exit glyph and the new-tab hint; the path, the anchor and the mailto are plain links."
      >
        <Markdown tree={md(LINKS)} />
      </Scene>
      <Scene
        label="The house domain is internal"
        note="isExternal treats docs.acme.example as part of the application: only the status page opens in a new tab."
      >
        <Markdown
          isExternal={(href) =>
            /^https?:\/\//.test(href) && !href.startsWith('https://docs.acme.example')
          }
          tree={md(LINKS)}
        />
      </Scene>
    </Grid>
  ),
};

export const Sanitisation: Story = {
  parameters: scenario('sanitisation'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A hostile source"
        note="The script and the raw bold disappear; the three executable links stay as text; the data: image stays as its alt text. Only the changelog is a link."
      >
        <Markdown tree={md(HOSTILE)} />
      </Scene>
      <Scene
        label="allow and unwrapDisallowed"
        note="Only paragraphs, text, emphasis and links: the runbook's lists and headings hand their text to the parent instead of disappearing."
      >
        <Markdown
          allow={['paragraph', 'text', 'emphasis', 'strong', 'link']}
          tree={md('## Quick note\n\n- Deploy at **2 PM**\n- See the [dashboard](/dashboards)')}
          unwrapDisallowed
        />
      </Scene>
    </Grid>
  ),
};

function RoutedMentions() {
  const [route, setRoute] = useState('/');
  return (
    <>
      <Markdown
        extensions={{
          mention: ({ element }) => <Tag size="sm">@{String(element.node.value)}</Tag>,
        }}
        renderers={{
          link: ({ children, element }) => (
            <Link
              href={element.href}
              onClick={(event) => {
                event.preventDefault();
                setRoute(element.href);
              }}
            >
              {children}
            </Link>
          ),
        }}
        tree={withMentions(md(MENTIONS))}
      />
      <p className="slotted-demo-scene__note">Rota atual: {route}</p>
    </>
  );
}

export const Renderers: Story = {
  parameters: scenario('renderers'),
  render: () => (
    <Single
      label="A router link and a mention"
      note="Press the link: the renderer navigates without reloading. Mentions are mention nodes created by a pass over the tree and drawn as a tag."
    >
      <RoutedMentions />
    </Single>
  ),
};

function StreamedAnswer() {
  const [length, setLength] = useState(ANSWER.length);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  const start = () => {
    clearInterval(timer.current);
    setLength(0);
    setRunning(true);
    timer.current = setInterval(() => {
      setLength((current) => {
        const next = Math.min(ANSWER.length, current + 7);
        if (next === ANSWER.length) {
          clearInterval(timer.current);
          setRunning(false);
        }
        return next;
      });
    }, 40);
  };

  const source = ANSWER.slice(0, length);
  return (
    <>
      <Markdown idPrefix="answer-" streaming={running} tree={md(completeMarkdown(source))} />
      <p>
        <Button onClick={start} size="sm" variant="outline">
          Transmitir a resposta de novo
        </Button>
      </p>
    </>
  );
}

export const Streaming: Story = {
  parameters: scenario('streaming'),
  render: () => (
    <Single
      label="Seven characters every 40 ms"
      note="During the stream, bold and inline code appear formatted before the closing marker arrives, and the fence is a block from the first line. What is already on screen does not flicker."
    >
      <StreamedAnswer />
    </Single>
  ),
};

function FailingSource() {
  const [status, setStatus] = useState<MarkdownProps['status']>('error');
  const [loading, setLoading] = useState(false);
  return (
    <Markdown
      loading={loading}
      onRetry={() => {
        setStatus('ready');
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setStatus('error');
        }, 1500);
      }}
      status={status}
      tree={null}
    />
  );
}

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="loading"
        note="A three-line paragraph with the last line shorter, in the region typography, after the skeleton delay. The root stays aria-busy."
      >
        <Markdown loading tree={null} />
      </Scene>
      <Scene
        label="Empty"
        note="Only whitespace in the source: the empty part with the consumer's content, which is the place for the action that creates the first text."
      >
        <Markdown
          empty={
            <>
              This service has no runbook yet. <Link href="#new">Write the first one</Link>.
            </>
          }
          tree={md('   ')}
        />
      </Scene>
      <Scene
        label="Error, with retry"
        note="Press Try again: the request loads again and fails again after a second and a half, so the whole cycle can be seen."
      >
        <FailingSource />
      </Scene>
    </Grid>
  ),
};

function DocsPage() {
  const tree = useMemo(() => md(RUNBOOK), []);
  const { headings } = useMemo(() => prepareMarkdown(tree), [tree]);
  return (
    <MarkdownDefaultsProvider headingAnchors>
      <nav aria-label="On this page">
        <ul>
          {headings.map((heading) => (
            <li key={heading.id}>
              <a href={`#${heading.id}`}>{heading.text}</a>
            </li>
          ))}
        </ul>
      </nav>
      <Container size="measure">
        <Markdown messages={{ anchor: 'Link to: {heading}' }} tree={tree} />
      </Container>
    </MarkdownDefaultsProvider>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Single
      label="Contents, measure and custom labels"
      note="The contents come from prepareMarkdown with the same ids the headings draw, so each entry reaches its heading. The provider decides the anchors once, and messages their name."
    >
      <DocsPage />
    </Single>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Single
      label="Everything Tab reaches"
      note="A heading with an anchor one level below the page, an external link, a table, a fence and a read-only task that stays focusable: walk through with Tab and listen to each stop."
    >
      <Markdown
        headingAnchors
        headingOffset={1}
        tree={md(
          `# Launch checklist\n\nCheck the [status](https://status.acme.example).\n\n| Step | Owner |\n| --- | --- |\n| Migration | data |\n\n\`\`\`sh\nacme deploy --env production\n\`\`\`\n\n- [ ] Confirm with support`,
        )}
      />
    </Single>
  ),
};
