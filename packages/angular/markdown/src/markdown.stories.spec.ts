import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/markdown/contract.json';
import { ANGULAR_MARKDOWN_DOCS } from './markdown.docs';
import * as markdownStories from './markdown.stories';

describe('Angular Markdown stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.markdown, markdownStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_MARKDOWN_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_MARKDOWN_DOCS[member].api, undefined),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * which elements the directives attach to, what it is made of, one captioned
   * demonstration per scenario with the code that produced it, and the two
   * requests the family sends: a task the reader ticked and a retry.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_MARKDOWN_DOCS.markdown,
        framework: 'Angular',
        member: contract.members.markdown,
        scenarioIds: contract.scenarios.markdown,
        stateModel: undefined,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_MARKDOWN_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
