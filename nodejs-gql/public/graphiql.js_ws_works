// public/graphiql.js
console.log("[GraphiQL] graphiql.js loaded, token =", window.accessToken);

import { loadSchema, renderTree } from "./schema-and-tree.js";
import { QueryBuilder } from "./query-builder.js";

async function bootGraphiQL() {
  console.log("[GraphiQL] bootGraphiQL start");

  const builderEl = document.getElementById("builder");
  const graphiqlEl = document.getElementById("graphiql");

  console.log("[GraphiQL] Loading schema…");
  const schema = await loadSchema();
  console.log("[GraphiQL] Schema loaded");

  const wsUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/graphql";

  console.log("[GraphiQL] WS URL =", wsUrl);

  const wsClient = graphqlWs.createClient({
    url: wsUrl,
    connectionParams: {
      Authorization: "Bearer " + window.accessToken
    }
  });

  // ⭐ Official UMD fetcher (subscriptions included)
  const fetcher = GraphiQL.createFetcher({
    url: "/graphql",
    wsClient,
    headers: {
      Authorization: "Bearer " + window.accessToken
    }
  });

  // ⭐ We need a ref to GraphiQL to update the editor
  const graphiqlRef = React.createRef();

  let currentQuery = "";

  function render() {
    ReactDOM.render(
      React.createElement(GraphiQL, {
        ref: graphiqlRef,
        fetcher,
        defaultQuery: currentQuery,
        onEditQuery: q => {
          console.log("[GraphiQL] Query edited");
          currentQuery = q;
        }
      }),
      graphiqlEl
    );
  }

  // Initial render
  render();

  // ⭐ Tree → editor sync
  renderTree(builderEl, schema, q => {
    console.log("[GraphiQL] Tree updated query:", q);
    currentQuery = q;

    // Update the editor directly
    if (graphiqlRef.current) {
      console.log("[GraphiQL] Updating editor via ref");
      graphiqlRef.current.updateQuery(q);
    }
  });

  console.log("[GraphiQL] bootGraphiQL complete");
}

bootGraphiQL();
