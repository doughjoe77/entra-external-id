// graphql/typeDefs.js
export const typeDefs = `#graphql
  scalar JSON

  # -------------------------------------------------------
  # Comparison Expressions
  # -------------------------------------------------------
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

  # -------------------------------------------------------
  # Boolean Expressions
  # -------------------------------------------------------
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

  # -------------------------------------------------------
  # Ordering
  # -------------------------------------------------------
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
    author_id: OrderBy
  }

  # -------------------------------------------------------
  # Insert Inputs
  # -------------------------------------------------------
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

  # -------------------------------------------------------
  # Update Inputs
  # -------------------------------------------------------
  input AuthorUpdateInput {
    name: String
    country: String
    birth_year: Int
  }

  input BookUpdateInput {
    title: String
    year: Int
    author_id: Int
  }

  # -------------------------------------------------------
  # Types
  # -------------------------------------------------------
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

    books_aggregate(
      where: BookBoolExp
      group_by: [String!]
      order_by: BookOrderBy
      limit: Int
      offset: Int
    ): BooksAggregate!
  }

  type Book {
    id: Int!
    title: String!
    year: Int
    author: Author!
  }

  # -------------------------------------------------------
  # Aggregate Types
  # -------------------------------------------------------
  type AuthorsSumFields {
    birth_year: Int
  }

  type AuthorsAvgFields {
    birth_year: Float
  }

  type AuthorsMinFields {
    id: Int
    birth_year: Int
  }

  type AuthorsMaxFields {
    id: Int
    birth_year: Int
  }

  type AuthorsAggregateFields {
    count: Int
    sum: AuthorsSumFields
    avg: AuthorsAvgFields
    min: AuthorsMinFields
    max: AuthorsMaxFields
  }

  type AuthorsAggregate {
    aggregate: AuthorsAggregateFields
    nodes: [Author!]!
  }

  type BooksSumFields {
    year: Int
    author_id: Int
  }

  type BooksAvgFields {
    year: Float
    author_id: Float
  }

  type BooksMinFields {
    id: Int
    year: Int
    author_id: Int
  }

  type BooksMaxFields {
    id: Int
    year: Int
    author_id: Int
  }

  type BooksAggregateFields {
    count: Int
    sum: BooksSumFields
    avg: BooksAvgFields
    min: BooksMinFields
    max: BooksMaxFields
  }

  type BooksAggregate {
    aggregate: BooksAggregateFields
    nodes: [Book!]!
  }

  # -------------------------------------------------------
  # Root Query
  # -------------------------------------------------------
  type Query {
    whoami: JSON

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

    authors_aggregate(
      where: AuthorBoolExp
      group_by: [String!]
      order_by: AuthorOrderBy
      limit: Int
      offset: Int
    ): AuthorsAggregate!

    books_aggregate(
      where: BookBoolExp
      group_by: [String!]
      order_by: BookOrderBy
      limit: Int
      offset: Int
    ): BooksAggregate!
  }

  # -------------------------------------------------------
  # Root Mutations
  # -------------------------------------------------------
  type Mutation {
    insert_author(object: AuthorInsertInput!): Author!
    insert_book(object: BookInsertInput!): Book!

    update_author(where: AuthorBoolExp!, changes: AuthorUpdateInput!): [Author!]!
    delete_author(where: AuthorBoolExp!): [Author!]!

    update_book(where: BookBoolExp!, changes: BookUpdateInput!): [Book!]!
    delete_book(where: BookBoolExp!): [Book!]!
  }

  # -------------------------------------------------------
  # Subscription Types
  # -------------------------------------------------------
  type TimeTick {
    now: String!
  }

  type AuthorLivePayload {
    inserts: [Author!]!
    updates: [Author!]!
    deletes: [Author!]!
  }

  # -------------------------------------------------------
  # Root Subscription
  # -------------------------------------------------------
  type Subscription {
    time: TimeTick!

    author_live(
      where: AuthorBoolExp
      limit: Int
      offset: Int
      order_by: AuthorOrderBy
    ): AuthorLivePayload!
  }
`;
