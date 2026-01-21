// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import { msalInstance } from "./msalInstance";
import { loginRequest } from "./authConfig";

async function bootstrap() {
  console.log("Before initialize");
  await msalInstance.initialize();
  console.log("After initialize, before handleRedirectPromise");

  const result = await msalInstance.handleRedirectPromise();
  console.log("After handleRedirectPromise");

  if (result && result.account) {
    msalInstance.setActiveAccount(result.account);
  }

  // 🔥 NEW: Do NOT auto-login if user is on /logout
  if (window.location.pathname !== "/logout") {
    const accounts = msalInstance.getAllAccounts();

    if (accounts.length === 0) {
      console.log("No account found → auto-login");
      await msalInstance.loginRedirect(loginRequest);
      return;
    }

    msalInstance.setActiveAccount(accounts[0]);
  }

  const router = (await import("./router")).default;

  const app = createApp(App);
  app.use(router);
  app.mount("#app");
}

bootstrap();
