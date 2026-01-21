// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Logout from "../views/Logout.vue";

import { msalInstance } from "../msalInstance";
import { loginRequest } from "../authConfig";

console.log("Router loaded");

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: "/logout",
      name: "Logout",
      component: Logout
    }
  ]
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;

  const accounts = msalInstance.getAllAccounts();

  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
    return true;
  }

  await msalInstance.loginRedirect(loginRequest);
  return false;
});

export default router;
