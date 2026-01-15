// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "./msal/msalInstance";
import { BrowserRouter } from "react-router-dom";   // <-- ADD THIS

async function main() {
  await msalInstance.initialize();

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>                     {/* <-- WRAP APP HERE */}
        <App />
      </BrowserRouter>
    </MsalProvider>
  );
}

main();
