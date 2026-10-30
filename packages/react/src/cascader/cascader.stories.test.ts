import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/cascader/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_CASCADER_DOCS } from './cascader.docs';
import * as cascaderStories from './cascader.stories';

describe('Cascader stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.cascader, cascaderStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.cascader,
        REACT_CASCADER_DOCS.cascader.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_CASCADER_DOCS.cascader,
        framework: 'React',
        member: contract.members.cascader,
        scenarioIds: contract.scenarios.cascader,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_CASCADER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });

  /**
   * A story opens its popup for the picture, on its own page; inside the
   * reference page it is one demonstration among many, and a layer nobody
   * asked for would sit over the demonstration below it.
   */
  describe('a layer opened for the picture', () => {
    afterEach(cleanup);
    type Pictured = (args: never, context: never) => ReactNode;
    const mount = (story: Pictured, viewMode: string) =>
      render(createElement(() => story({} as never, { viewMode } as never)));
    const pictured = Object.values(cascaderStories)
      .filter((story) => typeof story === 'object' && story !== null && 'render' in story)
      .map((story) => (story as { render: Pictured }).render);

    it('opens on a story of its own', () => {
      let opened = 0;
      for (const story of pictured) {
        const { container } = mount(story, 'story');
        opened += container.querySelectorAll("[data-ui='cascader'][data-part='positioner']").length;
        cleanup();
      }
      expect(opened).toBeGreaterThan(0);
    });

    it('mounts no layer on the reference page until the reader asks', async () => {
      for (const story of pictured) {
        const { container } = mount(story, 'docs');
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(
          container.querySelectorAll("[data-ui='cascader'][data-part='positioner']"),
        ).toHaveLength(0);
        cleanup();
      }
    });
  });
});
