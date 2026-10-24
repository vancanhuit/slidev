<script setup lang="ts">
import { slideWidth } from '@slidev/client/env.ts'
import PrintContainer from '@slidev/client/internals/PrintContainer.vue'
</script>

<template>
  <main id="page-root" class="reading-view">
    <nav class="reading-nav" aria-label="Reading view">
      <span>mise · Reading view</span>
      <RouterLink to="/1">Back to slides</RouterLink>
    </nav>
    <PrintContainer :width="slideWidth" />
  </main>
</template>
