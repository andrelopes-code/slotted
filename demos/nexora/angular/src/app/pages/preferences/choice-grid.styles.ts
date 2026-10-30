/**
 * The choice grid every group of tiles on the preferences page is laid out
 * in, shared by the appearance section and the Controls section.
 */
export const CHOICE_GRID = `
    /*
     * A group of choices is a grid of framed tiles with one track width and
     * one row height for the whole group: grid-auto-rows: 1fr and the
     * stretch a grid item takes by default. A track is never narrower than the
     * group's longest label (--longest, in characters) plus two, set in the
     * ch of the face the radio group draws its labels in, plus what stands
     * before the label (--_lead) and the tile's own frame: its inset on both
     * sides, the radio's circle and the gap after it. --_floor is the
     * narrowest a tile's other content allows. A label stays on one line.
     */
    .choices {
      --_lead: 0px;
      --_floor: 0px;
      --_frame: calc(
        2 * var(--slotted-control-padding-inline-md) + var(--slotted-selection-size-md) +
          var(--slotted-control-label-gap-md)
      );
      display: grid;
      gap: var(--slotted-space-4);
      grid-auto-rows: 1fr;
      grid-template-columns: repeat(
        auto-fill,
        minmax(
          min(
            calc(max(var(--_floor), var(--_lead) + (var(--longest) + 2) * 1ch) + var(--_frame)),
            100%
          ),
          1fr
        )
      );
    }
    .tile-label {
      white-space: nowrap;
    }
    .group-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--slotted-space-4);
    }
`;
