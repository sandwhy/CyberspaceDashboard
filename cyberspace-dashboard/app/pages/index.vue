<script setup>
/**
 * Root Index Redirect
 * Moves the user from '/' to '/dashboard' automatically.
 */
definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/dashboard')
    }
  ]
})
</script>

<template>
  <div class="redirect-container"></div>
</template>

<style scoped>
.redirect-container {
  background: var(--color-background);
  min-height: 100vh;
}
</style>