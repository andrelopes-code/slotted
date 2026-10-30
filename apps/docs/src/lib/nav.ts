import { getCollection } from 'astro:content';

import type { Framework } from '../runtime/frameworks';
import { familyCatalog } from './catalog';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  heading: string;
  links: NavLink[];
}

const GROUP_ORDER = [
  'Actions',
  'Forms',
  'Data display',
  'Feedback',
  'Navigation',
  'Overlays',
  'Layout',
] as const;

/** The sidebar: foundations first, then the families by group, alphabetically. */
export async function docsNav(framework: Framework): Promise<NavGroup[]> {
  const foundations = (await getCollection('foundations')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const components = await getCollection('components');

  const groups: NavGroup[] = [
    {
      heading: 'Get started',
      links: foundations.map((entry) => ({
        label: entry.data.title,
        href: `/foundations/${entry.id}/`,
      })),
    },
  ];

  for (const entry of components) {
    const { group } = familyCatalog(entry.id);
    if (!(GROUP_ORDER as readonly string[]).includes(group)) {
      throw new Error(`${entry.id}: catalog.group ${group} is not a sidebar group`);
    }
  }

  for (const group of GROUP_ORDER) {
    const members = components
      .filter((entry) => familyCatalog(entry.id).group === group)
      .sort((a, b) => a.data.title.localeCompare(b.data.title));
    if (members.length === 0) continue;
    groups.push({
      heading: group,
      links: members.map((entry) => ({
        label: entry.data.title,
        href: `/${framework}/components/${entry.id}/`,
      })),
    });
  }

  return groups;
}
