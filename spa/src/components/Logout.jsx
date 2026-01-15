import { useMsal } from "@azure/msal-react";
import "./logout.css";

export default function Logout() {
  const { instance } = useMsal();

  return (
    <div className="logout-container">
      <h1>You have been logged out</h1>
      <p>Your session expired or you were logged out automatically.</p>

        <button
        className="login-button"
        onClick={() => {
            window.location.href = "/";
        }}
        >
        Log back in
        </button>


    </div>
  );
}
