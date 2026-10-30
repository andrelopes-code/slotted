import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/accordion/contract.json';
import { ANGULAR_ACCORDION_DOCS } from './accordion.docs';
import * as accordionStories from './accordion.stories';

describe('SlAccordion stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.accordion, accordionStories)).toEqual([]);
  });

  /**
   * The state model is deliberately not handed over here. `docs/state-and-events.md`
   * names the uncontrolled half `defaultValue` for React and "initial input plus
   * internal state" for Angular, and a `model()` is both halves at once — so a
   * `defaultValue` row would document an input this binding does not have.
   */
  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_ACCORDION_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_ACCORDION_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_ACCORDION_DOCS.accordion,
        framework: 'Angular',
        member: contract.members.accordion,
        scenarioIds: contract.scenarios.accordion,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_ACCORDION_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
