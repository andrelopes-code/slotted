import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/code-block/contract.json';
import { REACT_CODE_BLOCK_DOCS } from './code-block.docs';
import * as codeBlockStories from './code-block.stories';

describe('CodeBlock stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.codeBlock, codeBlockStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.codeBlock,
        REACT_CODE_BLOCK_DOCS.codeBlock.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and — because the contract declares two state models —
   * the events that move them.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_CODE_BLOCK_DOCS.codeBlock,
        framework: 'React',
        member: contract.members.codeBlock,
        scenarioIds: contract.scenarios.codeBlock,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = [
      ...REACT_CODE_BLOCK_DOCS.codeBlock.snippets,
      ...REACT_CODE_BLOCK_DOCS.codeBlock.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
