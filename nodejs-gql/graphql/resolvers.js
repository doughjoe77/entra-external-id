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

// Allowed columns for group_by
const AUTHOR_COLUMNS = ['id', 'name', 'country', 'birth_year'];
const BOOK_COLUMNS = ['id', 'title', 'year', 'author_id'];

// Numeric columns for aggregates
const AUTHOR_NUMERIC = ['birth_year'];
const BOOK_NUMERIC = ['year', 'author_id'];

export const resolvers = {
  // -------------------------------------------------------
  // ROOT QUERY RESOLVERS
  // -------------------------------------------------------
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

    // -------------------------------------------------------
    // ROOT-LEVEL AUTHORS AGGREGATE
    // -------------------------------------------------------
    authors_aggregate: async (_, args) => {
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

    // -------------------------------------------------------
    // ROOT-LEVEL BOOKS AGGREGATE
    // -------------------------------------------------------
    books_aggregate: async (_, args) => {
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

  // -------------------------------------------------------
  // MUTATIONS (WHERE-BASED, MODULAR, OFFSET-SAFE)
  // -------------------------------------------------------
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

    // -------------------------------------------------------
    // UPDATE AUTHOR
    // -------------------------------------------------------
    update_author: async (_, { where, changes }) => {
      const params = [];

      // WHERE clause
      const { clause, params: whereParams } = buildWhereClause('a', where, params);
      if (!clause) throw new Error("update_author requires a WHERE clause");

      // SET clause
      const { setSql, setParams } = buildSetClause(changes);

      // Offset WHERE placeholders
      const offsetWhere = offsetWhereClause(clause, setParams.length);

      const sql = buildUpdateSql({
        table: 'authors',
        alias: 'a',
        setSql,
        whereClause: offsetWhere
      });

      return query(sql, [...setParams, ...whereParams]);
    },

    // -------------------------------------------------------
    // DELETE AUTHOR
    // -------------------------------------------------------
    delete_author: async (_, { where }) => {
      const params = [];
      const { clause, params: whereParams } = buildWhereClause('a', where, params);
      if (!clause) throw new Error("delete_author requires a WHERE clause");

      const sql = buildDeleteSql({
        table: 'authors',
        alias: 'a',
        whereClause: clause
      });

      return query(sql, whereParams);
    },

    // -------------------------------------------------------
    // UPDATE BOOK
    // -------------------------------------------------------
    update_book: async (_, { where, changes }) => {
      const params = [];

      const { clause, params: whereParams } = buildWhereClause('b', where, params);
      if (!clause) throw new Error("update_book requires a WHERE clause");

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

    // -------------------------------------------------------
    // DELETE BOOK
    // -------------------------------------------------------
    delete_book: async (_, { where }) => {
      const params = [];
      const { clause, params: whereParams } = buildWhereClause('b', where, params);
      if (!clause) throw new Error("delete_book requires a WHERE clause");

      const sql = buildDeleteSql({
        table: 'books',
        alias: 'b',
        whereClause: clause
      });

      return query(sql, whereParams);
    }
  },

  // -------------------------------------------------------
  // FIELD-LEVEL RESOLVERS
  // -------------------------------------------------------
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

    // -------------------------------------------------------
    // FIELD-LEVEL BOOKS AGGREGATE
    // -------------------------------------------------------
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
