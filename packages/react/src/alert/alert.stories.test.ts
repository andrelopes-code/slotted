import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/alert/contract.json';
import { REACT_ALERT_DOCS } from './alert.docs';
import * as alertStories from './alert.stories';

describe('Alert stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.alert, alertStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_ALERT_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_ALERT_DOCS[member].api)).toEqual([]);
    }
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
        docs: REACT_ALERT_DOCS.alert,
        framework: 'React',
        member: contract.members.alert,
        scenarioIds: contract.scenarios.alert,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_ALERT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
