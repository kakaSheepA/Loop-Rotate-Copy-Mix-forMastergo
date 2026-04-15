<template>
  <section class="field">
    <h3 v-if="label">{{ label }}</h3>
    <div class="picker" role="radiogroup" :aria-label="label">
      <button
        v-for="item in points"
        :key="item.key"
        type="button"
        class="point"
        :class="{ active: modelValue === item.key }"
        :aria-pressed="modelValue === item.key"
        :aria-label="item.label"
        @click="emit('update:modelValue', item.key)"
      >
        <span class="dot" />
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { ControlPointKey } from '@messages/sender'

const props = defineProps<{
  label?: string
  modelValue: ControlPointKey
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: ControlPointKey): void
}>()

const points = computed(() => [
  { key: 'topLeft' as const, label: '左上' },
  { key: 'topCenter' as const, label: '上中' },
  { key: 'topRight' as const, label: '右上' },
  { key: 'middleLeft' as const, label: '左中' },
  { key: 'center' as const, label: '中心' },
  { key: 'middleRight' as const, label: '右中' },
  { key: 'bottomLeft' as const, label: '左下' },
  { key: 'bottomCenter' as const, label: '下中' },
  { key: 'bottomRight' as const, label: '右下' },
])
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

h3 {
  margin: 0;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  color: #2b313d;
}

.picker {
  display: grid;
  grid-template-columns: repeat(3, 18px);
  gap: 4px;
  width: fit-content;
  max-width: 100%;
}

.point {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1px solid #d9dde5;
  border-radius: 4px;
  background: #ffffff;
  cursor: pointer;
  padding: 0;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease,
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.point:hover {
  border-color: #9ab9ff;
  box-shadow: 0 4px 10px rgba(58, 132, 255, 0.08);
}

.point:active {
  transform: translateY(1px);
}

.point.active {
  border-color: #3a84ff;
  background: #ecf3ff;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #3a84ff;
}

.point.active .dot {
  background: #1f66e5;
}
</style>
