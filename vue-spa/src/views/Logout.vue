<template>
  <div class="logout-container">
    <h1>You have been logged out</h1>

    <p>
      Your session expired or you manually logged out.  
      To re‑authenticate, press the <b>Log back in</b> button.
    </p>

    <button
      class="login-button"
      @click="goHome"
    >
      Log back in
    </button>
  </div>
</template>

<script setup>
function goHome() {
  window.location.href = "/";
}
</script>

<style scoped src="../assets/logout.css"></style>
