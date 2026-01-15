import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import "./RequireAuth.css";

export default function RequireAuth({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = accounts.length > 0;

  useEffect(() => {
    if (!isAuthenticated && inProgress === "none") {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, inProgress, instance]);

  if (!isAuthenticated) {
    return (
      <div className="redirect-container">
        <img
          src="/redirecting.gif"
          alt="Redirecting..."
          className="redirect-gif"
        />
      </div>
    );
  }

  return children;
}
