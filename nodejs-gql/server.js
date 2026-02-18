// server.js
import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express from 'express';
import pkg from 'pg';
import path from 'path';
import { readFile } from 'fs/promises';
import url from 'url';

const app = express();
const port = process.env.PORT || 4000;
const { Pool } = pkg;

// -------------------------------------------------------
// PostgreSQL connection using .env
// -------------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper to run SQL
async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// -------------------------------------------------------
// GraphQL Schema
// -------------------------------------------------------
const typeDefs = `#graphql
  input StringComparisonExp {
    _eq: String
    _neq: String
    _like: String
    _nlike: String
    _ilike: String
    _nilike: String
    _similar: String
    _nsimilar: String
    _regex: String
    _nregex: String
    _iregex: String
    _niregex: String
    _in: [String!]
    _nin: [String!]
    _is_null: Boolean
    _is_not_null: Boolean
  }

  input IntComparisonExp {
    _eq: Int
    _neq: Int
    _gt: Int
    _gte: Int
    _lt: Int
    _lte: Int
    _in: [Int!]
    _nin: [Int!]
    _is_null: Boolean
    _is_not_null: Boolean
  }

  input AuthorBoolExp {
    _and: [AuthorBoolExp!]
    _or: [AuthorBoolExp!]
    _not: AuthorBoolExp
    id: IntComparisonExp
    name: StringComparisonExp
    country: StringComparisonExp
    birth_year: IntComparisonExp
  }

  input BookBoolExp {
    _and: [BookBoolExp!]
    _or: [BookBoolExp!]
    _not: BookBoolExp
    id: IntComparisonExp
    title: StringComparisonExp
    year: IntComparisonExp
    author_id: IntComparisonExp
  }

  enum OrderBy {
    asc
    desc
  }

  input AuthorOrderBy {
    id: OrderBy
    name: OrderBy
    country: OrderBy
    birth_year: OrderBy
  }

  input BookOrderBy {
    id: OrderBy
    title: OrderBy
    year: OrderBy
  }

  input AuthorInsertInput {
    name: String!
    country: String
    birth_year: Int
  }

  input BookInsertInput {
    title: String!
    year: Int
    author_id: Int!
  }

  type Author {
    id: Int!
    name: String!
    country: String
    birth_year: Int
    books(
      where: BookBoolExp
      limit: Int
      offset: Int
      order_by: BookOrderBy
    ): [Book!]!
  }

  type Book {
    id: Int!
    title: String!
    year: Int
    author: Author!
  }

  type Query {
    authors(
      where: AuthorBoolExp
      limit: Int
      offset: Int
      order_by: AuthorOrderBy
    ): [Author!]!

    books(
      where: BookBoolExp
      limit: Int
      offset: Int
      order_by: BookOrderBy
    ): [Book!]!
  }

  type Mutation {
    insert_author(object: AuthorInsertInput!): Author!
    insert_book(object: BookInsertInput!): Book!
  }
`;

// -------------------------------------------------------
// WHERE / ORDER BY builders
// -------------------------------------------------------
function buildWhereClause(alias, where, params) {
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

function buildOrderBy(alias, orderBy) {
  if (!orderBy) return '';
  const parts = [];
  for (const [col, dir] of Object.entries(orderBy)) {
    if (dir) parts.push(`${alias}.${col} ${dir.toUpperCase()}`);
  }
  return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
}

// -------------------------------------------------------
// Resolvers
// -------------------------------------------------------
const resolvers = {
  Query: {
    authors: async (_, args) => {
      const params = [];
      const { clause, params: whereParams } = buildWhereClause('a', args.where, params);
      const orderBy = buildOrderBy('a', args.order_by);

      let sql = `SELECT a.* FROM authors a ${clause} ${orderBy}`;
      if (args.limit) sql += ` LIMIT ${args.limit}`;
      if (args.offset) sql += ` OFFSET ${args.offset}`;

      return query(sql, whereParams);
    },

    books: async (_, args) => {
      const params = [];
      const { clause, params: whereParams } = buildWhereClause('b', args.where, params);
      const orderBy = buildOrderBy('b', args.order_by);

      let sql = `SELECT b.* FROM books b ${clause} ${orderBy}`;
      if (args.limit) sql += ` LIMIT ${args.limit}`;
      if (args.offset) sql += ` OFFSET ${args.offset}`;

      return query(sql, whereParams);
    },
  },

  Mutation: {
    insert_author: async (_, { object }) => {
      const sql = `
        INSERT INTO authors (name, country, birth_year)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const rows = await query(sql, [object.name, object.country, object.birth_year]);
      return rows[0];
    },

    insert_book: async (_, { object }) => {
      const sql = `
        INSERT INTO books (title, year, author_id)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const rows = await query(sql, [object.title, object.year, object.author_id]);
      return rows[0];
    },
  },

  Author: {
    books: async (author, args) => {
      const params = [];
      const baseWhere = { _and: [{ author_id: { _eq: author.id } }, args.where || {}] };
      const { clause, params: whereParams } = buildWhereClause('b', baseWhere, params);
      const orderBy = buildOrderBy('b', args.order_by);

      let sql = `SELECT b.* FROM books b ${clause} ${orderBy}`;
      if (args.limit) sql += ` LIMIT ${args.limit}`;
      if (args.offset) sql += ` OFFSET ${args.offset}`;

      return query(sql, whereParams);
    },
  },

  Book: {
    author: async (book) => {
      const rows = await query(`SELECT * FROM authors WHERE id = $1`, [book.author_id]);
      return rows[0];
    },
  },
};

// -------------------------------------------------------
// Apollo Server 5 + Express 5
// -------------------------------------------------------
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start Apollo
await server.start();

// Mount Apollo middleware at /graphql
app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server)
);

// -------------------------------------------------------
// Static GraphiQL UI
// -------------------------------------------------------
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/graphiql', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'graphiql.html');
  const html = await readFile(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// -------------------------------------------------------
// Start Express
// -------------------------------------------------------
app.listen(port, () => {
  console.log(`🚀 GraphQL API ready at http://localhost:${port}/graphql`);
  console.log(`🧪 GraphiQL UI ready at http://localhost:${port}/graphiql`);
});
