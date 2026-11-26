import { spokenText } from '@slotted/core/text';
import { useLayoutEffect, useState } from 'react';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { useMenu } from './menu';

/**
 * The head of a submenu drawn as the second step of a sheet: a control back
 * to the first step, and the name of the item that opened this one.
 */
export function MenuSheetStep() {
  const menu = useMenu();
  const [title, setTitle] = useState('');

  /* The item's own words, read before the step is painted. */
  useLayoutEffect(() => {
    const item = menu.triggerNode;
    const label = item?.querySelector('[data-part="label"]') ?? item ?? null;
    setTitle(label === null ? '' : spokenText(label));
  }, [menu.triggerNode]);

  function handleBack(event: MouseEvent<HTMLButtonElement>) {
    menu.toggle(false, event.detail === 0 ? 'keyboard' : 'pointer', event.nativeEvent);
  }

  return (
    <div data-part="step" data-part-step="">
      <button
        aria-label={menu.t('back')}
        data-part="back"
        data-part-back=""
        onClick={handleBack}
        type="button"
      >
        <Icon>
          <Glyph name="chevron-left" />
        </Icon>
      </button>
      <div data-part="title" data-part-title="">
        {title}
      </div>
    </div>
  );
}
