// public/graphiql.js
import { loadSchema, renderTree } from "./schema-and-tree.js";

// -------------------------------------------------------
// MSAL configuration
// -------------------------------------------------------
const msalConfig = {
  auth: {
    clientId: window.appConfig.clientId,
    authority: window.appConfig.authority,
    redirectUri: window.appConfig.redirectUri
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const tokenRequest = {
  scopes: [window.appConfig.apiScope]
};

let accessToken = null;

// -------------------------------------------------------
// Utility: find MSAL access token in sessionStorage
// -------------------------------------------------------
function getMsalAccessTokenFromSession() {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const raw = sessionStorage.getItem(key);

    try {
      const parsed = JSON.parse(raw);
      if (parsed.credentialType === "AccessToken") {
        return parsed.secret;
      }
    } catch {}
  }
  return null;
}

// -------------------------------------------------------
// Auto‑logout timer
// -------------------------------------------------------
let logoutTimer = null;

function startAutoLogout() {
  const minutes = parseInt(window.appConfig.logoutMinutes, 10);
  const ms = minutes * 60 * 1000;

  if (logoutTimer) clearTimeout(logoutTimer);

  logoutTimer = setTimeout(() => {
    msalInstance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + "/public/logout.html"
    });
  }, ms);
}

function enableActivityReset() {
  ["click", "keydown", "mousemove", "scroll"].forEach(evt => {
    document.addEventListener(evt, startAutoLogout);
  });
}

// -------------------------------------------------------
// Logout button
// -------------------------------------------------------
document.getElementById("logoutBtn").onclick = () => {
  const account = msalInstance.getActiveAccount();
  msalInstance.logoutRedirect({
    account,
    postLogoutRedirectUri: window.location.origin + "/public/logout.html"
  });
};

// -------------------------------------------------------
// Patch fetch to inject Authorization header
// -------------------------------------------------------
function startGraphiQLWithAuth() {
  const originalFetch = window.fetch;

  window.fetch = function(url, options = {}) {
    options.headers = options.headers || {};
    options.headers["Authorization"] = "Bearer " + accessToken;
    return originalFetch(url, options);
  };

  initGraphiQL();
}

// -------------------------------------------------------
// Patch WebSocket auth
// -------------------------------------------------------
function startWebSocketAuth() {
  const token = accessToken;

  const originalCreateClient = window.graphqlWs.createClient;

  window.graphqlWs.createClient = function patchedCreateClient(options = {}) {
    const authHeader = "Bearer " + token;

    const patchedOptions = {
      ...options,
      connectionParams: () => ({
        ...(typeof options.connectionParams === "function"
          ? options.connectionParams()
          : options.connectionParams || {}),
        Authorization: authHeader
      })
    };

    return originalCreateClient(patchedOptions);
  };
}

// -------------------------------------------------------
// MSAL redirect handler
// -------------------------------------------------------
msalInstance.handleRedirectPromise().then(async (result) => {

  if (result && result.accessToken) {
    accessToken = result.accessToken;
    window.accessToken = accessToken;
    startAutoLogout();
    enableActivityReset();
    startGraphiQLWithAuth();
    startWebSocketAuth();
    return;
  }

  const accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    msalInstance.loginRedirect(tokenRequest);
    return;
  }

  try {
    const silent = await msalInstance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0]
    });

    accessToken = silent.accessToken;
    window.accessToken = accessToken;
    startAutoLogout();
    enableActivityReset();
    startGraphiQLWithAuth();
    startWebSocketAuth();
  }
  catch (err) {
    msalInstance.loginRedirect(tokenRequest);
  }
});

// -------------------------------------------------------
// GraphiQL initialization
// -------------------------------------------------------
async function initGraphiQL() {
  const builderEl = document.getElementById("builder");
  const graphiqlEl = document.getElementById("graphiql");

  if (!window.accessToken)
    window.accessToken = getMsalAccessTokenFromSession();

  const schema = await loadSchema();
  let currentQuery = "";

  const fetcher = params => {
    const isSubscription = /^\s*subscription\b/.test(params?.query);

    if (isSubscription) {
      return {
        subscribe: sink => {
          const wsClient = window.graphqlWs.createClient({
            url:
              (location.protocol === "https:" ? "wss://" : "ws://") +
              location.host +
              "/graphql",
            lazy: true
          });

          const dispose = wsClient.subscribe(params, {
            next: data => sink.next?.(data),
            error: err => sink.error?.(err),
            complete: () => sink.complete?.()
          });

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
}
