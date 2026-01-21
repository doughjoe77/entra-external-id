<template>
  <div class="home-container">
    <header class="app-header">
      <h1 class="header-title">Vue SPA - Task Viewer</h1>
      <button class="logout-button" @click="logoutUser">Logout</button>
    </header>

    <main class="main-content">
      <h2>Your Tasks</h2>

      <!-- Error Banner -->
      <div v-if="errorMessage" class="error-banner">
        <span>{{ errorMessage }}</span>
        <button class="retry-button" @click="loadTasks">Retry</button>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="spinner-container">
        <div class="spinner"></div>
        <p>Loading tasks...</p>
      </div>

      <!-- Refresh Button -->
      <button @click="loadTasks" class="copy-button" :disabled="isLoading">
        Refresh Tasks
      </button>

      <!-- Task List -->
      <div class="claims-container" style="margin-top: 20px" v-if="!isLoading && !errorMessage">
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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useMsal } from "../composables/useMsal";
import { useRouter } from "vue-router";

const tasks = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

const { acquireApiToken } = useMsal();
const router = useRouter();

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ------------------------------
// Rolling inactivity logout
// ------------------------------
let inactivityTimer = null;

function startInactivityTimer() {
  const minutes = parseInt(import.meta.env.VITE_LOGOUT_MINUTES || "60", 10);
  const timeoutMs = minutes * 60 * 1000;

  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    logoutUser();
  }, timeoutMs);
}

function resetInactivityTimer() {
  startInactivityTimer();
}

async function logoutUser() {
  const { msalInstance } = await import("../msalInstance");

  const account =
    msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];

  await msalInstance.logoutRedirect({
    account,
    postLogoutRedirectUri: "/logout"
  });
}

// ------------------------------
// Load tasks
// ------------------------------
async function loadTasks() {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const token = await acquireApiToken();
    if (!token) {
      throw new Error("Unable to acquire access token.");
    }

    const response = await fetch(`${API_BASE}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    tasks.value = data.tasks || data;
  } catch (err) {
    errorMessage.value = "Failed to load tasks. Please try again.";
    console.error("Task load error:", err);
  } finally {
    isLoading.value = false;
  }
}

// ------------------------------
// Lifecycle
// ------------------------------
onMounted(() => {
  loadTasks();
  startInactivityTimer();

  const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
  events.forEach((evt) =>
    window.addEventListener(evt, resetInactivityTimer)
  );
});

onBeforeUnmount(() => {
  clearTimeout(inactivityTimer);

  const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
  events.forEach((evt) =>
    window.removeEventListener(evt, resetInactivityTimer)
  );
});
</script>

<style scoped src="../assets/home.css"></style>

<style scoped>
.error-banner {
  background-color: #ffdddd;
  color: #a30000;
  border: 1px solid #ffb3b3;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.retry-button {
  background-color: #a30000;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #7a0000;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}

.spinner {
  border: 4px solid #e0e0e0;
  border-top: 4px solid #0078d4;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
