import { describe, expect, it } from 'vitest';

import { createChartModel } from './model';
import { createRangeDrag } from './range-drag';

const model = createChartModel({
  x: { field: 'm' },
  data: [
    { m: 'Jan', a: 1 },
    { m: 'Feb', a: 2 },
    { m: 'Mar', a: 3 },
  ],
  series: [{ kind: 'line', field: 'a' }],
});

describe('createRangeDrag', () => {
  it('asks for a range from the pressed point to each point the pointer reaches', () => {
    const drag = createRangeDrag();

    drag.point(model, 'Mar');
    expect(drag.press()).toBe(true);
    expect(drag.point(model, 'Mar')).toBeUndefined();
    expect(drag.point(model, 'Jan')).toEqual({ from: 'Jan', to: 'Mar' });
    expect(drag.release()).toBe(false);
    expect(drag.point(model, 'Feb')).toBeUndefined();
  });

  it('reads a release on the pressed point as a click', () => {
    const drag = createRangeDrag();

    drag.point(model, 'Feb');
    drag.press();

    expect(drag.release()).toBe(true);
  });

  it('starts a touch at the first point under the finger, not at the last one a mouse left', () => {
    const drag = createRangeDrag();

    drag.point(model, 'Jan');
    expect(drag.press(true)).toBe(true);
    expect(drag.point(model, 'Mar')).toBeUndefined();
    expect(drag.release()).toBe(true);

    drag.press(true);
    drag.point(model, 'Mar');
    expect(drag.point(model, 'Feb')).toEqual({ from: 'Feb', to: 'Mar' });
    expect(drag.release()).toBe(false);
  });

  it('starts nothing when no point is under the pointer', () => {
    expect(createRangeDrag().press()).toBe(false);
  });
});
