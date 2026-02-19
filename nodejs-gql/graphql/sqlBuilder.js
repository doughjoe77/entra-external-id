// graphql/sqlBuilder.js

/**
 * Build SET clause for UPDATE statements.
 * Returns:
 *   - setSql: "SET col1 = $1, col2 = $2"
 *   - setParams: [value1, value2]
 */
export function buildSetClause(changes) {
  const setParts = [];
  const setParams = [];

  for (const [key, value] of Object.entries(changes)) {
    setParams.push(value);
    setParts.push(`${key} = $${setParams.length}`);
  }

  return {
    setSql: setParts.join(', '),
    setParams
  };
}

/**
 * Offset WHERE clause placeholders by N.
 * Example:
 *   WHERE id = $1  →  WHERE id = $2  (if offset = 1)
 */
export function offsetWhereClause(whereClause, offset) {
  return whereClause.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + offset}`);
}

/**
 * Build UPDATE SQL with WHERE clause and placeholder offsetting.
 */
export function buildUpdateSql({
  table,
  alias,
  setSql,
  whereClause,
  returning = '*'
}) {
  return `
    UPDATE ${table} ${alias}
    SET ${setSql}
    ${whereClause}
    RETURNING ${returning};
  `;
}

/**
 * Build DELETE SQL with WHERE clause.
 */
export function buildDeleteSql({
  table,
  alias,
  whereClause,
  returning = '*'
}) {
  return `
    DELETE FROM ${table} ${alias}
    ${whereClause}
    RETURNING ${returning};
  `;
}
