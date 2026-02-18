async function loadSchema() {
  const res = await fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query IntrospectionQuery {
          __schema {
            types {
              name
              fields {
                name
                type {
                  kind
                  name
                  ofType { name kind }
                }
              }
            }
          }
        }
      `
    })
  });

  const json = await res.json();
  return json.data.__schema.types;
}

function buildTree(types) {
  return types
    .filter((t) => t.fields && !t.name.startsWith("__"))
    .map((t) => ({
      name: t.name,
      fields: t.fields.map((f) => f.name)
    }));
}

function QueryBuilder() {
  const [types, setTypes] = React.useState([]);
  const [selectedType, setSelectedType] = React.useState(null);
  const [selectedFields, setSelectedFields] = React.useState([]);

  React.useEffect(() => {
    loadSchema().then((schemaTypes) => {
      setTypes(buildTree(schemaTypes));
    });
  }, []);

  function toggleField(field) {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  }

  function generateQuery() {
    if (!selectedType) return;

    const fields = selectedFields.length
      ? selectedFields.join("\n    ")
      : "";

    const query = `
query {
  ${selectedType} {
    ${fields}
  }
}
    `;

    window.graphiqlRef?.editor?.setValue(query);
  }

  return React.createElement(
    "div",
    { className: "qb-container" },

    React.createElement("h3", null, "Query Builder"),

    React.createElement(
      "div",
      { className: "qb-types" },
      types.map((t) =>
        React.createElement(
          "div",
          {
            key: t.name,
            className:
              "qb-type" + (t.name === selectedType ? " qb-type-selected" : ""),
            onClick: () => {
              setSelectedType(t.name);
              setSelectedFields([]);
            }
          },
          t.name
        )
      )
    ),

    selectedType &&
      React.createElement(
        "div",
        { className: "qb-fields" },
        React.createElement("h4", null, selectedType + " fields"),
        types
          .find((t) => t.name === selectedType)
          .fields.map((f) =>
            React.createElement(
              "div",
              {
                key: f,
                className:
                  "qb-field" +
                  (selectedFields.includes(f) ? " qb-field-selected" : ""),
                onClick: () => toggleField(f)
              },
              selectedFields.includes(f) ? "✓ " + f : f
            )
          )
      ),

    React.createElement(
      "button",
      { className: "qb-generate", onClick: generateQuery },
      "Insert Query"
    )
  );
}

const builderRoot = ReactDOM.createRoot(document.getElementById("builder"));
builderRoot.render(React.createElement(QueryBuilder));
