import { Canvas } from '@storybook/addon-docs/blocks';
import type { ComponentProps, ReactNode } from 'react';

import { AnatomyTable, ApiTable, EventTable } from './api-table';
import type { AnatomyRow, ApiRow, EventRow } from './api-table';
import { CodeDrawer } from './code-drawer';
import { highlight } from './highlight';
import { FrameworkBadge } from './framework-badge';
import type { WorkbenchSnippet } from './snippets';

type StoryReference = NonNullable<ComponentProps<typeof Canvas>['of']>;

/**
 * How the family is reached from an application. A reference page that shows a
 * component without saying what to import, or an Angular page without the
 * selector the directive attaches to, documents a picture rather than an API.
 */
export interface ReferenceImport {
  /** The import statement, verbatim. */
  source: string;
  /** Angular: the selector the component or directive matches. */
  selector?: string;
  /** Angular: the name a template reaches the instance by. */
  exportAs?: string;
}

/**
 * One demonstration on the page: the story, why it is on the page, and the
 * code that produced it. The snippet is not optional, because a demonstration
 * whose source the reader cannot see teaches what the family looks like and
 * not how it is written — which is the whole question a reference page exists
 * to answer.
 */
export interface ReferenceScene {
  of: StoryReference;
  title: string;
  note: string;
  snippet: WorkbenchSnippet;
}

export interface ReferencePageConfig {
  accessibility: readonly string[];
  anatomy?: readonly AnatomyRow[];
  api: readonly ApiRow[];
  /** Providers, render props, `exportAs`, refs — the composition surface. */
  composition?: readonly ApiRow[];
  description: string;
  events?: readonly EventRow[];
  framework: 'Angular' | 'React';
  imports?: ReferenceImport;
  scenes?: () => readonly ReferenceScene[];
  snippets: readonly WorkbenchSnippet[];
  /** The two-story shape reference pages had before `scenes`. */
  stories?: () => { essential: StoryReference; matrix?: StoryReference };
  title: string;
  tokens: readonly { name: string; purpose: string }[];
}

function WorkbenchSection({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id?: string;
  title: string;
}) {
  return (
    <section className="slotted-reference-page__section" id={id}>
      <h2>{title}</h2>
      <div className="slotted-reference-page__section-content">{children}</div>
    </section>
  );
}

function TokenTable({ tokens }: { tokens: ReferencePageConfig['tokens'] }) {
  return (
    <div aria-label="Public tokens" className="slotted-token-scroll" role="region" tabIndex={0}>
      <table className="slotted-token-table">
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.name}>
              <td>
                <code>{token.name}</code>
              </td>
              <td>{token.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportBlock({ imports }: { imports: ReferenceImport }) {
  return (
    <div className="slotted-reference-import">
      <pre>
        <code>
          {highlight(imports.source, 'ts').map((token, index) => (
            <span data-token={token.kind} key={`${token.kind}-${index}`}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
      {imports.selector === undefined && imports.exportAs === undefined ? null : (
        <dl className="slotted-reference-import__facts">
          {imports.selector === undefined ? null : (
            <>
              <dt>Selector</dt>
              <dd>
                <code>{imports.selector}</code>
              </dd>
            </>
          )}
          {imports.exportAs === undefined ? null : (
            <>
              <dt>exportAs</dt>
              <dd>
                <code>{imports.exportAs}</code>
              </dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}

/**
 * A demonstration, its caption and its source, in that order and next to each
 * other. The caption says what to look at; the canvas shows it; the drawer
 * says how it is written. Splitting the three across the page — or dropping
 * the third, which is what `sourceState="none"` did on every page — is what
 * made a reference page something to look at rather than something to build
 * from.
 */
function Scene({ scene }: { scene: ReferenceScene }) {
  return (
    <article className="slotted-reference-scene">
      <header className="slotted-reference-scene__header">
        <h3>{scene.title}</h3>
        <p>{scene.note}</p>
      </header>
      <Canvas of={scene.of} sourceState="none" />
      <CodeDrawer snippet={scene.snippet} />
    </article>
  );
}

export function createReferencePage(config: ReferencePageConfig) {
  return function ReferencePage() {
    const scenes = config.scenes?.() ?? [];
    const legacyStories = config.stories?.();

    return (
      <main className="slotted-reference-page">
        <header className="slotted-reference-page__header">
          <div className="slotted-reference-page__title-row">
            <h1>{config.title}</h1>
            <FrameworkBadge framework={config.framework} />
          </div>
          <p>{config.description}</p>
        </header>
        {config.imports === undefined ? null : (
          <WorkbenchSection title="Import">
            <ImportBlock imports={config.imports} />
          </WorkbenchSection>
        )}
        {config.anatomy === undefined || config.anatomy.length === 0 ? null : (
          <WorkbenchSection title="Anatomy">
            <AnatomyTable rows={config.anatomy} />
          </WorkbenchSection>
        )}
        {scenes.length === 0 ? null : (
          <WorkbenchSection title="Demonstrations">
            <div className="slotted-reference-scenes">
              {scenes.map((scene) => (
                <Scene key={scene.snippet.id} scene={scene} />
              ))}
            </div>
          </WorkbenchSection>
        )}
        {legacyStories === undefined ? null : (
          <>
            <WorkbenchSection title="Essential usage">
              <Canvas of={legacyStories.essential} sourceState="none" />
            </WorkbenchSection>
            {legacyStories.matrix === undefined ? null : (
              <WorkbenchSection title="Visual matrix">
                <Canvas of={legacyStories.matrix} sourceState="none" />
              </WorkbenchSection>
            )}
          </>
        )}
        {config.api.length === 0 ? null : (
          <WorkbenchSection title={config.framework === 'Angular' ? 'Inputs' : 'Props'}>
            <ApiTable rows={config.api} />
          </WorkbenchSection>
        )}
        {config.events === undefined || config.events.length === 0 ? null : (
          <WorkbenchSection title={config.framework === 'Angular' ? 'Outputs' : 'Events'}>
            <EventTable rows={config.events} />
          </WorkbenchSection>
        )}
        {config.composition === undefined || config.composition.length === 0 ? null : (
          <WorkbenchSection title="Composition and escape hatches">
            <ApiTable rows={config.composition} />
          </WorkbenchSection>
        )}
        {config.accessibility.length === 0 ? null : (
          <WorkbenchSection title="Accessibility">
            <ul>
              {config.accessibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </WorkbenchSection>
        )}
        {config.tokens.length === 0 ? null : (
          <WorkbenchSection title="Public tokens">
            <TokenTable tokens={config.tokens} />
          </WorkbenchSection>
        )}
        {config.snippets.length === 0 ? null : (
          <WorkbenchSection title="Code">
            {config.snippets.map((snippet) => (
              <CodeDrawer key={snippet.id} snippet={snippet} />
            ))}
          </WorkbenchSection>
        )}
      </main>
    );
  };
}
