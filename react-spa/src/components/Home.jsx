// src/components/Home.jsx

import { useMsal } from "@azure/msal-react";
import { useState, useEffect } from "react";
import { loginRequest } from "../authConfig";
import "./home.css";

export default function Home() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const [tokenType, setTokenType] = useState("id");
  const [accessToken, setAccessToken] = useState(null);
  const [copied, setCopied] = useState(false);

  // Acquire access token on load
  useEffect(() => {
    if (!account) return;

    async function fetchAccessToken() {
      try {
        const result = await instance.acquireTokenSilent({
          ...loginRequest,
          account: account
        });
        setAccessToken(result.accessToken);
      } catch (err) {
        console.error("Failed to acquire access token:", err);
      }
    }

    fetchAccessToken();
  }, [instance, account]);

  // Rolling inactivity logout timer
  useEffect(() => {
    if (!account) return;

    const minutes = parseInt(process.env.REACT_APP_LOGOUT_MINUTES || "60", 10);
    const timeoutMs = minutes * 60 * 1000;

    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        instance.logoutRedirect({
          account: instance.getActiveAccount(),
          postLogoutRedirectUri: "/logout",
          logoutHint: instance.getActiveAccount()?.username
        });
      }, timeoutMs);
    };

    resetTimer();

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [account, instance]);

  // Extract claims
  const idClaims = account?.idTokenClaims || {};
  const accessClaims = accessToken ? parseJwt(accessToken) : {};
  const claims = tokenType === "id" ? idClaims : accessClaims;

  // Current token string
  const currentToken =
    tokenType === "id"
      ? account?.idToken
      : accessToken || "";

  // Copy handler
  const handleCopy = () => {
    navigator.clipboard.writeText(currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="home-container">

      {/* HEADER */}
      <header className="app-header">
        <h1 className="header-title">OpenID Connect Federated with Entra SPA</h1>

        <button
          className="logout-button"
          onClick={() =>
            instance.logoutRedirect({
              account: instance.getActiveAccount(),
              postLogoutRedirectUri: "/logout",
              logoutHint: instance.getActiveAccount()?.username
            })
          }
        >
          Logout
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <p>You are authenticated via Entra External ID.</p>

        <div className="token-selector">
          <label>Select token:</label>
          <select
            value={tokenType}
            onChange={(e) => setTokenType(e.target.value)}
          >
            <option value="id">ID Token</option>
            <option value="access">Access Token</option>
          </select>
        </div>

        {/* NEW: Token display + copy button */}
        <div className="token-display">
          <h2>Current {tokenType === "id" ? "ID Token" : "Access Token"}:</h2>

          <div className="token-box">
            <textarea
              readOnly
              value={currentToken}
              className="token-textarea"
            />

            <button className="copy-button" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <h2>JWT Claims ({tokenType === "id" ? "ID Token" : "Access Token"})</h2>

        <div className="claims-container">
          {Object.entries(claims).map(([key, value]) => (
            <div key={key} className="claim-row">
              <span className="claim-name">{key}</span>
              <span className="claim-value">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        © 2026 JG Labs Inc — All Rights Reserved
      </footer>

    </div>
  );
}

// Helper to decode JWT access token
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return {};
  }
}
