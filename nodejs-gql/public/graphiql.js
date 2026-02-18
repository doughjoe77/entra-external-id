const fetcher = GraphiQL.createFetcher({
  url: "/graphql"
});

const graphiqlRoot = ReactDOM.createRoot(document.getElementById("graphiql"));

graphiqlRoot.render(
  React.createElement(GraphiQL, {
    fetcher,
    defaultEditorToolsVisibility: true,
    ref: (ref) => (window.graphiqlRef = ref)
  })
);
