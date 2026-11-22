import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/floating-panel/contract.json';
import { ANGULAR_FLOATING_PANEL_DOCS } from './floating-panel.docs';
import * as floatingPanelStories from './floating-panel.stories';

describe('Angular FloatingPanel stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.floatingPanel, floatingPanelStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_FLOATING_PANEL_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_FLOATING_PANEL_DOCS[member].api),
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
        docs: ANGULAR_FLOATING_PANEL_DOCS.floatingPanel,
        framework: 'Angular',
        member: contract.members.floatingPanel,
        scenarioIds: contract.scenarios.floatingPanel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_FLOATING_PANEL_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
