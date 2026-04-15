<template>
  <label class="switch">
    <input
      :checked="modelValue"
      type="checkbox"
      @change="handleChange"
    />
    <span class="box" :class="{ active: modelValue }">
      <span class="check" />
    </span>
    <span class="text">{{ label }}</span>
  </label>
</template>

<script lang="ts" setup>
const props = defineProps<{
  label: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<style scoped>
.switch {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  min-height: 28px;
  cursor: pointer;
  user-select: none;
}

.switch input {
  order: 0;
}

.box {
  order: 1;
}

.text {
  order: 2;
  flex: 1 1 auto;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  color: #2b313d;
}

input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.box {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid #cdd3dd;
  background: #ffffff;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease,
    box-shadow 0.12s ease;
  flex: 0 0 auto;
}

.box.active {
  border-color: #3a84ff;
  background: #3a84ff;
  box-shadow: 0 3px 10px rgba(58, 132, 255, 0.16);
}

.check {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.check::before {
  content: '';
  width: 8px;
  height: 4px;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: rotate(-45deg) translateY(-1px);
  opacity: 0;
}

.box.active .check::before {
  opacity: 1;
}
</style>
