// graphql/resolvers.js
import { query } from './db.js';
import { buildWhereClause } from './whereBuilder.js';
import { buildOrderBy } from './orderByBuilder.js';

import {
  buildAggregateQuery,
  normalizeAggregateRow
} from './aggregateBuilder.js';

import {
  buildSetClause,
  offsetWhereClause,
  buildUpdateSql,
  buildDeleteSql
} from './sqlBuilder.js';
import { pubsub } from './pubsub.js';
import { requireAuth } from '../requireAuth.js';

const AUTHOR_COLUMNS = ['id', 'name', 'country', 'birth_year'];
const BOOK_COLUMNS = ['id', 'title', 'year', 'author_id'];

const AUTHOR_NUMERIC = ['birth_year'];
const BOOK_NUMERIC = ['year', 'author_id'];

export const resolvers = {
  Query: {
    whoami: (_, __, { user }) => user,

    authors: async (_, args, { user }) => {
      requireAuth(user);
      const params = [];
      const { clause, params: whereParams } = buildWhereClause('a', args.where, params);
      const orderBy = buildOrderBy('a', args.order_by);

      let sql = `SELECT a.* FROM authors a ${clause} ${orderBy}`;
      if (args.limit) sql += ` LIMIT ${args.limit}`;
      if (args.offset) sql += ` OFFSET ${args.offset}`;

      return query(sql, whereParams);
    },

    books: async (_, args, { user }) => {
      requireAuth(user);
      const params = [];
      const { clause, params: whereParams } = buildWhereClause('b', args.where, params);
      const orderBy = buildOrderBy('b', args.order_by);

      let sql = `SELECT b.* FROM books b ${clause} ${orderBy}`;
      if (args.limit) sql += ` LIMIT ${args.limit}`;
      if (args.offset) sql += ` OFFSET ${args.offset}`;

      return query(sql, whereParams);
    },

    authors_aggregate: async (_, args, { user }) => {
      requireAuth(user);
      const { aggregateSql, nodesSql, params } = buildAggregateQuery({
        table: 'authors',
        alias: 'a',
        where: args.where,
        groupBy: args.group_by,
        orderBy: args.order_by,
        limit: args.limit,
        offset: args.offset,
        numericColumns: AUTHOR_NUMERIC,
        allowedGroupByColumns: AUTHOR_COLUMNS
      });

      const aggRows = await query(aggregateSql, params);
      const nodes = await query(nodesSql, params);

      return {
        aggregate: normalizeAggregateRow(aggRows[0] || {}, AUTHOR_NUMERIC),
        nodes
      };
    },

    books_aggregate: async (_, args, { user }) => {
      requireAuth(user);
      const { aggregateSql, nodesSql, params } = buildAggregateQuery({
        table: 'books',
        alias: 'b',
        where: args.where,
        groupBy: args.group_by,
        orderBy: args.order_by,
        limit: args.limit,
        offset: args.offset,
        numericColumns: BOOK_NUMERIC,
        allowedGroupByColumns: BOOK_COLUMNS
      });

      const aggRows = await query(aggregateSql, params);
      const nodes = await query(nodesSql, params);

      return {
        aggregate: normalizeAggregateRow(aggRows[0] || {}, BOOK_NUMERIC),
        nodes
      };
    }
  },

  Mutation: {
    insert_author: async (_, { object }, { user }) => {
      requireAuth(user);

      const sql = `
        INSERT INTO authors (name, country, birth_year)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const rows = await query(sql, [object.name, object.country, object.birth_year]);
      return rows[0];
    },

    insert_book: async (_, { object }, { user }) => {
      requireAuth(user);

      const sql = `
        INSERT INTO books (title, year, author_id)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const rows = await query(sql, [object.title, object.year, object.author_id]);
      return rows[0];
    },

    update_author: async (_, { where, changes }, { user }) => {
      requireAuth(user);

      const params = [];
      const { clause, params: whereParams } = buildWhereClause('a', where, params);

      const { setSql, setParams } = buildSetClause(changes);
      const offsetWhere = offsetWhereClause(clause, setParams.length);

      const sql = buildUpdateSql({
        table: 'authors',
        alias: 'a',
        setSql,
        whereClause: offsetWhere
      });

      return query(sql, [...setParams, ...whereParams]);
    },

    delete_author: async (_, { where }, { user }) => {
      requireAuth(user);

      const params = [];
      const { clause, params: whereParams } = buildWhereClause('a', where, params);

      const sql = buildDeleteSql({
        table: 'authors',
        alias: 'a',
        whereClause: clause
      });

      return query(sql, whereParams);
    },

    update_book: async (_, { where, changes }, { user }) => {
      requireAuth(user);

      const params = [];
      const { clause, params: whereParams } = buildWhereClause('b', where, params);

      const { setSql, setParams } = buildSetClause(changes);
      const offsetWhere = offsetWhereClause(clause, setParams.length);

      const sql = buildUpdateSql({
        table: 'books',
        alias: 'b',
        setSql,
        whereClause: offsetWhere
      });

      return query(sql, [...setParams, ...whereParams]);
    },

    delete_book: async (_, { where }, { user }) => {
      requireAuth(user);

      const params = [];
      const { clause, params: whereParams } = buildWhereClause('b', where, params);

      const sql = buildDeleteSql({
        table: 'books',
        alias: 'b',
        whereClause: clause
      });

      return query(sql, whereParams);
    }
  },

  Subscription: {
    time: {
      subscribe: (_, __, { user }) => {
        console.log("[SUBSCRIBE] user =", user);
        requireAuth(user);

        const iterator = pubsub.asyncIterator('TIME_TICK');
        console.log("[SUBSCRIBE] iterator created");
        return iterator;
      },

      resolve: (payload) => {
        console.log("[RESOLVE] raw payload =", payload);

        // First call happens before any events are published
        if (!payload) {
          const fallback = { now: new Date().toISOString() };
          console.log("[RESOLVE] using fallback payload =", fallback);
          return fallback;
        }

        // Normal case
        return payload.time;
      }

    }
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

    books_aggregate: async (author, args) => {
      const { aggregateSql, nodesSql, params } = buildAggregateQuery({
        table: 'books',
        alias: 'b',
        where: {
          _and: [
            { author_id: { _eq: author.id } },
            args.where || {}
          ]
        },
        groupBy: args.group_by,
        orderBy: args.order_by,
        limit: args.limit,
        offset: args.offset,
        numericColumns: BOOK_NUMERIC,
        allowedGroupByColumns: BOOK_COLUMNS
      });

      const aggRows = await query(aggregateSql, params);
      const nodes = await query(nodesSql, params);

      return {
        aggregate: normalizeAggregateRow(aggRows[0] || {}, BOOK_NUMERIC),
        nodes
      };
    }
  },

  Book: {
    author: async (book) => {
      const rows = await query(`SELECT * FROM authors WHERE id = $1`, [book.author_id]);
      return rows[0];
    }
  }
};
