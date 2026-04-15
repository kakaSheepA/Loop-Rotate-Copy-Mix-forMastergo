<template>
  <section class="workspace">
    <div class="preview-shell">
      <CopyRotatePreview
        :selected-count="selectedCount"
        :copies="copies"
        :radius="radius"
        :angle-step="angleStep"
        :start-angle="startAngle"
        :control-point="controlPoint"
        :radial-align-copies="radialAlignCopies"
      />
    </div>

    <div class="top-row">
      <ControlPointPicker v-model="controlPoint" />
      <div class="switches-top">
        <CopyRotateSwitchField
          v-model="previewEnabled"
          label="画布预览"
        />

        <CopyRotateSwitchField
          v-model="radialAlignCopies"
          label="径向对齐副本"
        />
      </div>
    </div>

    <div class="grid grid-4 full-row">
      <ShapeNumberField
        v-model="copies"
        label="总数量"
        :min="1"
        :max="200"
      />
      <ShapeNumberField
        v-model="radius"
        label="半径"
        suffix="px"
      />
      <ShapeNumberField
        v-model="angleStep"
        label="旋转步长"
        suffix="°"
      />
      <ShapeNumberField
        v-model="startAngle"
        label="起始角度"
        suffix="°"
      />
    </div>

    <footer class="footer-fixed">
      <BlendFooter
        :label="actionLabel"
        :disabled="!canApply"
        @create="createCopyRotate"
      />
    </footer>
  </section>
</template>

<script lang="ts" setup>
import BlendFooter from '../components/BlendFooter.vue'
import ControlPointPicker from '../components/ControlPointPicker.vue'
import CopyRotatePreview from '../components/CopyRotatePreview.vue'
import CopyRotateSwitchField from '../components/CopyRotateSwitchField.vue'
import ShapeNumberField from '../components/ShapeNumberField.vue'
import { useCopyRotateTool } from '../composables/useCopyRotateTool'

const {
  selectedCount,
  copies,
  radius,
  angleStep,
  startAngle,
  controlPoint,
  previewEnabled,
  radialAlignCopies,
  canApply,
  actionLabel,
  createCopyRotate,
} = useCopyRotateTool()
</script>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100%;
  padding-bottom: 56px;
}

.preview-shell {
  border-radius: 18px;
  padding: 10px;
  background: linear-gradient(180deg, #0f1116 0%, #0b0d12 100%);
  border: 1px solid #2a2f3a;
}

.top-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.switches-top {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0;
  min-width: 0;
  padding-top: 2px;
}

.grid {
  display: grid;
  gap: 10px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.full-row {
  width: 100%;
}

.footer-fixed {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 5;
}

:deep(.field) {
  gap: 4px;
}

:deep(.field h3) {
  font-size: 12px;
}

:deep(.control) {
  min-height: 28px;
  gap: 6px;
}

:deep(.meta) {
  font-size: 11px;
}

:deep(.control input) {
  font-size: 12px;
  padding: 4px 0;
}

:deep(.swatch) {
  width: 12px;
  height: 12px;
}
</style>
