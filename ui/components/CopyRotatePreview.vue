<template>
  <section class="preview">
    <div class="stage">
      <template v-if="selectedCount > 0">
        <svg class="orbit-graphic" :viewBox="`0 0 ${stageSize} ${stageSize}`" aria-hidden="true">
          <circle
            class="orbit-track"
            :cx="orbitCenterX"
            :cy="orbitCenterY"
            :r="orbitRadius"
          />
          <circle
            class="orbit-sweep"
            :cx="orbitCenterX"
            :cy="orbitCenterY"
            :r="orbitRadius"
            :transform="`rotate(${props.startAngle} ${orbitCenterX} ${orbitCenterY})`"
            :stroke-dasharray="orbitSweepDasharray"
          />
          <circle
            class="orbit-handle orbit-handle--start"
            :cx="orbitStartPoint.x"
            :cy="orbitStartPoint.y"
            r="5"
          />
          <circle
            class="orbit-handle orbit-handle--end"
            :cx="orbitEndPoint.x"
            :cy="orbitEndPoint.y"
            r="5"
          />
        </svg>
        <div class="center-guide center-guide--x" :style="orbitGuideStyle" />
        <div class="center-guide center-guide--y" :style="orbitGuideStyle" />
        <div class="center-point" :style="orbitPointStyle" />
        <div class="source" :style="sourceStyle">
          <span class="source-grid" />
          <span
            v-for="marker in anchorMarkers"
            :key="marker.key"
            class="anchor-mark"
            :class="{ 'anchor-mark--active': marker.active }"
            :style="marker.style"
          />
          <span class="anchor" :style="anchorStyle" />
        </div>
        <div
          v-for="item in previewItems"
          :key="item.key"
          class="spoke"
          :style="item.spokeStyle"
        />
        <div
          v-for="item in previewItems"
          :key="`${item.key}-copy`"
          class="copy"
          :class="{
            'copy--active': item.active,
            'copy--radial': radialAlignCopies,
          }"
          :style="item.style"
        >
          <span v-if="item.label" class="copy-badge">{{ item.label }}</span>
        </div>
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
const referenceCopyCount = 8
const stageSize = 240
const sourceCenterX = 72
const sourceCenterY = stageSize / 2
const orbitCenterX = 198
const orbitCenterY = stageSize / 2

const orbitRadius = computed(() =>
  Math.min(stageSize * 0.12, 16 + props.radius * 0.1)
)

const orbitCircumference = computed(() => 2 * Math.PI * orbitRadius.value)

const totalSweepAngle = computed(() =>
  totalCount.value > 1
    ? props.angleStep * (totalCount.value - 1) * (referenceCopyCount / totalCount.value)
    : 0
)

const orbitSweepDasharray = computed(() => {
  const sweep = Math.max(1, Math.abs(totalSweepAngle.value) / 360 * orbitCircumference.value)
  return `${sweep} ${Math.max(1, orbitCircumference.value - sweep)}`
})

const toOrbitPoint = (angle: number) => {
  const radians = (angle * Math.PI) / 180

  return {
    x: orbitCenterX + Math.cos(radians) * orbitRadius.value,
    y: orbitCenterY + Math.sin(radians) * orbitRadius.value,
  }
}

const buildPlacement = (index: number) => {
  const anchor = controlPointMap[props.controlPoint]
  const angleStep = props.angleStep * (referenceCopyCount / totalCount.value)
  const angle = props.startAngle + angleStep * index
  const size = 76
  const rotation = props.radialAlignCopies ? angle : 0
  const radians = (rotation * Math.PI) / 180
  const orbitPoint = toOrbitPoint(angle)
  const nextAnchorX = orbitPoint.x
  const nextAnchorY = orbitPoint.y
  const anchorVecX = (anchor.x - 0.5) * size
  const anchorVecY = (anchor.y - 0.5) * size
  const topLeftVecX = -size / 2
  const topLeftVecY = -size / 2
  const rotatedAnchor = {
    x: anchorVecX * Math.cos(radians) - anchorVecY * Math.sin(radians),
    y: anchorVecX * Math.sin(radians) + anchorVecY * Math.cos(radians),
  }
  const rotatedTopLeft = {
    x: topLeftVecX * Math.cos(radians) - topLeftVecY * Math.sin(radians),
    y: topLeftVecX * Math.sin(radians) + topLeftVecY * Math.cos(radians),
  }
  const centerX = nextAnchorX - rotatedAnchor.x
  const centerY = nextAnchorY - rotatedAnchor.y
  const x = centerX + rotatedTopLeft.x
  const y = centerY + rotatedTopLeft.y

  return { angle, x, y, rotation }
}

const placements = computed(() => Array.from({ length: totalCount.value }, (_, index) => buildPlacement(index)))

const previewItems = computed(() => {
  return placements.value.map((placement, index) => ({
    key: `${index}-${placement.angle}`,
    spokeStyle: createSpokeStyle(placement),
    active: index === 0 || index === placements.value.length - 1,
    label: index === 0 ? '起' : index === placements.value.length - 1 ? '终' : '',
    style: {
      left: `${placement.x}px`,
      top: `${placement.y}px`,
      transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
    },
  }))
})

const createSpokeStyle = (placement: { x: number; y: number }) => {
  const dx = placement.x - orbitCenterX
  const dy = placement.y - orbitCenterY
  const length = Math.max(0, Math.sqrt(dx * dx + dy * dy))
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI

  return {
    width: `${length}px`,
    left: `${orbitCenterX}px`,
    top: `${orbitCenterY}px`,
    transform: `rotate(${angle}deg)`,
  }
}

const sourceStyle = computed(() => {
  const size = 76
  const anchor = controlPointMap[props.controlPoint]
  const left = sourceCenterX - size * anchor.x
  const top = sourceCenterY - size * anchor.y

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}px`,
    top: `${top}px`,
  }
})

const orbitStartPoint = computed(() => toOrbitPoint(props.startAngle))

const orbitEndPoint = computed(() => toOrbitPoint(props.startAngle + totalSweepAngle.value))

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

const orbitPointStyle = {
  left: `${orbitCenterX}px`,
  top: `${orbitCenterY}px`,
}

const orbitGuideStyle = {
  left: `${orbitCenterX}px`,
  top: `${orbitCenterY}px`,
}

const anchorMarkers = computed(() =>
  (Object.keys(controlPointMap) as ControlPointKey[]).map((key) => {
    const anchor = controlPointMap[key]
    const size = 76

    return {
      key,
      active: key === props.controlPoint,
      style: {
        left: `${anchor.x * size}px`,
        top: `${anchor.y * size}px`,
      },
    }
  })
)

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

.orbit-graphic {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.orbit-track {
  fill: none;
  stroke: rgba(123, 133, 255, 0.22);
  stroke-width: 1.5;
  stroke-dasharray: 6 8;
}

.orbit-sweep {
  fill: none;
  stroke: rgba(123, 133, 255, 0.88);
  stroke-width: 4;
  stroke-linecap: round;
  filter: drop-shadow(0 0 6px rgba(123, 133, 255, 0.35));
}

.orbit-handle {
  stroke: rgba(255, 255, 255, 0.88);
  stroke-width: 1;
  filter: drop-shadow(0 0 4px rgba(123, 133, 255, 0.35));
}

.orbit-handle--start {
  fill: #ffffff;
}

.orbit-handle--end {
  fill: #7c5cff;
}

.center-guide {
  position: absolute;
  left: 50%;
  top: 50%;
  background: rgba(123, 133, 255, 0.18);
  transform: translate(-50%, -50%);
}

.center-guide--x {
  width: 34px;
  height: 1px;
}

.center-guide--y {
  width: 1px;
  height: 34px;
}

.center-point {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle at 35% 35%, #f5f7ff 0%, #cad5ff 55%, #94a5ff 100%);
  box-shadow:
    0 0 0 3px rgba(123, 133, 255, 0.22),
    0 0 0 10px rgba(123, 133, 255, 0.08),
    0 0 24px rgba(123, 133, 255, 0.24);
}

.source {
  position: absolute;
  border: 1.5px solid rgba(155, 123, 255, 0.9);
  background:
    linear-gradient(180deg, rgba(155, 123, 255, 0.2) 0%, rgba(155, 123, 255, 0.08) 100%),
    rgba(14, 16, 21, 0.28);
  box-shadow:
    0 0 0 1px rgba(155, 123, 255, 0.22) inset,
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 8px 18px rgba(0, 0, 0, 0.18);
}

.source-grid {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(90deg, transparent 0 31.5%, rgba(123, 133, 255, 0.12) 31.5% 33.5%, transparent 33.5% 66.5%, rgba(123, 133, 255, 0.12) 66.5% 68.5%, transparent 68.5% 100%),
    linear-gradient(180deg, transparent 0 31.5%, rgba(123, 133, 255, 0.12) 31.5% 33.5%, transparent 33.5% 66.5%, rgba(123, 133, 255, 0.12) 66.5% 68.5%, transparent 68.5% 100%);
  opacity: 0.55;
  pointer-events: none;
}

.anchor-mark {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 1px rgba(123, 133, 255, 0.18);
  opacity: 0.6;
}

.anchor-mark--active {
  width: 12px;
  height: 12px;
  opacity: 1;
  background: radial-gradient(circle at 35% 35%, #ffffff 0%, #f2f5ff 35%, #7c5cff 100%);
  box-shadow:
    0 0 0 2px #7c5cff,
    0 0 0 7px rgba(124, 92, 255, 0.14);
}

.anchor {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle at 35% 35%, #ffffff 0%, #f2f5ff 42%, #7c5cff 100%);
  box-shadow:
    0 0 0 2px #7c5cff,
    0 0 0 8px rgba(124, 92, 255, 0.16),
    0 0 18px rgba(124, 92, 255, 0.24);
}

.copy {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1px solid rgba(123, 133, 255, 0.85);
  background: rgba(123, 133, 255, 0.2);
  border-radius: 6px;
  box-shadow:
    0 0 0 1px rgba(123, 133, 255, 0.12) inset,
    0 4px 10px rgba(0, 0, 0, 0.12);
}

.copy--radial {
  width: 44px;
  height: 8px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(124, 92, 255, 0.16) 0%, rgba(123, 133, 255, 0.38) 48%, rgba(255, 255, 255, 0.95) 100%),
    rgba(123, 133, 255, 0.18);
  box-shadow:
    0 0 0 1px rgba(123, 133, 255, 0.12) inset,
    0 4px 10px rgba(0, 0, 0, 0.14),
    0 0 10px rgba(124, 92, 255, 0.16);
}

.copy--active {
  border-color: rgba(255, 212, 92, 0.95);
  background: rgba(255, 212, 92, 0.28);
  box-shadow:
    0 0 0 1px rgba(255, 212, 92, 0.16) inset,
    0 0 0 4px rgba(255, 212, 92, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.16);
}

.copy--radial::before {
  left: calc(100% - 1px);
  top: 50%;
  transform: translate(0, -50%);
  border-left: 10px solid #ffffff;
  border-right: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  filter: drop-shadow(0 0 2px rgba(123, 133, 255, 0.42));
}

.copy--radial::after {
  left: 8px;
  top: 50%;
  width: 24px;
  height: 2px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 0 0 1px rgba(123, 133, 255, 0.1);
}

.copy-badge {
  position: absolute;
  right: -8px;
  bottom: -10px;
  padding: 0 4px;
  min-width: 12px;
  height: 12px;
  border-radius: 999px;
  font-size: 9px;
  line-height: 12px;
  text-align: center;
  color: #ffffff;
  background: rgba(17, 24, 39, 0.78);
  border: 1px solid rgba(123, 133, 255, 0.35);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.spoke {
  position: absolute;
  height: 1px;
  transform-origin: 0 50%;
  background: linear-gradient(
    90deg,
    rgba(123, 133, 255, 0.22) 0%,
    rgba(123, 133, 255, 0.1) 72%,
    rgba(123, 133, 255, 0) 100%
  );
  box-shadow: 0 0 0 1px rgba(123, 133, 255, 0.03);
  opacity: 0.55;
}

.copy::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 1px;
  width: 2px;
  height: 8px;
  border-radius: 999px;
  transform: translateX(-50%);
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(123, 133, 255, 0.14);
}

.copy::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 0;
  height: 0;
  transform: translate(-50%, -1px);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 5px solid #ffffff;
  filter: drop-shadow(0 0 1px rgba(123, 133, 255, 0.32));
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
