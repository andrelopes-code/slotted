import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/code-block/contract.json';
import { ANGULAR_CODE_BLOCK_DOCS } from './code-block.docs';
import * as codeBlockStories from './code-block.stories';

describe('Angular CodeBlock stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.codeBlock, codeBlockStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_CODE_BLOCK_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_CODE_BLOCK_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * which elements the directives attach to, what it is made of, one captioned
   * demonstration per scenario with the code that produced it, and — because
   * the contract declares a state model — the event that moves it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_CODE_BLOCK_DOCS.codeBlock,
        framework: 'Angular',
        member: contract.members.codeBlock,
        scenarioIds: contract.scenarios.codeBlock,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_CODE_BLOCK_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
