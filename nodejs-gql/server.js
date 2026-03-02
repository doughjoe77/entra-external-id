// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import url from 'url';
import { readFile } from 'fs/promises';

import http from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';

import { makeExecutableSchema } from '@graphql-tools/schema';

// additional security controls
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';


import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { jwtMiddleware } from './auth.js';

// ------------------------------------------------------------
// Feature toggles
// ------------------------------------------------------------
const ENABLE_INTROSPECTION = process.env.ENABLE_INTROSPECTION === "true";
const ENABLE_GRAPHIQL = process.env.ENABLE_GRAPHIQL === "true";
const MAX_QUERY_DEPTH = parseInt(process.env.MAX_QUERY_DEPTH || "10", 10);
const MAX_QUERY_COMPLEXITY = parseInt(process.env.MAX_QUERY_COMPLEXITY || "5000", 5000);

// ------------------------------------------------------------
// Build schema manually
// ------------------------------------------------------------
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

// ------------------------------------------------------------
// Express + HTTP server
// ------------------------------------------------------------
const app = express();
const port = process.env.PORT || 4001;

const httpServer = http.createServer(app);

// ------------------------------------------------------------
// Apollo Server 5
// ------------------------------------------------------------
const server = new ApolloServer({
  schema,
  introspection: ENABLE_INTROSPECTION,
  validationRules: [
    // query depth limit
    depthLimit(MAX_QUERY_DEPTH),
    // query complexity limit
    createComplexityLimitRule(MAX_QUERY_COMPLEXITY, {
      onCost: (cost) => {
        console.log(`[Complexity] Query cost = ${cost}`);
      },
      formatErrorMessage: (cost) =>
        `Query is too complex: ${cost}. Maximum allowed complexity: ${MAX_QUERY_COMPLEXITY}`
    })
  ],
});

await server.start();

// ------------------------------------------------------------
// HTTP GraphQL (Queries + Mutations)
// ------------------------------------------------------------
app.use('/graphql', jwtMiddleware);

app.post(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({
      user: req.auth || null
    })
  })
);

// ------------------------------------------------------------
// WebSocket GraphQL (Subscriptions)
// ------------------------------------------------------------
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

useServer(
  {
    schema,
    context: async (ctx) => {
      const token =
        ctx.connectionParams?.Authorization ||
        ctx.connectionParams?.authorization ||
        null;

      const fakeReq = { headers: { authorization: token } };
      const fakeRes = {};

      await new Promise(resolve =>
        jwtMiddleware(fakeReq, fakeRes, resolve)
      );

      return { user: fakeReq.auth || null };
    }
  },
  wsServer
);

// ------------------------------------------------------------
// GraphiQL config + static UI (conditionally enabled)
// ------------------------------------------------------------
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

if (ENABLE_GRAPHIQL) {
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

  app.use('/public', express.static(path.join(__dirname, 'public')));

  app.get('/graphiql', async (req, res) => {
    const filePath = path.join(__dirname, 'public', 'graphiql.html');
    const html = await readFile(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
}

// ------------------------------------------------------------
// Start HTTP + WS server
// ------------------------------------------------------------
httpServer.listen(port, () => {
  console.log(`GraphQL ready at http://localhost:${port}/graphql`);
  if (ENABLE_GRAPHIQL) {
    console.log(`GraphiQL UI ready at http://localhost:${port}/graphiql`);
  }
});