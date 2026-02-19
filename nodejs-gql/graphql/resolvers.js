// graphql/resolvers.js
import { query } from './db.js';
import { buildWhereClause } from './whereBuilder.js';
import { buildOrderBy } from './orderByBuilder.js';

export const resolvers = {
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
