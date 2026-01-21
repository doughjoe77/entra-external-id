// src/composables/useMsal.js
import { ref } from "vue";
import { msalInstance } from "../msalInstance";
import { loginRequest } from "../authConfig";

const account = ref(null);
const accessToken = ref(null);

export function useMsal() {
  async function ensureAccount() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      account.value = accounts[0];
    }
  }

  async function acquireToken() {
    await ensureAccount();
    if (!account.value) return null;

    const result = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: account.value
    });

    accessToken.value = result.accessToken;
    return result.accessToken;
  }

  async function acquireApiToken() {
    await ensureAccount();
    if (!account.value) return null;

    const result = await msalInstance.acquireTokenSilent({
      ...apiRequest,
      account: account.value
    });

    return result.accessToken;
  }

  return {
    account,
    accessToken,
    acquireToken,
    acquireApiToken,
    login: () => msalInstance.loginRedirect(loginRequest),
    logout: () => msalInstance.logoutRedirect()
  };

}
