import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { press } from '../test/press';
import { Tab, TabList, TabPanel, Tabs } from './index';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/* The theme's motion tokens, which the test document does not load. */
afterEach(() => {
  document.documentElement.removeAttribute('style');
});

/**
 * The marker slid by `left` and `inline-size`, which the main thread lays
 * out: when the panel selected by the click rendered right after it, the
 * frames of the slide were lost and the marker jumped. It slides by
 * `translate` and `scale`, which the compositor runs.
 */
describe('the marker of a tab list', () => {
  it('slides by translate and scale, not by left', async () => {
    document.documentElement.style.setProperty('--slotted-duration-medium', '400ms');
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="Sections">
          <Tab value="a">Overview</Tab>
          <Tab value="b">A much longer section</Tab>
        </TabList>
        <TabPanel value="a">A</TabPanel>
        <TabPanel value="b">B</TabPanel>
      </Tabs>,
    );
    for (let index = 0; index < 3; index += 1) await frame();
    const marker = document.querySelector('[data-part="marker"]') as HTMLElement;

    await press(document.querySelectorAll('[role="tab"]')[1]!, 'mouse');
    await frame();

    const properties = marker
      .getAnimations()
      .flatMap((animation) =>
        (animation.effect as KeyframeEffect)
          .getKeyframes()
          .flatMap((keyframe) => Object.keys(keyframe)),
      );
    expect(properties).toContain('translate');
    expect(properties).toContain('scale');
    expect(properties).not.toContain('left');
    expect(properties).not.toContain('inlineSize');
  });
});
