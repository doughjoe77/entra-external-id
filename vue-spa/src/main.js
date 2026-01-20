// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import { msalInstance } from "./msalInstance";

async function bootstrap() {
  console.log("Before initialize");
  await msalInstance.initialize();
  console.log("After initialize, before handleRedirectPromise");

  const result = await msalInstance.handleRedirectPromise();

  console.log("After handleRedirectPromise");

  if (result && result.account) {
    msalInstance.setActiveAccount(result.account);
  }

  const router = (await import("./router")).default;

  const app = createApp(App);
  app.use(router);
  app.mount("#app");
}

bootstrap();
