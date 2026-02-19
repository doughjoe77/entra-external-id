// graphql/aggregateBuilder.js

import { buildWhereClause } from './whereBuilder.js';
import { buildOrderBy } from './orderByBuilder.js';

/**
 * Build aggregate SELECT expressions for a table.
 * This matches Hasura-style nested aggregates.
 */
export function buildAggregateSelect(tableAlias, numericColumns) {
  const parts = [];

  // COUNT
  parts.push(`COUNT(*)::int AS count`);

  // SUM
  for (const col of numericColumns) {
    parts.push(`SUM(${tableAlias}.${col})::int AS sum_${col}`);
  }

  // AVG
  for (const col of numericColumns) {
    parts.push(`AVG(${tableAlias}.${col})::float AS avg_${col}`);
  }

  // MIN
  for (const col of numericColumns) {
    parts.push(`MIN(${tableAlias}.${col})::int AS min_${col}`);
  }

  // MAX
  for (const col of numericColumns) {
    parts.push(`MAX(${tableAlias}.${col})::int AS max_${col}`);
  }

  return parts.join(',\n          ');
}

/**
 * Build GROUP BY clause from allowed columns.
 */
export function buildGroupBy(groupBy, allowedColumns, tableAlias) {
  if (!groupBy || !Array.isArray(groupBy)) return '';

  const cols = groupBy.filter(col => allowedColumns.includes(col));
  if (!cols.length) return '';

  return `GROUP BY ${cols.map(c => `${tableAlias}.${c}`).join(', ')}`;
}

/**
 * Build the full aggregate SQL query.
 */
export function buildAggregateQuery({
  table,
  alias,
  where,
  groupBy,
  orderBy,
  limit,
  offset,
  numericColumns,
  allowedGroupByColumns
}) {
  const params = [];
  const { clause, params: whereParams } = buildWhereClause(alias, where, params);

  const groupBySql = buildGroupBy(groupBy, allowedGroupByColumns, alias);
  const orderBySql = buildOrderBy(alias, orderBy);

  const aggregateSelect = buildAggregateSelect(alias, numericColumns);

  const aggregateSql = `
    SELECT
      ${aggregateSelect}
    FROM ${table} ${alias}
    ${clause}
  `;

  let nodesSql = `
    SELECT ${alias}.*
    FROM ${table} ${alias}
    ${clause}
    ${groupBySql}
    ${orderBySql}
  `;

  if (limit) nodesSql += ` LIMIT ${limit}`;
  if (offset) nodesSql += ` OFFSET ${offset}`;

  return {
    aggregateSql,
    nodesSql,
    params: whereParams
  };
}

/**
 * Normalize aggregate row into Hasura-style nested objects.
 */
export function normalizeAggregateRow(row, numericColumns) {
  const sum = {};
  const avg = {};
  const min = {};
  const max = {};

  for (const col of numericColumns) {
    sum[col] = row[`sum_${col}`] ?? null;
    avg[col] = row[`avg_${col}`] ?? null;
    min[col] = row[`min_${col}`] ?? null;
    max[col] = row[`max_${col}`] ?? null;
  }

  return {
    count: row.count ?? 0,
    sum,
    avg,
    min,
    max
  };
}
