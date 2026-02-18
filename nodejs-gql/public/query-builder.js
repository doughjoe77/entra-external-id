// public/query-builder.js

export const QueryBuilder = {
  state: {
    operation: "query",
    roots: {} // rootName -> { returnType, selection, args }
  },

  // Toggle a root field (authors, books, etc.)
  toggleRootField(rootName, returnType) {
    const roots = this.state.roots;
    if (roots[rootName]) {
      delete roots[rootName];
    } else {
      roots[rootName] = {
        returnType,
        selection: {}, // nested field selection
        args: {
          where: {},      // nested bool exp
          order_by: {},   // field -> "asc" | "desc"
          limit: null,
          offset: null
        }
      };
    }
  },

  // Toggle a selected field under a root
  toggleField(path, fieldName) {
    const rootName = path[0];
    const root = this.state.roots[rootName];
    if (!root) return;

    const selection = root.selection;
    let node = selection;

    for (let i = 1; i < path.length; i++) {
      const key = path[i];
      node[key] = node[key] || {};
      node = node[key];
    }

    if (node[fieldName]) {
      delete node[fieldName];
    } else {
      node[fieldName] = {};
    }
  },

  // WHERE: set comparison value at path + operator
  setWhere(rootName, fieldPath, operator, rawValue) {
    const root = this.state.roots[rootName];
    if (!root) return;

    let where = root.args.where;
    for (const segment of fieldPath) {
      where[segment] = where[segment] || {};
      where = where[segment];
    }

    // null/empty → remove operator
    if (rawValue === "" || rawValue == null) {
      delete where[operator];
      return;
    }

    // IN‑A: comma‑separated for _in/_nin
    if (operator === "_in" || operator === "_nin") {
      where[operator] = rawValue
        .split(",")
        .map(v => v.trim())
        .filter(v => v !== "");
    } else {
      where[operator] = rawValue;
    }
  },

  // ORDER BY: set direction for a field
  setOrderBy(rootName, fieldName, direction) {
    const root = this.state.roots[rootName];
    if (!root) return;

    if (!direction) {
      delete root.args.order_by[fieldName];
    } else {
      root.args.order_by[fieldName] = direction;
    }
  },

  // LIMIT / OFFSET
  setLimit(rootName, value) {
    const root = this.state.roots[rootName];
    if (!root) return;
    const n = value === "" ? null : Number(value);
    root.args.limit = Number.isNaN(n) ? null : n;
  },

  setOffset(rootName, value) {
    const root = this.state.roots[rootName];
    if (!root) return;
    const n = value === "" ? null : Number(value);
    root.args.offset = Number.isNaN(n) ? null : n;
  },

  // Generate full GraphQL query
  generateQuery(types) {
    const op = this.state.operation || "query";
    const roots = this.state.roots;
    const rootNames = Object.keys(roots);
    if (rootNames.length === 0) {
      return `${op} {\n\n}`;
    }

    const rootBlocks = rootNames.map(rootName => {
      const root = roots[rootName];
      const argsStr = this._buildArgsString(root.args);
      const selectionStr = this._buildSelectionString(
        root.selection,
        types[root.returnType],
        types,
        2
      );
      return `  ${rootName}${argsStr} {\n${selectionStr}\n  }`;
    });

    return `${op} {\n${rootBlocks.join("\n\n")}\n}`;
  },

  _buildArgsString(args) {
    const parts = [];

    if (args.where && Object.keys(args.where).length > 0) {
      const whereStr = this._serializeWhere(args.where, 2);
      parts.push(`where: ${whereStr}`);
    }

    if (args.order_by && Object.keys(args.order_by).length > 0) {
      const entries = Object.entries(args.order_by).map(
        ([field, dir]) => `${field}: ${dir}`
      );
      parts.push(`order_by: { ${entries.join(", ")} }`);
    }

    if (typeof args.limit === "number") {
      parts.push(`limit: ${args.limit}`);
    }
    if (typeof args.offset === "number") {
      parts.push(`offset: ${args.offset}`);
    }

    if (parts.length === 0) return "";
    return `(${parts.join(", ")})`;
  },

  _serializeWhere(node, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    const entries = [];

    for (const [key, value] of Object.entries(node)) {
      if (value == null) continue;

      if (Array.isArray(value)) {
        const vals = value
          .map(v => (this._isNumeric(v) ? v : JSON.stringify(v)))
          .join(", ");
        entries.push(`${key}: [${vals}]`);
      } else if (typeof value === "object") {
        const inner = this._serializeWhere(value, indentLevel + 1);
        entries.push(`${key}: ${inner}`);
      } else {
        const val = this._isNumeric(value) ? value : JSON.stringify(value);
        entries.push(`${key}: ${val}`);
      }
    }

    if (entries.length === 0) return "{}";
    if (entries.length === 1 && !entries[0].includes("{")) {
      return `{ ${entries[0]} }`;
    }

    return `{\n${indent}${entries.join(`,\n${indent}`)}\n${"  ".repeat(
      indentLevel - 1
    )}}`;
  },

  _buildSelectionString(selectionNode, typeDef, types, indentLevel) {
    const indent = "  ".repeat(indentLevel);
    const lines = [];

    if (!typeDef || !typeDef.fields) return "";

    for (const field of typeDef.fields) {
      if (!selectionNode[field.name]) continue;

      const fieldType = this._unwrapType(field.type);
      if (fieldType.kind === "OBJECT") {
        const nestedType = types[fieldType.name];
        const nestedSelection = this._buildSelectionString(
          selectionNode[field.name],
          nestedType,
          types,
          indentLevel + 1
        );
        lines.push(
          `${indent}${field.name} {\n${nestedSelection}\n${indent}}`
        );
      } else {
        lines.push(`${indent}${field.name}`);
      }
    }

    return lines.join("\n");
  },

  _unwrapType(type) {
    while (type && (type.kind === "NON_NULL" || type.kind === "LIST" || type.ofType)) {
      type = type.ofType ?? type;
    }
    return type;
  },

  _isNumeric(v) {
    if (typeof v === "number") return true;
    if (typeof v !== "string") return false;
    return v.trim() !== "" && !Number.isNaN(Number(v));
  }
};
