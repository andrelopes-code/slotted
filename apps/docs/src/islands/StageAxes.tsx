import { useEffect, useState } from 'react';

import { Segment, SegmentedControl } from '@slotted/react/segmented-control';

interface Props {
  /** The id of the element whose theme axes the bar drives. */
  target: string;
}

/** The home stage's axis bar: scheme and density, applied in place. */
export default function StageAxes({ target }: Props) {
  const [scheme, setScheme] = useState('light');
  const [density, setDensity] = useState('compact');

  useEffect(() => {
    const page = document.documentElement.getAttribute('data-slotted-scheme');
    if (page) setScheme(page);
  }, []);

  const apply = (axis: 'scheme' | 'density', value: string) => {
    const element = document.getElementById(target);
    if (!element) return;
    element.setAttribute('data-slotted-theme', 'default');
    element.setAttribute(`data-slotted-${axis}`, value);
  };

  return (
    <div className="stage-axes">
      <SegmentedControl
        aria-label="Stage scheme"
        size="sm"
        value={scheme}
        onValueChange={(value) => {
          if (!value) return;
          setScheme(value);
          apply('scheme', value);
        }}
      >
        <Segment value="light">Light</Segment>
        <Segment value="dark">Dark</Segment>
        <Segment value="high-contrast">High contrast</Segment>
      </SegmentedControl>
      <SegmentedControl
        aria-label="Stage density"
        size="sm"
        value={density}
        onValueChange={(value) => {
          if (!value) return;
          setDensity(value);
          apply('density', value);
        }}
      >
        <Segment value="comfortable">Comfortable</Segment>
        <Segment value="compact">Compact</Segment>
        <Segment value="dense">Dense</Segment>
      </SegmentedControl>
    </div>
  );
}
