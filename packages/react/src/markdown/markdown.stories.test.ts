import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/markdown/contract.json';
import { REACT_MARKDOWN_DOCS } from './markdown.docs';
import * as markdownStories from './markdown.stories';

describe('Markdown stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.markdown, markdownStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(contract.members.markdown, REACT_MARKDOWN_DOCS.markdown.api, undefined),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and the two requests the family sends: a task the
   * reader ticked and a retry.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_MARKDOWN_DOCS.markdown,
        framework: 'React',
        member: contract.members.markdown,
        scenarioIds: contract.scenarios.markdown,
        stateModel: undefined,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = [
      ...REACT_MARKDOWN_DOCS.markdown.snippets,
      ...REACT_MARKDOWN_DOCS.markdown.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
