<template>
  <p class="status" :class="statusType">
    {{ status }}
  </p>
</template>

<script lang="ts" setup>
defineProps<{
  status: string
  statusType: 'idle' | 'success' | 'error'
}>()
</script>

<style scoped>
.status {
  margin: 0;
  min-height: 18px;
  font-size: 13px;
  line-height: 1.4;
  color: #6b7280;
}

.status.success {
  color: #15803d;
}

.status.error {
  color: #b91c1c;
}
</style>
