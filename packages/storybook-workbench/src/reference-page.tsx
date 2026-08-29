import { Canvas } from '@storybook/addon-docs/blocks';
import type { ComponentProps, ReactNode } from 'react';

import { ApiTable } from './api-table';
import type { ApiRow } from './api-table';
import { CodeDrawer } from './code-drawer';
import { FrameworkBadge } from './framework-badge';
import type { WorkbenchSnippet } from './snippets';

type StoryReference = NonNullable<ComponentProps<typeof Canvas>['of']>;

export interface ReferencePageConfig {
  accessibility: readonly string[];
  api: readonly ApiRow[];
  description: string;
  framework: 'Angular' | 'React';
  snippets: readonly WorkbenchSnippet[];
  stories: () => { essential: StoryReference; matrix?: StoryReference };
  title: string;
  tokens: readonly { name: string; purpose: string }[];
}

function WorkbenchSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="slotted-reference-page__section">
      <h2>{title}</h2>
      {children}
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

export function createReferencePage(config: ReferencePageConfig) {
  return function ReferencePage() {
    const stories = config.stories();
    return (
      <main className="slotted-reference-page">
        <header className="slotted-reference-page__header">
          <div className="slotted-reference-page__title-row">
            <h1>{config.title}</h1>
            <FrameworkBadge framework={config.framework} />
          </div>
          <p>{config.description}</p>
        </header>
        <WorkbenchSection title="Essential usage">
          <Canvas of={stories.essential} sourceState="none" />
        </WorkbenchSection>
        {stories.matrix === undefined ? null : (
          <WorkbenchSection title="Visual matrix">
            <Canvas of={stories.matrix} sourceState="none" />
          </WorkbenchSection>
        )}
        {config.api.length === 0 ? null : (
          <WorkbenchSection title="API">
            <ApiTable rows={config.api} />
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
