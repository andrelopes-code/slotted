const CORNERS = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
] as const;

/**
 * The radii of the bar a grip paints in its content box, as the browser
 * derives them for each corner: the border radii scaled down to fit the box,
 * less the padding on each axis. `half` is half the bar's block size.
 */
export function paintedGripRadii(grip: HTMLElement) {
  const style = getComputedStyle(grip);
  const radii = CORNERS.map((corner) => {
    const [rx = 0, ry = rx] = style[corner].split(' ').map(Number.parseFloat);

    return { rx, ry };
  });
  const scale = Math.min(
    1,
    grip.offsetWidth / Math.max(...radii.map(({ rx }) => 2 * rx)),
    grip.offsetHeight / Math.max(...radii.map(({ ry }) => 2 * ry)),
  );
  const corners = radii.map(({ rx, ry }) => ({
    block: ry * scale - Number.parseFloat(style.paddingTop),
    inline: rx * scale - Number.parseFloat(style.paddingLeft),
  }));

  return { corners, half: Number.parseFloat(style.height) / 2 };
}
