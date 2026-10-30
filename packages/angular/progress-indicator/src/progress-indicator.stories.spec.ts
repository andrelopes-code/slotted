import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/progress-indicator/contract.json';
import { ANGULAR_PROGRESS_INDICATOR_DOCS } from './progress-indicator.docs';
import * as progressStories from './progress-indicator.stories';

describe('Angular ProgressIndicator stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.progressIndicator, progressStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_PROGRESS_INDICATOR_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_PROGRESS_INDICATOR_DOCS[member].api),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * which element the directive attaches to, what it is made of, and one
   * captioned demonstration per scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_PROGRESS_INDICATOR_DOCS.progressIndicator,
        framework: 'Angular',
        member: contract.members.progressIndicator,
        scenarioIds: contract.scenarios.progressIndicator,
      }),
    ).toEqual([]);
  });

  it('spells every axis in the reference API', () => {
    const spelled = {
      size: contract.axes.size.join(' | '),
      tone: contract.axes.tone.join(' | '),
      placement: contract.axes.placement.join(' | '),
    };

    for (const [axis, type] of Object.entries(spelled)) {
      expect(
        ANGULAR_PROGRESS_INDICATOR_DOCS.progressIndicator.api.find((row) => row.name === axis)
          ?.type,
      ).toBe(type);
    }
  });

  /**
   * The family declares no state model, so the shared checker does not demand
   * an event table — and the family does emit one thing, which is exactly the
   * case a presence ratchet cannot catch. The name is Angular's, not React's.
   */
  it('documents the one output the family has', () => {
    expect(ANGULAR_PROGRESS_INDICATOR_DOCS.progressIndicator.events.map((row) => row.name)).toEqual(
      ['withdraw'],
    );
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_PROGRESS_INDICATOR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
