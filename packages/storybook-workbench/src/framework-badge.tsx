export function FrameworkBadge({ framework }: { framework: 'Angular' | 'React' }) {
  return <span className="slotted-framework-badge">{framework}</span>;
}
