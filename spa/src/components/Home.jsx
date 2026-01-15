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
    if (!account) return; // wait until MSAL loads the account

    async function fetchAccessToken() {
      try {
        const result = await instance.acquireTokenSilent({
          ...loginRequest,
          account: account
        });

        //console.log("Access token from MSAL:", result.accessToken);
        setAccessToken(result.accessToken);
      } catch (err) {
        console.error("Failed to acquire access token:", err);
      }
    }

    fetchAccessToken();
  }, [instance, account]);

  // Timer to automatically logout the user after a set amount of time, it's a 
  // rolling time so user activity on the page will reset the timer
  useEffect(() => {
    if (!account) return;

    const minutes = parseInt(process.env.REACT_APP_LOGOUT_MINUTES || "60", 10);
    const timeoutMs = minutes * 60 * 1000;

    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        instance.logoutRedirect({
          postLogoutRedirectUri: "/logout"
        });
      }, timeoutMs);
    };

    // Start the timer immediately
    resetTimer();

    // Activity events that count as “active”
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll"
    ];

    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [account, instance]);



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
