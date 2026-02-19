// server.js
import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express from 'express';
import path from 'path';
import url from 'url';
import { readFile } from 'fs/promises';

import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';

const app = express();
const port = process.env.PORT || 4000;

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server)
);

// Static GraphiQL UI
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/graphiql', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'graphiql.html');
  const html = await readFile(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Start Express
app.listen(port, () => {
  console.log(`GraphQL API ready at http://localhost:${port}/graphql`);
  console.log(`GraphiQL UI ready at http://localhost:${port}/graphiql`);
});
