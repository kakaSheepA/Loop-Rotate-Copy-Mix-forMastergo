<template>
  <section class="field">
    <h3 v-if="!hideLabel">{{ label }}</h3>
    <label
      ref="controlRef"
      class="control"
      :class="{ dragging: isDragging }"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @pointerleave="handlePointerLeave"
    >
      <span v-if="prefix" class="meta">{{ prefix }}</span>
      <input
        ref="inputRef"
        :value="modelValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="label"
        :inputmode="step && step < 1 ? 'decimal' : 'numeric'"
        @input="handleInput"
      />
      <span v-if="suffix" class="meta">{{ suffix }}</span>
    </label>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const props = defineProps<{
  label: string
  modelValue: number
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  hideLabel?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const controlRef = ref<HTMLLabelElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const pointerId = ref<number | null>(null)
const dragStartX = ref(0)
const dragStartValue = ref(0)
const dragThreshold = 3

const dragStep = computed(() => Math.max(1, props.step ?? 1))

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  emit('update:modelValue', Number.isFinite(value) ? value : props.modelValue)
}

const clampValue = (value: number) => {
  let nextValue = value

  if (typeof props.min === 'number') {
    nextValue = Math.max(props.min, nextValue)
  }

  if (typeof props.max === 'number') {
    nextValue = Math.min(props.max, nextValue)
  }

  return nextValue
}

const updateValue = (deltaX: number, event: PointerEvent) => {
  const modifier = event.shiftKey ? 10 : event.altKey ? 0.1 : 1
  const nextValue = dragStartValue.value + deltaX * dragStep.value * modifier
  emit('update:modelValue', Math.round(clampValue(nextValue)))
}

const releasePointer = (event: PointerEvent) => {
  if (pointerId.value === null) {
    return
  }

  const control = controlRef.value
  try {
    control?.releasePointerCapture(pointerId.value)
  } catch {
    // Ignore capture release errors when the pointer is already gone.
  }

  pointerId.value = null
  isDragging.value = false
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.button !== 0) {
    return
  }

  pointerId.value = event.pointerId
  dragStartX.value = event.clientX
  dragStartValue.value = props.modelValue
  isDragging.value = false

  const control = controlRef.value
  control?.setPointerCapture(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  if (pointerId.value === null || pointerId.value !== event.pointerId) {
    return
  }

  const deltaX = event.clientX - dragStartX.value
  if (!isDragging.value && Math.abs(deltaX) < dragThreshold) {
    return
  }

  isDragging.value = true
  event.preventDefault()
  updateValue(deltaX, event)
}

const handlePointerUp = (event: PointerEvent) => {
  if (pointerId.value === null || pointerId.value !== event.pointerId) {
    return
  }

  releasePointer(event)
}

const handlePointerLeave = (event: PointerEvent) => {
  if (pointerId.value === null || pointerId.value !== event.pointerId) {
    return
  }

  releasePointer(event)
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
  cursor: ew-resize;
  user-select: none;
}

.control.dragging {
  cursor: ew-resize;
}

.meta {
  color: #8b93a3;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  user-select: none;
}

input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 18px;
  color: #1f2937;
  padding: 10px 0;
  min-width: 0;
  font-weight: 500;
  cursor: ew-resize;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
