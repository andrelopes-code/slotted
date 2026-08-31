import '@slotted/styles/splitter/splitter.css';

import { useCallback, useMemo, useRef, useState } from 'react';

import { clampPosition, SplitterContext } from './splitter-context';
import type { SplitterContextValue, SplitterProps } from './splitter.types';

/**
 * The position is the first grid track's size, written inline. A percentage
 * rather than a pixel count, because the container is not measured until
 * layout and a pixel position taken from one viewport is wrong on the next.
 */
export function Splitter({
  children,
  className,
  defaultValue = 50,
  max = 100,
  min = 0,
  onValueChange,
  orientation = 'horizontal',
  step = 5,
  style,
  value,
  ...nativeProps
}: SplitterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const restore = useRef(clampPosition(value ?? defaultValue, min, max));
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const position = clampPosition(value ?? uncontrolled, min, max);

  const setValue = useCallback(
    (next: number) => {
      const clamped = clampPosition(next, min, max);
      if (value === undefined) setUncontrolled(clamped);
      onValueChange?.(clamped);
    },
    [max, min, onValueChange, value],
  );

  const toggleCollapse = useCallback(() => {
    if (position > min) {
      restore.current = position;
      setValue(min);
      return;
    }
    setValue(restore.current > min ? restore.current : max);
  }, [max, min, position, setValue]);

  const context = useMemo<SplitterContextValue>(
    () => ({ max, min, orientation, rootRef, setValue, step, toggleCollapse, value: position }),
    [max, min, orientation, position, setValue, step, toggleCollapse],
  );

  const track = `${position}% auto 1fr`;

  return (
    <SplitterContext.Provider value={context}>
      <div
        {...nativeProps}
        className={['slotted-splitter', className].filter(Boolean).join(' ')}
        data-orientation={orientation}
        data-part="root"
        data-slotted-component="splitter"
        ref={rootRef}
        style={{
          ...style,
          ...(orientation === 'horizontal'
            ? { gridTemplateColumns: track }
            : { gridTemplateRows: track }),
        }}
      >
        {children}
      </div>
    </SplitterContext.Provider>
  );
}
