<template>
  <nav class="tabs" aria-label="工具切换">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab"
      :class="{ active: tab.key === modelValue }"
      type="button"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script lang="ts" setup>
import type { ToolTabKey, ToolTab } from '../composables/useToolTabs'

defineProps<{
  tabs: ToolTab[]
  modelValue: ToolTabKey
}>()

defineEmits<{
  (event: 'update:modelValue', value: ToolTabKey): void
}>()
</script>

<style scoped>
.tabs {
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  border-radius: 14px;
  background: #eef0f4;
  border: 1px solid #e5e7eb;
}

.tab {
  height: 32px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  color: #59606c;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition:
    background-color 0.12s ease,
    color 0.12s ease,
    transform 0.12s ease;
}

.tab:hover {
  color: #1f2937;
}

.tab.active {
  background: #ffffff;
  color: #1f2937;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 1px 3px rgba(15, 23, 42, 0.08);
}

.tab:active {
  transform: translateY(1px);
}
</style>
