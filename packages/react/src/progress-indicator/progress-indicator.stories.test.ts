import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/progress-indicator/contract.json';
import { REACT_PROGRESS_INDICATOR_DOCS } from './progress-indicator.docs';
import * as progressStories from './progress-indicator.stories';

describe('ProgressIndicator stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.progressIndicator, progressStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_PROGRESS_INDICATOR_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_PROGRESS_INDICATOR_DOCS[member].api),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_PROGRESS_INDICATOR_DOCS.progressIndicator,
        framework: 'React',
        member: contract.members.progressIndicator,
        scenarioIds: contract.scenarios.progressIndicator,
      }),
    ).toEqual([]);
  });

  /**
   * The axes are what a consumer picks from, so the page has to spell every
   * value rather than say "one of the tones".
   */
  it('spells every axis in the reference API', () => {
    const spelled = {
      size: contract.axes.size.join(' | '),
      tone: contract.axes.tone.join(' | '),
      placement: contract.axes.placement.join(' | '),
    };

    for (const [axis, type] of Object.entries(spelled)) {
      expect(
        REACT_PROGRESS_INDICATOR_DOCS.progressIndicator.api.find((row) => row.name === axis)?.type,
      ).toBe(type);
    }
  });

  /**
   * The family declares no state model, so the shared checker does not demand
   * an event table — and the family does emit one thing, which is exactly the
   * case a presence ratchet cannot catch.
   */
  it('documents the one output the family has', () => {
    expect(REACT_PROGRESS_INDICATOR_DOCS.progressIndicator.events.map((row) => row.name)).toEqual([
      'onWithdraw',
    ]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_PROGRESS_INDICATOR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
