<template>
  <section class="field">
    <h3>{{ label }}</h3>
    <label class="control">
      <input
        class="picker"
        :value="nativeColor"
        type="color"
        :aria-label="`${label} 颜色选择器`"
        @input="handlePickerInput"
      >
      <span v-if="displayValue" class="value">{{ displayValue }}</span>
    </label>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  label: string
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const normalizeColor = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const hex = trimmed.slice(1)
    return `#${hex
      .split('')
      .map((char) => char + char)
      .join('')
      .toLowerCase()}`
  }

  return ''
}

const nativeColor = computed(() => normalizeColor(props.modelValue) || '#ffffff')
const displayValue = computed(() => normalizeColor(props.modelValue).toUpperCase())

const handlePickerInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value.toUpperCase())
}
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 700;
  color: #2b313d;
}

.control {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 2px;
  border-bottom: 1px solid #d9dde5;
  background: #ffffff;
  cursor: pointer;
}

.picker {
  width: 12px;
  height: 12px;
  padding: 0;
  border: 1px solid #d1d5db;
  background: #ffffff;
  cursor: pointer;
  flex: 0 0 auto;
  border-radius: 50%;
  overflow: hidden;
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  display: block;
}

.picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.picker::-webkit-color-swatch {
  border: 0;
  border-radius: 50%;
}

.picker::-moz-color-swatch {
  border: 0;
  border-radius: 50%;
}

.value {
  width: 100%;
  min-width: 0;
  font-size: 16px;
  color: #1f2937;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
