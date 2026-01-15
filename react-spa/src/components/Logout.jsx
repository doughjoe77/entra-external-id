//import { useMsal } from "@azure/msal-react";
import "./logout.css";

export default function Logout() {
  //const { instance } = useMsal();

  return (
    <div className="logout-container">
      <h1>You have been logged out</h1>
      <p>Your session expired or you manually logged out, to re-authenticate press the <b>Log back in button.</b></p>

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
