<template>
  <div class="home-container">
    <header class="app-header">
      <h1 class="header-title">Task Viewer</h1>
      <button class="logout-button" @click="logout">Logout</button>
    </header>

    <main class="main-content">
      <h2>Your Tasks</h2>

      <button @click="loadTasks" class="copy-button">Refresh Tasks</button>

      <div class="claims-container" style="margin-top: 20px">
        <div v-for="task in tasks" :key="task.id" class="claim-row">
          <span class="claim-name">{{ task.title }}</span>
          <span class="claim-value">{{ task.status }}</span>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      © 2026 JG Labs Inc — All Rights Reserved
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useMsal } from "../composables/useMsal";

const tasks = ref([]);
const { acquireApiToken, logout } = useMsal();

async function loadTasks() {
  const token = await acquireApiToken();
  if (!token) return;

  const response = await fetch("http://localhost:5000/tasks", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  tasks.value = await response.json();
}
</script>

<style scoped src="../assets/home.css"></style>
