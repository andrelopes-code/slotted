import { Tree, TreeNode } from '@slotted/react/tree';

export default function TreeBasic() {
  return (
    <Tree aria-label="Product categories" defaultExpandedKeys={['beverages']} defaultValue="coffee">
      <TreeNode value="beverages" label="Beverages" meta="148">
        <TreeNode value="coffee" label="Coffee" meta="62" />
        <TreeNode value="tea" label="Tea" meta="54" />
        <TreeNode value="soft-drinks" label="Soft drinks" meta="32" />
      </TreeNode>
      <TreeNode value="pantry" label="Pantry" meta="231">
        <TreeNode value="oils" label="Oils and vinegars" meta="87" />
        <TreeNode value="spices" label="Spices" meta="144" />
      </TreeNode>
      <TreeNode value="household" label="Household" meta="76" />
    </Tree>
  );
}
