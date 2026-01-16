// // src/authConfig.js

const clientId = process.env.REACT_APP_CLIENT_ID;
//const tenantId = process.env.REACT_APP_TENANT_ID;
const redirectUri = process.env.REACT_APP_REDIRECT_URI;
const apiScope = process.env.REACT_APP_API_SCOPE;
const authority = process.env.REACT_APP_AUTHORITY;

// console.log(clientId);

// // Build authority automatically unless overridden
// const authority =
//   process.env.REACT_APP_AUTHORITY ||
//   `https://login.microsoftonline.com/${tenantId}`;

// export const msalConfig = {
//   auth: {
//     clientId,
//     authority,
//     redirectUri
//   },
//   cache: {
//     cacheLocation: "sessionStorage",
//     storeAuthStateInCookie: false
//   }
// };

// export const loginRequest = {
//   scopes: ["openid", "profile", "email", apiScope]
// };


export const msalConfig = {
  auth: {
    clientId: clientId,
    authority: authority,
    redirectUri: redirectUri,
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "email", apiScope]
};
