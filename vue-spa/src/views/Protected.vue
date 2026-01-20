<!-- src/views/Protected.vue -->
<template>
  <div>
    <h1>Protected Page</h1>

    <button @click="loadTasks">Load Tasks</button>

    <pre>{{ tasks }}</pre>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useMsal } from "../composables/useMsal";

const tasks = ref(null);
const { acquireToken } = useMsal();

async function loadTasks() {
  const token = await acquireToken();

  const res = await fetch("http://localhost:4000/tasks", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  tasks.value = await res.json();
}
</script>
