// public/graphiql.js
import { loadSchema, renderTree } from "./schema-and-tree.js";
import { QueryBuilder } from "./query-builder.js";

window.addEventListener("DOMContentLoaded", async () => {
  const builderEl = document.getElementById("builder");
  const graphiqlEl = document.getElementById("graphiql");

  const schema = await loadSchema();

  let currentQuery = "";

  const fetcher = async params => {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return res.json();
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
