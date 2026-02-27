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

// Live query state
const liveQueryState = new Map();

// Poll interval from .env
const POLL_MS = parseInt(process.env.LIVE_QUERY_POLL_MS || "30000", 10);

// supports timer subscription
let timeSubscribers = 0;
let timeInterval = null;

// Create stable key for subscription args
function makeKey(args) {
  return JSON.stringify(args || {});
}

// Reuse your existing dynamic SQL builder for authors
async function runDynamicAuthorQuery(args, user) {
  requireAuth(user);

  const params = [];
  const { clause, params: whereParams } = buildWhereClause('a', args.where, params);
  const orderBy = buildOrderBy('a', args.order_by);

  let sql = `SELECT a.* FROM authors a ${clause} ${orderBy}`;
  if (args.limit) sql += ` LIMIT ${args.limit}`;
  if (args.offset) sql += ` OFFSET ${args.offset}`;

  return query(sql, whereParams);
}

async function pollLiveQueries() {
  for (const [key, entry] of liveQueryState.entries()) {
    const { args, user } = entry;

    const rows = await runDynamicAuthorQuery(args, user);

    // Convert new rows into a map for comparison
    const newMap = new Map(rows.map(r => [r.id, r]));

    // First run → send full results
    if (!entry.lastRows) {
      entry.lastRows = newMap;
      pubsub.publish(key, {
        author_live: {
          inserts: rows,
          updates: [],
          deletes: []
        }
      });
      continue;
    }

    const oldMap = entry.lastRows;

    const inserts = [];
    const updates = [];
    const deletes = [];

    // Detect inserts + updates
    for (const [id, newRow] of newMap.entries()) {
      if (!oldMap.has(id)) {
        inserts.push(newRow);
      } else {
        const oldRow = oldMap.get(id);
        if (JSON.stringify(oldRow) !== JSON.stringify(newRow)) {
          updates.push(newRow);
        }
      }
    }

    // Detect deletes
    for (const [id, oldRow] of oldMap.entries()) {
      if (!newMap.has(id)) {
        deletes.push(oldRow);
      }
    }

    // Update stored state
    entry.lastRows = newMap;

    // Only publish if something changed
    if (inserts.length || updates.length || deletes.length) {
      pubsub.publish(key, {
        author_live: { inserts, updates, deletes }
      });
    }
  }
}


// Start polling
setInterval(pollLiveQueries, POLL_MS);

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
        requireAuth(user);

        timeSubscribers++;

        // Start timer if this is the first subscriber
        if (timeSubscribers === 1) {
          console.log("[TIME] starting TIME_TICK interval");
          timeInterval = setInterval(() => {
            pubsub.publish("TIME_TICK", {
              time: { now: new Date().toISOString() }
            });
          }, 60000); // 1 minute
        }

        // Cleanup callback when client disconnects
        const onStop = () => {
          timeSubscribers--;

          console.log("[TIME] subscriber disconnected, remaining =", timeSubscribers);

          // Stop timer if no subscribers left
          if (timeSubscribers === 0) {
            console.log("[TIME] stopping TIME_TICK interval");
            clearInterval(timeInterval);
            timeInterval = null;
          }
        };

        return pubsub.asyncIterator("TIME_TICK", onStop);
      },

      resolve: payload => payload?.time || { now: new Date().toISOString() }
    },

    author_live: {
      subscribe: (_, args, { user }) => {
        requireAuth(user);

        const key = JSON.stringify(args || {});
        console.log("[SUBSCRIBE] author_live key =", key);

        // Create entry if new
        if (!liveQueryState.has(key)) {
          liveQueryState.set(key, {
            args,
            user,
            lastRows: null
          });
        }

        // Start polling if not running
        if (!global.liveQueryInterval) {
          console.log("[POLL] starting interval");
          global.liveQueryInterval = setInterval(pollLiveQueries, POLL_MS);
        }

        // Cleanup callback when client disconnects
        const onStop = () => {
          console.log("[UNSUBSCRIBE] removing key", key);
          liveQueryState.delete(key);

          // Stop polling if no subscribers left
          if (liveQueryState.size === 0) {
            console.log("[POLL] stopping interval");
            clearInterval(global.liveQueryInterval);
            global.liveQueryInterval = null;
          }
        };

        // Pass cleanup callback to pubsub
        return pubsub.asyncIterator(key, onStop);
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
