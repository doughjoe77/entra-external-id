// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import url from 'url';
import { readFile } from 'fs/promises';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';

import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { jwtMiddleware } from './auth.js';

const app = express();
const port = process.env.PORT || 4001;

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers
});

await server.start();

// JWT middleware FIRST
app.use('/graphql', jwtMiddleware);

// Apollo middleware
app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      return {
        user: req.auth || null
      };
    }
  })
);

// Dynamic config.js for GraphiQL
app.get('/graphiql/config.js', (req, res) => {
  const js = `
    window.appConfig = {
      clientId: "${process.env.CLIENT_ID}",
      authority: "${process.env.AUTHORITY}",
      redirectUri: "${process.env.REDIRECT_URI}",
      apiScope: "${process.env.API_SCOPE}",
      logoutMinutes: ${process.env.LOGOUT_MINUTES || 60}
    };
  `;

  res.setHeader("Content-Type", "application/javascript");
  res.send(js);
});


// Static GraphiQL UI
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/graphiql', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'graphiql.html');
  const html = await readFile(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Start server
app.listen(port, () => {
  console.log(`GraphQL API ready at http://localhost:${port}/graphql`);
  console.log(`GraphiQL UI ready at http://localhost:${port}/graphiql`);
});
