<template>
  <div v-if="loading" class="global-loader" :class="{ 'fade-out': !showContent }">
    <div class="loader-content">
      <img src="/logo/Cyberspace.png" alt="Cyberspace" class="loader-logo" />
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
const loading = ref(true)
const showContent = ref(true)

onMounted(() => {
  setTimeout(() => {
    showContent.value = false
    setTimeout(() => {
      loading.value = false
    }, 500)
  }, 1000) 
})
</script>

<style scoped>
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* CHANGED: Match grey-darken-4 theme */
  background: #121212; 
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.5s ease-in-out;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loader-logo {
  height: 80px; /* Slightly larger for impact */
  width: auto;
  animation: pulse 2s infinite ease-in-out;
}

.spinner {
  width: 48px;
  height: 48px;
  /* CHANGED: Increased opacity for the background track on dark surface */
  border: 4px solid rgba(255, 215, 53, 0.05);
  border-left-color: #ffd735; /* Cyberspace Yellow remains identical */
  border-radius: 50%;
  animation: spin 0.8s linear infinite; /* Slightly faster spin */
}

.fade-out {
  opacity: 0;
  pointer-events: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}
</style>