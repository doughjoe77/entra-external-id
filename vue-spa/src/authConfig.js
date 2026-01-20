// src/authConfig.js
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: import.meta.env.VITE_AUTHORITY,
    redirectUri: import.meta.env.VITE_REDIRECT_URI,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false
  },
  system: {
    allowRedirectInIframe: true,
    allowRedirectInPopups: true,
    loggerOptions: {
      loggerCallback: () => {},
      logLevel: 3,
      piiLoggingEnabled: false
    }
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"]
};
