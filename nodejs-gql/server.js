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

import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';
import { jwtMiddleware } from './auth.js';
import { pubsub } from './graphql/pubsub.js';

// ------------------------------------------------------------
// Build schema manually (Apollo Server 5 does NOT expose schema)
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
  schema
});

await server.start();

// ------------------------------------------------------------
// HTTP GraphQL (Queries + Mutations)
// ------------------------------------------------------------

// JWT middleware FIRST
app.use('/graphql', jwtMiddleware);

// Apollo middleware
app.use(
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
    schema, // ⭐ FIXED — Apollo 5 requires manually built schema

    context: async (ctx) => {
      console.log("--------------------------------------------------");
      console.log("[WS] New WebSocket connection");
      console.log("[WS] connectionParams =", ctx.connectionParams);

      const token =
        ctx.connectionParams?.Authorization ||
        ctx.connectionParams?.authorization ||
        null;

      console.log("[WS] extracted token =", token);

      const fakeReq = { headers: { authorization: token } };
      const fakeRes = {};

      await new Promise(resolve =>
        jwtMiddleware(fakeReq, fakeRes, resolve)
      );

      console.log("[WS] authenticated user =", fakeReq.auth);

      return { user: fakeReq.auth || null };
    }
  },
  wsServer
);

// ------------------------------------------------------------
// GraphiQL config + static UI
// ------------------------------------------------------------
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

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/graphiql', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'graphiql.html');
  const html = await readFile(filePath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ------------------------------------------------------------
// Start HTTP + WS server
// ------------------------------------------------------------
httpServer.listen(port, () => {
  console.log(`HTTP+WS GraphQL ready at http://localhost:${port}/graphql`);
  console.log(`GraphiQL UI ready at http://localhost:${port}/graphiql`);
});
