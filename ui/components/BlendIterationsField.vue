<template>
  <section class="block">
    <h2>中间层数</h2>
    <ShapeNumberField
      label="中间层数"
      :model-value="modelValue"
      :min="1"
      :max="200"
      :step="1"
      hide-label
      @update:modelValue="handleUpdate"
    />
  </section>
</template>

<script lang="ts" setup>
import ShapeNumberField from './ShapeNumberField.vue'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
}>()

const handleUpdate = (value: number) => {
  emit('update:modelValue', Number.isFinite(value) ? value : props.modelValue)
}
</script>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: #2b313d;
}
</style>
