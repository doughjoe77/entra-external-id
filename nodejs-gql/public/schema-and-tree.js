// public/schema-and-tree.js
// multi-root + inline filters + inputFields + conditional visibility + is_null checkboxes
import { QueryBuilder } from "./query-builder.js";

/**
 * Introspection with args + fields + inputFields + deep ofType for Hot Chocolate
 */
const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      types {
        name
        kind

        # For OBJECT types
        fields(includeDeprecated: true) {
          name
          args {
            name
            type {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }

        # For INPUT_OBJECT types (BoolExp, ComparisonExp, OrderBy)
        inputFields {
          name
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function loadSchema() {
  const res = await fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: INTROSPECTION_QUERY })
  });

  const json = await res.json();
  const schema = json.data.__schema;

  const typeMap = {};
  for (const t of schema.types) typeMap[t.name] = t;

  const normalized = {
    rootQuery: schema.queryType.name,
    types: typeMap
  };

  window.__schema = normalized;
  return normalized;
}

/**
 * Render the root Query tree.
 */
export function renderTree(container, schema, onChangeQuery) {
  container.innerHTML = "";

  const rootUl = document.createElement("ul");
  rootUl.className = "schema-tree";

  const queryType = schema.types[schema.rootQuery];

  const queryLi = document.createElement("li");
  queryLi.textContent = "Query";

  const fieldsUl = document.createElement("ul");

  for (const field of queryType.fields) {
    const li = document.createElement("li");
    li.className = "field-node";

    const header = createFieldHeader(field.name);
    const checkbox = header.querySelector(".field-checkbox");

    checkbox.addEventListener("change", () => {
      const returnType = unwrapType(field.type);

      QueryBuilder.toggleRootField(field.name, returnType.name);

      li.innerHTML = "";
      li.appendChild(header);

      if (checkbox.checked) {
        // arguments node
        if (field.args && field.args.length > 0) {
          const argsLi = document.createElement("li");
          argsLi.className = "field-node";

          const argsHeader = document.createElement("div");
          argsHeader.className = "field-header";
          argsHeader.innerHTML = `<span class="field-name">arguments</span>`;
          argsLi.appendChild(argsHeader);

          const argsUl = document.createElement("ul");
          for (const arg of field.args) {
            const argLi = document.createElement("li");
            argLi.className = "field-node";
            renderArgumentNode(
              argLi,
              field.name,
              arg,
              schema,
              onChangeQuery
            );
            argsUl.appendChild(argLi);
          }
          argsLi.appendChild(argsUl);

          const rootArgsUl = document.createElement("ul");
          rootArgsUl.appendChild(argsLi);
          li.appendChild(rootArgsUl);
        }

        // fields under this root
        expandObjectFields(
          li,
          schema,
          [field.name],
          returnType.name,
          onChangeQuery
        );
      }

      const q = QueryBuilder.generateQuery(schema.types);
      onChangeQuery(q);

      header.classList.toggle("selected", checkbox.checked);
    });

    li.appendChild(header);
    fieldsUl.appendChild(li);
  }

  queryLi.appendChild(fieldsUl);
  rootUl.appendChild(queryLi);
  container.appendChild(rootUl);
}

/**
 * Render arguments node (where, order_by, limit, offset)
 */
function renderArgumentNode(containerLi, rootName, arg, schema, onChangeQuery) {
  const argHeader = document.createElement("div");
  argHeader.className = "field-header";
  argHeader.innerHTML = `<span class="field-name">${arg.name}</span>`;
  containerLi.appendChild(argHeader);

  const argType = unwrapType(arg.type);

  if (arg.name === "where") {
    const ul = document.createElement("ul");
    const boolExpType = schema.types[argType.name];
    const fields = boolExpType?.inputFields || [];
    for (const f of fields) {
      const li = document.createElement("li");
      li.className = "field-node";
      renderWhereField(li, rootName, [f.name], f, schema, onChangeQuery);
      ul.appendChild(li);
    }
    containerLi.appendChild(ul);
  } else if (arg.name === "order_by") {
    const ul = document.createElement("ul");
    const orderByType = schema.types[argType.name];
    const fields = orderByType?.inputFields || [];
    for (const f of fields) {
      const li = document.createElement("li");
      li.className = "field-node";
      renderOrderByField(li, rootName, f, schema, onChangeQuery);
      ul.appendChild(li);
    }
    containerLi.appendChild(ul);
  } else if (arg.name === "limit" || arg.name === "offset") {
    const wrapper = document.createElement("div");
    wrapper.className = "arg-row hidden";

    const input = document.createElement("input");
    input.type = "number";
    input.className = "arg-input";

    input.addEventListener("input", () => {
      if (arg.name === "limit") {
        QueryBuilder.setLimit(rootName, input.value);
      } else {
        QueryBuilder.setOffset(rootName, input.value);
      }
      const q = QueryBuilder.generateQuery(schema.types);
      onChangeQuery(q);
    });

    wrapper.appendChild(input);
    containerLi.appendChild(wrapper);

    const toggleBox = document.createElement("input");
    toggleBox.type = "checkbox";
    toggleBox.className = "field-checkbox";

    toggleBox.addEventListener("change", () => {
      wrapper.classList.toggle("hidden", !toggleBox.checked);
    });

    argHeader.prepend(toggleBox);
  }
}

/**
 * WHERE: render a BoolExp field (which may be nested or comparison)
 */
function renderWhereField(containerLi, rootName, fieldPath, field, schema, onChangeQuery) {
  const header = document.createElement("div");
  header.className = "field-header";
  header.innerHTML = `<span class="field-name">${field.name}</span>`;
  containerLi.appendChild(header);

  const toggleBox = document.createElement("input");
  toggleBox.type = "checkbox";
  toggleBox.className = "field-checkbox";
  header.prepend(toggleBox);

  const fieldType = unwrapType(field.type);
  const typeDef = schema.types[fieldType.name];
  const inputFields = typeDef?.inputFields || [];

  if (!typeDef || typeDef.kind !== "INPUT_OBJECT" || inputFields.length === 0) {
    return;
  }

  const isComparison = inputFields.some(f => f.name.startsWith("_"));

  if (isComparison) {
    const opsContainer = document.createElement("ul");
    opsContainer.className = "ops-container hidden";

    for (const opField of inputFields) {
      const li = document.createElement("li");
      li.className = "field-node";

      const row = document.createElement("div");
      row.className = "arg-row";

      const label = document.createElement("span");
      label.className = "operator-name";
      label.textContent = opField.name;

      let input;

      if (opField.name === "_is_null" || opField.name === "_is_not_null") {
        input = document.createElement("input");
        input.type = "checkbox";
        input.className = "operator-checkbox";

        input.addEventListener("change", () => {
          QueryBuilder.setWhere(
            rootName,
            fieldPath,
            opField.name,
            input.checked ? true : null
          );
          const q = QueryBuilder.generateQuery(schema.types);
          onChangeQuery(q);
        });
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.className = "operator-input";

        input.addEventListener("input", () => {
          QueryBuilder.setWhere(
            rootName,
            fieldPath,
            opField.name,
            input.value
          );
          const q = QueryBuilder.generateQuery(schema.types);
          onChangeQuery(q);
        });
      }

      row.appendChild(label);
      row.appendChild(input);
      li.appendChild(row);
      opsContainer.appendChild(li);
    }

    containerLi.appendChild(opsContainer);

    toggleBox.addEventListener("change", () => {
      opsContainer.classList.toggle("hidden", !toggleBox.checked);
    });
  } else {
    const nestedContainer = document.createElement("ul");
    nestedContainer.className = "nested-bool hidden";

    for (const nestedField of inputFields) {
      const li = document.createElement("li");
      li.className = "field-node";
      renderWhereField(
        li,
        rootName,
        [...fieldPath, nestedField.name],
        nestedField,
        schema,
        onChangeQuery
      );
      nestedContainer.appendChild(li);
    }

    containerLi.appendChild(nestedContainer);

    toggleBox.addEventListener("change", () => {
      nestedContainer.classList.toggle("hidden", !toggleBox.checked);
    });
  }
}

/**
 * ORDER BY: render a field with asc/desc radios
 */
function renderOrderByField(containerLi, rootName, field, schema, onChangeQuery) {
  const header = document.createElement("div");
  header.className = "field-header";
  header.innerHTML = `<span class="field-name">${field.name}</span>`;
  containerLi.appendChild(header);

  const toggleBox = document.createElement("input");
  toggleBox.type = "checkbox";
  toggleBox.className = "field-checkbox";
  header.prepend(toggleBox);

  const row = document.createElement("div");
  row.className = "arg-row hidden";

  const asc = document.createElement("input");
  asc.type = "radio";
  asc.name = `order_by_${rootName}_${field.name}`;
  asc.value = "asc";

  const ascLabel = document.createElement("span");
  ascLabel.textContent = "asc";

  const desc = document.createElement("input");
  desc.type = "radio";
  desc.name = `order_by_${rootName}_${field.name}`;
  desc.value = "desc";

  const descLabel = document.createElement("span");
  descLabel.textContent = "desc";

  asc.addEventListener("change", () => {
    if (asc.checked) {
      QueryBuilder.setOrderBy(rootName, field.name, "asc");
      const q = QueryBuilder.generateQuery(schema.types);
      onChangeQuery(q);
    }
  });

  desc.addEventListener("change", () => {
    if (desc.checked) {
      QueryBuilder.setOrderBy(rootName, field.name, "desc");
      const q = QueryBuilder.generateQuery(schema.types);
      onChangeQuery(q);
    }
  });

  row.appendChild(asc);
  row.appendChild(ascLabel);
  row.appendChild(desc);
  row.appendChild(descLabel);

  containerLi.appendChild(row);

  toggleBox.addEventListener("change", () => {
    row.classList.toggle("hidden", !toggleBox.checked);
  });
}

/**
 * Expand object fields and render checkboxes for attributes.
 */
function expandObjectFields(parentLi, schema, path, typeName, onChangeQuery) {
  const typeDef = schema.types[typeName];
  if (!typeDef || !typeDef.fields) return;

  let ul = parentLi.querySelector("ul.fields-ul");
  if (!ul) {
    ul = document.createElement("ul");
    ul.className = "fields-ul";
    parentLi.appendChild(ul);
  }

  ul.innerHTML = "";

  for (const field of typeDef.fields) {
    const li = document.createElement("li");
    li.className = "field-node";

    const header = createFieldHeader(field.name);
    const checkbox = header.querySelector(".field-checkbox");

    checkbox.addEventListener("change", () => {
      QueryBuilder.toggleField(path, field.name);

      const q = QueryBuilder.generateQuery(schema.types);
      onChangeQuery(q);

      header.classList.toggle("selected", checkbox.checked);

      const fieldType = unwrapType(field.type);
      if (fieldType.kind === "OBJECT") {
        const newPath = [...path, field.name];
        expandObjectFields(li, schema, newPath, fieldType.name, onChangeQuery);
      }
    });

    li.appendChild(header);
    ul.appendChild(li);
  }
}

/**
 * Create a field header with checkbox only (no arrows).
 */
function createFieldHeader(name) {
  const header = document.createElement("div");
  header.className = "field-header";

  header.innerHTML = `
    <input type="checkbox" class="field-checkbox" />
    <span class="field-name">${name}</span>
  `;

  return header;
}

/**
 * Unwrap LIST / NON_NULL to base type
 */
function unwrapType(type) {
  while (type && (type.kind === "NON_NULL" || type.kind === "LIST" || type.ofType)) {
    type = type.ofType ?? type;
  }
  return type;
}
