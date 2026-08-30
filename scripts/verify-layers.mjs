import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAYERS = {
  // Tens digit is the architectural layer; ones digit orders packages inside it.
  '@slotted/tokens': 10,
  '@slotted/styles': 10,
  '@slotted/theme-default': 11,
  '@slotted/core': 20,
  '@slotted/react': 30,
  '@slotted/angular': 30,
  '@slotted/testing': 40,
  '@slotted/storybook-workbench': 40,
};

const TOOLING_LAYER = 40;
const DEPENDENCY_KINDS = ['dependencies', 'devDependencies', 'peerDependencies'];

export function layerViolations(manifests) {
  return manifests.flatMap((manifest) => {
    const layer = LAYERS[manifest.name];
    if (layer === undefined) return [];

    return manifest.dependencies.flatMap((dependency) => {
      const dependencyLayer = LAYERS[dependency.name];
      if (dependencyLayer === undefined || dependencyLayer < layer) return [];

      const isInternalTooling =
        dependencyLayer === TOOLING_LAYER && dependency.kind === 'devDependencies';
      if (isInternalTooling) return [];

      return [
        `${manifest.name} (rank ${layer}) must not depend on ${dependency.name} (rank ${dependencyLayer})`,
      ];
    });
  });
}

function readManifests(roots) {
  return roots.flatMap((root) =>
    readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
      .flatMap((entry) => {
        const directory = join(root, entry.name);
        const manifestPath = join(directory, 'package.json');
        if (!existsSync(manifestPath)) return readManifests([directory]);

        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        return [
          {
            name: manifest.name,
            dependencies: DEPENDENCY_KINDS.flatMap((kind) =>
              Object.keys(manifest[kind] ?? {}).map((name) => ({ name, kind })),
            ),
          },
        ];
      }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
  const violations = layerViolations(
    readManifests([join(repositoryRoot, 'packages'), join(repositoryRoot, 'apps')]),
  );

  if (violations.length > 0) {
    console.error('Layer dependency rule violated:');
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
  }
}
