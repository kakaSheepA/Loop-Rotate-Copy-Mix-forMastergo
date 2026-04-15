<template>
  <footer class="footer">
    <button
      class="button button-reset"
      type="button"
      @click="$emit('reset')"
    >
      恢复默认
    </button>
    <button
      class="button"
      :class="disabled ? 'button-disabled' : 'button-primary'"
      :disabled="disabled"
      @click="$emit('create')"
    >
      {{ label }}
    </button>
  </footer>
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  disabled: boolean
}>()

defineEmits<{
  (event: 'create'): void
  (event: 'reset'): void
}>()
</script>

<style scoped>
.footer {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 8px;
  align-items: center;
}

.button {
  height: 28px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;
}

.button:active {
  transform: translateY(1px);
}

.button-reset {
  background: #ffffff;
  border: 1px solid #d7dbe3;
  color: #2f3645;
  width: 76px;
}

.button-primary {
  background: linear-gradient(180deg, #35a4ff 0%, #2288f4 100%);
  border: 0;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(34, 136, 244, 0.22);
}

.button-primary:hover {
  box-shadow: 0 10px 22px rgba(34, 136, 244, 0.28);
}

.button-disabled {
  background: #eef0f4;
  border: 1px solid #d7dbe3;
  color: #9ca3af;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
