import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/toast/contract.json';
import { REACT_TOAST_DOCS } from './toast.docs';
import * as toastStories from './toast.stories';

describe('Toast stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.toast, toastStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(contract.members.toast, REACT_TOAST_DOCS.toast.api, contract.stateModel),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and — because the contract declares a state model — the
   * output it emits and when.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TOAST_DOCS.toast,
        framework: 'React',
        member: contract.members.toast,
        scenarioIds: contract.scenarios.toast,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TOAST_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
