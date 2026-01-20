<!-- src/views/Home.vue -->
<template>
  <div>
    <h1>Vue + MSAL.js</h1>

    <button @click="login">Login</button>
    <button @click="logout">Logout</button>

    <div v-if="account">
      <h3>Signed in as: {{ account.username }}</h3>
    </div>
  </div>
</template>

<script setup>
import { useMsal } from "../composables/useMsal";

const { account, login, logout } = useMsal();
</script>
