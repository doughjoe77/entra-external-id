// public/graphiql.js
import { loadSchema, renderTree } from "./schema-and-tree.js";
import { QueryBuilder } from "./query-builder.js";

window.addEventListener("DOMContentLoaded", async () => {
  const builderEl = document.getElementById("builder");
  const graphiqlEl = document.getElementById("graphiql");

  const schema = await loadSchema();

  let currentQuery = "";

  // ⭐ Create the WebSocket client using your patched global createClient
  let wsClient = null;

  // ⭐ Minimal hybrid fetcher: POST for queries/mutations, WS for subscriptions
  const fetcher = params => {
    const isSubscription = /^\s*subscription\b/.test(params?.query);

    if (isSubscription) {
      return {
        subscribe: sink => {
          wsClient = window.graphqlWs.createClient({
              url:
                (location.protocol === "https:" ? "wss://" : "ws://") +
                location.host +
                "/graphql",
              lazy: true,
              connectionParams: {
                Authorization: "Bearer " + window.accessToken
              }
            });
          const dispose = wsClient.subscribe(params, {
            next: data => {
              sink.next?.(data);
            },
            error: err => {
              sink.error?.(err);
            },
            complete: () => {
              sink.complete?.();
            }
          });

          // ⭐ GraphiQL requires a cleanup function
          return { unsubscribe: dispose };
        }
      };
    }

    return fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    }).then(res => res.json());
  };

  function renderGraphiQL() {
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher,
        query: currentQuery,
        onEditQuery: q => (currentQuery = q)
      }),
      graphiqlEl
    );
  }

  function updateQuery(newQuery) {
    currentQuery = newQuery || "";
    renderGraphiQL();
  }

  renderGraphiQL();
  renderTree(builderEl, schema, updateQuery);
});
