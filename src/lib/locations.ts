// Locations are typed as a path, e.g. "Salón › Vitrina 1 › Estante 2". This turns them into a tree.

export const SEP = "›";

export function splitLocation(loc: string | null | undefined) {
  return (loc ?? "")
    .split(/\s*[›>/]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function joinLocation(parts: string[]) {
  return parts.join(` ${SEP} `);
}

export type LocationNode = { name: string; path: string; count: number; children: LocationNode[] };

export function buildTree(locations: (string | null)[]): { roots: LocationNode[]; unassigned: number } {
  const roots: LocationNode[] = [];
  let unassigned = 0;
  for (const loc of locations) {
    const parts = splitLocation(loc);
    if (parts.length === 0) {
      unassigned++;
      continue;
    }
    let level = roots;
    parts.forEach((name, i) => {
      const path = joinLocation(parts.slice(0, i + 1));
      let node = level.find((n) => n.name.toLowerCase() === name.toLowerCase());
      if (!node) {
        node = { name, path, count: 0, children: [] };
        level.push(node);
      }
      node.count++;
      level = node.children;
    });
  }
  const sort = (nodes: LocationNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }));
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return { roots, unassigned };
}

export function flatten(nodes: LocationNode[]): LocationNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

/** True if `location` is `path` or somewhere inside it. */
export function isInside(location: string | null, path: string) {
  const a = splitLocation(location).map((p) => p.toLowerCase());
  const b = splitLocation(path).map((p) => p.toLowerCase());
  return b.length > 0 && b.every((p, i) => a[i] === p);
}
