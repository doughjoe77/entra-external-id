// src/components/Home.jsx

import { useMsal } from "@azure/msal-react";
import { useState, useEffect } from "react";
import { loginRequest } from "../authConfig";
import "./home.css";

export default function Home() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const [tokenType, setTokenType] = useState("id"); // "id" or "access"
  const [accessToken, setAccessToken] = useState(null);

  // Acquire access token on load
  useEffect(() => {
    async function fetchAccessToken() {
      try {
        const result = await instance.acquireTokenSilent(loginRequest);
        setAccessToken(result.accessToken);
      } catch (err) {
        console.error("Failed to acquire access token:", err);
      }
    }

    fetchAccessToken();
  }, [instance]);

  // Extract claims based on selected token
  const idClaims = account?.idTokenClaims || {};
  const accessClaims = accessToken
    ? parseJwt(accessToken)
    : {};

  const claims = tokenType === "id" ? idClaims : accessClaims;

  return (
    <div className="home-container">
      <h1>Welcome to the protected app</h1>
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
