// graphql/orderByBuilder.js

export function buildOrderBy(alias, orderBy) {
  if (!orderBy) return '';
  const parts = [];
  for (const [col, dir] of Object.entries(orderBy)) {
    if (dir) parts.push(`${alias}.${col} ${dir.toUpperCase()}`);
  }
  return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
}
