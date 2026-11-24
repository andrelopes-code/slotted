import { Glyph, Icon } from '@slotted/react/icon';
import { Tree, TreeNode } from '@slotted/react/tree';

export default function TreeRowContent() {
  return (
    <Tree aria-label="Documents" defaultExpandedKeys={['contracts', 'forecasts']}>
      <TreeNode value="contracts" label="Contracts" meta="2">
        <TreeNode
          value="contoso"
          label="Contoso Foods 2026.pdf"
          description="Signed"
          meta="1.2 MB"
          icon={
            <Icon>
              <Glyph name="file-text" />
            </Icon>
          }
        />
        <TreeNode
          value="fabrikam"
          label="Fabrikam Supply master services agreement, amended.pdf"
          description="Draft"
          meta="840 kB"
          icon={
            <Icon>
              <Glyph name="file-text" />
            </Icon>
          }
        />
      </TreeNode>
      <TreeNode value="forecasts" label="Forecasts" meta="1">
        <TreeNode
          value="q4"
          label="Q4 demand.xlsx"
          description="Edited today"
          meta="96 kB"
          icon={
            <Icon>
              <Glyph name="file-spreadsheet" />
            </Icon>
          }
        />
      </TreeNode>
    </Tree>
  );
}
