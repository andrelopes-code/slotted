import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/collapsible/contract.json';
import { ANGULAR_COLLAPSIBLE_DOCS } from './collapsible.docs';
import * as collapsibleStories from './collapsible.stories';

describe('SlCollapsible stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.collapsible, collapsibleStories)).toEqual([]);
  });

  /**
   * The state model is deliberately not handed over here. `docs/state-and-events.md`
   * names the uncontrolled half `defaultValue` for React and "initial input plus
   * internal state" for Angular, and a `model()` is both halves at once — so a
   * `defaultOpen` row would document an input this binding does not have.
   */
  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_COLLAPSIBLE_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_COLLAPSIBLE_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_COLLAPSIBLE_DOCS.collapsible,
        framework: 'Angular',
        member: contract.members.collapsible,
        scenarioIds: contract.scenarios.collapsible,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_COLLAPSIBLE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
