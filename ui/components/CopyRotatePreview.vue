<template>
  <section class="preview">
    <div class="stage">
      <template v-if="selectedCount > 0">
        <div class="ring" />
        <div class="source" :style="sourceStyle">
          <span class="anchor" :style="anchorStyle" />
        </div>
        <div
          v-for="item in previewItems"
          :key="item.key"
          class="copy"
          :style="item.style"
        />
      </template>
      <div v-else class="empty">
        <p>请选择一个图层</p>
        <span>预览会自动出现在画布中</span>
      </div>
    </div>
    <p class="hint">
      {{ hint }}
    </p>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { ControlPointKey } from '@messages/sender'

const props = defineProps<{
  selectedCount: number
  copies: number
  radius: number
  angleStep: number
  startAngle: number
  controlPoint: ControlPointKey
  radialAlignCopies: boolean
}>()

const controlPointMap: Record<ControlPointKey, { x: number; y: number }> = {
  topLeft: { x: 0, y: 0 },
  topCenter: { x: 0.5, y: 0 },
  topRight: { x: 1, y: 0 },
  middleLeft: { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  middleRight: { x: 1, y: 0.5 },
  bottomLeft: { x: 0, y: 1 },
  bottomCenter: { x: 0.5, y: 1 },
  bottomRight: { x: 1, y: 1 },
}

const totalCount = computed(() => Math.max(1, Math.floor(props.copies)))

const buildPlacement = (index: number) => {
  const anchor = controlPointMap[props.controlPoint]
  const stageSize = 240
  const orbitRadius = Math.min(stageSize * 0.34, 24 + props.radius * 0.28)
  const orbitCenterX = stageSize / 2
  const orbitCenterY = stageSize / 2
  const angle = props.startAngle + props.angleStep * index
  const radians = (angle * Math.PI) / 180
  const x = orbitCenterX + Math.cos(radians) * orbitRadius
  const y = orbitCenterY + Math.sin(radians) * orbitRadius
  const rotation = props.radialAlignCopies ? angle : 0

  return { angle, x, y, rotation }
}

const placements = computed(() => Array.from({ length: totalCount.value }, (_, index) => buildPlacement(index)))

const previewItems = computed(() => {
  return placements.value.map((placement, index) => ({
    key: `${index}-${placement.angle}`,
    style: {
      left: `${placement.x}px`,
      top: `${placement.y}px`,
      transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
    },
  }))
})

const sourceStyle = computed(() => {
  const size = 76
  const anchor = controlPointMap[props.controlPoint]
  const placement = placements.value[0]
  const left = (placement?.x ?? 120) - size * anchor.x
  const top = (placement?.y ?? 120) - size * anchor.y

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}px`,
    top: `${top}px`,
  }
})

const anchorStyle = computed(() => {
  const anchor = controlPointMap[props.controlPoint]
  const size = 76
  const x = anchor.x * size
  const y = anchor.y * size

  return {
    left: `${x}px`,
    top: `${y}px`,
  }
})

const hint = computed(() => {
  if (props.selectedCount < 1) {
    return '请选择一个图层后自动生成预览。'
  }

  return `已选中 ${props.selectedCount} 个图层，预览会同步到画布。`
})
</script>

<style scoped>
.preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stage {
  position: relative;
  height: 240px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.04) 0, rgba(255, 255, 255, 0.02) 18%, transparent 18.5%),
    linear-gradient(180deg, #1a1d24 0%, #0f1116 100%);
  overflow: hidden;
  border: 1px solid #2a2f3a;
}

.ring {
  position: absolute;
  inset: 18px;
  border-radius: 999px;
  border: 1px solid rgba(99, 117, 145, 0.35);
}

.source {
  position: absolute;
  border: 1px solid #9b7bff;
  background: rgba(150, 132, 255, 0.12);
  box-shadow: 0 0 0 1px rgba(155, 123, 255, 0.2) inset;
}

.anchor {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background: #7c5cff;
  box-shadow: 0 0 0 2px rgba(124, 92, 255, 0.18);
}

.copy {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1px solid rgba(123, 133, 255, 0.8);
  background: rgba(123, 133, 255, 0.18);
  border-radius: 5px;
  box-shadow: 0 0 0 1px rgba(123, 133, 255, 0.1) inset;
}

.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #6b7280;
}

.empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.78);
  text-align: center;
}

.empty p {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.empty span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
</style>
