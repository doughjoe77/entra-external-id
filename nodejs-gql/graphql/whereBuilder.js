// graphql/whereBuilder.js

export function buildWhereClause(alias, where, params) {
  if (!where) return { clause: '', params };

  const parts = [];

  const addComp = (column, exp) => {
    if (!exp) return;

    if (exp._eq !== undefined) {
      params.push(exp._eq);
      parts.push(`${alias}.${column} = $${params.length}`);
    }
    if (exp._neq !== undefined) {
      params.push(exp._neq);
      parts.push(`${alias}.${column} <> $${params.length}`);
    }

    if (exp._gt !== undefined) {
      params.push(exp._gt);
      parts.push(`${alias}.${column} > $${params.length}`);
    }
    if (exp._gte !== undefined) {
      params.push(exp._gte);
      parts.push(`${alias}.${column} >= $${params.length}`);
    }
    if (exp._lt !== undefined) {
      params.push(exp._lt);
      parts.push(`${alias}.${column} < $${params.length}`);
    }
    if (exp._lte !== undefined) {
      params.push(exp._lte);
      parts.push(`${alias}.${column} <= $${params.length}`);
    }

    if (exp._in) {
      params.push(exp._in);
      parts.push(`${alias}.${column} = ANY($${params.length})`);
    }
    if (exp._nin) {
      params.push(exp._nin);
      parts.push(`NOT (${alias}.${column} = ANY($${params.length}))`);
    }

    if (exp._like !== undefined) {
      params.push(exp._like);
      parts.push(`${alias}.${column} LIKE $${params.length}`);
    }
    if (exp._nlike !== undefined) {
      params.push(exp._nlike);
      parts.push(`NOT (${alias}.${column} LIKE $${params.length})`);
    }

    if (exp._ilike !== undefined) {
      params.push(exp._ilike);
      parts.push(`${alias}.${column} ILIKE $${params.length}`);
    }
    if (exp._nilike !== undefined) {
      params.push(exp._nilike);
      parts.push(`NOT (${alias}.${column} ILIKE $${params.length})`);
    }

    if (exp._similar !== undefined) {
      params.push(exp._similar);
      parts.push(`${alias}.${column} SIMILAR TO $${params.length}`);
    }
    if (exp._nsimilar !== undefined) {
      params.push(exp._nsimilar);
      parts.push(`NOT (${alias}.${column} SIMILAR TO $${params.length})`);
    }

    if (exp._regex !== undefined) {
      params.push(exp._regex);
      parts.push(`${alias}.${column} ~ $${params.length}`);
    }
    if (exp._nregex !== undefined) {
      params.push(exp._nregex);
      parts.push(`NOT (${alias}.${column} ~ $${params.length})`);
    }
    if (exp._iregex !== undefined) {
      params.push(exp._iregex);
      parts.push(`${alias}.${column} ~* $${params.length}`);
    }
    if (exp._niregex !== undefined) {
      params.push(exp._niregex);
      parts.push(`NOT (${alias}.${column} ~* $${params.length})`);
    }

    if (exp._is_null === true) {
      parts.push(`${alias}.${column} IS NULL`);
    }
    if (exp._is_not_null === true) {
      parts.push(`${alias}.${column} IS NOT NULL`);
    }
  };

  const handle = (exp) => {
    if (!exp) return null;

    const sub = [];

    if (exp._and) {
      const andParts = exp._and.map(handle).filter(Boolean);
      if (andParts.length) sub.push(`(${andParts.join(' AND ')})`);
    }

    if (exp._or) {
      const orParts = exp._or.map(handle).filter(Boolean);
      if (orParts.length) sub.push(`(${orParts.join(' OR ')})`);
    }

    if (exp._not) {
      const notPart = handle(exp._not);
      if (notPart) sub.push(`NOT (${notPart})`);
    }

    addComp('id', exp.id);
    addComp('name', exp.name);
    addComp('country', exp.country);
    addComp('birth_year', exp.birth_year);
    addComp('title', exp.title);
    addComp('year', exp.year);
    addComp('author_id', exp.author_id);

    if (parts.length) sub.push(parts.join(' AND '));

    return sub.length ? sub.join(' AND ') : null;
  };

  const final = handle(where);
  if (!final) return { clause: '', params };

  return { clause: `WHERE ${final}`, params };
}
