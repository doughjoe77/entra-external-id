// src/msalInstance.js
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

if (!window.__MSAL_INSTANCE__) {
  window.__MSAL_INSTANCE__ = new PublicClientApplication(msalConfig);
}

export const msalInstance = window.__MSAL_INSTANCE__;
