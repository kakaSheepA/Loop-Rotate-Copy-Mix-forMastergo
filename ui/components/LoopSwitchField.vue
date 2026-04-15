<template>
  <label class="switch">
    <input
      :checked="modelValue"
      type="checkbox"
      @change="handleChange"
    >
    <span class="box" :class="{ active: modelValue }">
      <span class="check" />
    </span>
    <span class="text">{{ label }}</span>
  </label>
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', Boolean(target?.checked))
}
</script>

<style scoped>
.switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  width: 100%;
}

input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.box {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid #b9c2d3;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.box.active {
  background: #3b82f6;
  border-color: #3b82f6;
}

.check {
  width: 7px;
  height: 4px;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: rotate(-45deg) translate(-0.5px, -0.5px);
  opacity: 0;
}

.box.active .check {
  opacity: 1;
}

.text {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}
</style>
