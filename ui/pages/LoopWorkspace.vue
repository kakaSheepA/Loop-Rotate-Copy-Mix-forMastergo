<template>
  <section class="workspace">
    <div class="scale-shell">
      <div class="content">
        <div class="top-row">
          <ControlPointPicker v-model="controlPoint" />
          <ShapeNumberField
            v-model="iterations"
            label="迭代次数"
            :min="2"
            :max="200"
          />
        </div>

        <div class="block">
          <LoopSwitchField
            v-model="insertAboveSource"
            label="生成在上方"
          />
        </div>

        <div class="block">
          <h2>位置</h2>
          <div class="grid grid-3">
            <ShapeNumberField
              v-model="offsetX"
              label="X"
              suffix="px"
            />
            <ShapeNumberField
              v-model="offsetY"
              label="Y"
              suffix="px"
            />
            <ShapeNumberField
              v-model="rotationStep"
              label="旋转"
              suffix="°"
            />
          </div>
        </div>

        <div class="block">
          <h2>缩放 / 透明度</h2>
          <div class="grid grid-4">
            <ShapeNumberField
              v-model="scaleWidthStep"
              label="宽"
              suffix="px"
            />
            <ShapeNumberField
              v-model="scaleHeightStep"
              label="高"
              suffix="px"
            />
            <ShapeNumberField
              v-model="opacityStart"
              label="开始"
              suffix="%"
            />
            <ShapeNumberField
              v-model="opacityEnd"
              label="结束"
              suffix="%"
            />
          </div>
        </div>

        <div class="block">
          <h2>填充</h2>
          <div class="grid">
            <ShapeColorField
              v-model="fillStart"
              label="开始颜色(Hex)"
            />
            <ShapeColorField
              v-model="fillEnd"
              label="结束颜色(Hex)"
            />
          </div>
        </div>

        <div class="block">
          <h2>描边</h2>
          <div class="grid grid-4 stroke-grid">
            <ShapeColorField
              v-model="strokeStart"
              label="开始颜色(Hex)"
            />
            <ShapeColorField
              v-model="strokeEnd"
              label="结束颜色(Hex)"
            />
            <ShapeNumberField
              v-model="strokeWidthStart"
              label="开始粗细"
              suffix="px"
            />
            <ShapeNumberField
              v-model="strokeWidthEnd"
              label="结束粗细"
              suffix="px"
            />
          </div>
        </div>

      </div>
    </div>

    <footer class="footer">
      <LoopFooter
        :label="createButtonLabel"
        :disabled="!canCreate"
        @reset="resetDefaults"
        @create="createLoop"
      />
    </footer>
  </section>
</template>

<script lang="ts" setup>
import ControlPointPicker from '../components/ControlPointPicker.vue'
import LoopFooter from '../components/LoopFooter.vue'
import ShapeColorField from '../components/ShapeColorField.vue'
import ShapeNumberField from '../components/ShapeNumberField.vue'
import LoopSwitchField from '../components/LoopSwitchField.vue'
import { useLoopTool } from '../composables/useLoopTool'

const {
  iterations,
  offsetX,
  offsetY,
  rotationStep,
  controlPoint,
  insertAboveSource,
  scaleWidthStep,
  scaleHeightStep,
  opacityStart,
  opacityEnd,
  fillStart,
  fillEnd,
  strokeStart,
  strokeEnd,
  strokeWidthStart,
  strokeWidthEnd,
  canCreate,
  createButtonLabel,
  resetDefaults,
  createLoop,
} = useLoopTool()
</script>

<style scoped>
.workspace {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  position: relative;
}

.scale-shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  transform: scale(0.86);
  transform-origin: top left;
  width: calc(100% / 0.86);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
}

.top-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: end;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

h2 {
  margin: 0;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  color: #2b313d;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stroke-grid {
  align-items: start;
}

.switch-row {
  display: flex;
  align-items: center;
}

.footer {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 20;
  pointer-events: auto;
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
