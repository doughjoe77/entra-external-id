// src/composables/useMsal.js
import { ref } from "vue";
import { msalInstance } from "../msalInstance";
import { loginRequest, apiRequest } from "../authConfig";

const account = ref(null);
const accessToken = ref(null);

export function useMsal() {
  async function ensureAccount() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      account.value = accounts[0];
    }
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
    acquireApiToken,
    login: () => msalInstance.loginRedirect(loginRequest),
    logout: () => msalInstance.logoutRedirect()
  };
}
