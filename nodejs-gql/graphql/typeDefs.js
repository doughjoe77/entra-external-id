// graphql/typeDefs.js
export const typeDefs = `#graphql
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
