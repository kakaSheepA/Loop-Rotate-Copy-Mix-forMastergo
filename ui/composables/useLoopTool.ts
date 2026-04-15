import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { PluginMessage, UIMessage, type ControlPointKey, sendMsgToPlugin } from '@messages/sender'

const defaultLoopState = {
  iterations: 25,
  offsetX: 5,
  offsetY: 5,
  rotationStep: 5,
  controlPoint: 'center' as ControlPointKey,
  insertAboveSource: true,
  scaleWidthStep: 0,
  scaleHeightStep: 0,
  opacityStart: 100,
  opacityEnd: 0,
  fillStart: '',
  fillEnd: '',
  strokeStart: '',
  strokeEnd: '',
  strokeWidthStart: 1,
  strokeWidthEnd: 1,
}

export const useLoopTool = () => {
  const selectedCount = ref(0)
  const iterations = ref(defaultLoopState.iterations)
  const offsetX = ref(defaultLoopState.offsetX)
  const offsetY = ref(defaultLoopState.offsetY)
  const rotationStep = ref(defaultLoopState.rotationStep)
  const controlPoint = ref<ControlPointKey>(defaultLoopState.controlPoint)
  const insertAboveSource = ref(defaultLoopState.insertAboveSource)
  const scaleWidthStep = ref(defaultLoopState.scaleWidthStep)
  const scaleHeightStep = ref(defaultLoopState.scaleHeightStep)
  const opacityStart = ref(defaultLoopState.opacityStart)
  const opacityEnd = ref(defaultLoopState.opacityEnd)
  const fillStart = ref(defaultLoopState.fillStart)
  const fillEnd = ref(defaultLoopState.fillEnd)
  const strokeStart = ref(defaultLoopState.strokeStart)
  const strokeEnd = ref(defaultLoopState.strokeEnd)
  const strokeWidthStart = ref(defaultLoopState.strokeWidthStart)
  const strokeWidthEnd = ref(defaultLoopState.strokeWidthEnd)
  const isStandalonePreview = typeof window !== 'undefined' && window.parent === window

  const canCreate = computed(() => selectedCount.value >= 1)
  const createButtonLabel = computed(() => (canCreate.value ? '生成循环' : '请选择图层'))

  const syncSelectionStatus = (count: number) => {
    selectedCount.value = count
  }

  const resetDefaults = () => {
    iterations.value = defaultLoopState.iterations
    offsetX.value = defaultLoopState.offsetX
    offsetY.value = defaultLoopState.offsetY
    rotationStep.value = defaultLoopState.rotationStep
    controlPoint.value = defaultLoopState.controlPoint
    insertAboveSource.value = defaultLoopState.insertAboveSource
    scaleWidthStep.value = defaultLoopState.scaleWidthStep
    scaleHeightStep.value = defaultLoopState.scaleHeightStep
    opacityStart.value = defaultLoopState.opacityStart
    opacityEnd.value = defaultLoopState.opacityEnd
    fillStart.value = defaultLoopState.fillStart
    fillEnd.value = defaultLoopState.fillEnd
    strokeStart.value = defaultLoopState.strokeStart
    strokeEnd.value = defaultLoopState.strokeEnd
    strokeWidthStart.value = defaultLoopState.strokeWidthStart
    strokeWidthEnd.value = defaultLoopState.strokeWidthEnd
  }

  const createLoop = () => {
    console.log('[loop-ui] createClick', {
      selectedCount: selectedCount.value,
      iterations: iterations.value,
      offsetX: offsetX.value,
      offsetY: offsetY.value,
      rotationStep: rotationStep.value,
      controlPoint: controlPoint.value,
      insertAboveSource: insertAboveSource.value,
      scaleWidthStep: scaleWidthStep.value,
      scaleHeightStep: scaleHeightStep.value,
      opacityStart: opacityStart.value,
      opacityEnd: opacityEnd.value,
      fillStart: fillStart.value,
      fillEnd: fillEnd.value,
      strokeStart: strokeStart.value,
      strokeEnd: strokeEnd.value,
      strokeWidthStart: strokeWidthStart.value,
      strokeWidthEnd: strokeWidthEnd.value,
      isStandalonePreview,
    })

    if (!canCreate.value) {
      return
    }

    if (isStandalonePreview) {
      return
    }

    sendMsgToPlugin({
      type: UIMessage.CREATE_LOOP,
      data: {
        iterations: iterations.value,
        offsetX: offsetX.value,
        offsetY: offsetY.value,
        rotationStep: rotationStep.value,
        controlPoint: controlPoint.value,
        insertAboveSource: insertAboveSource.value,
        scaleWidthStep: scaleWidthStep.value,
        scaleHeightStep: scaleHeightStep.value,
        opacityStart: opacityStart.value,
        opacityEnd: opacityEnd.value,
        fillStart: fillStart.value,
        fillEnd: fillEnd.value,
        strokeStart: strokeStart.value,
        strokeEnd: strokeEnd.value,
        strokeWidthStart: strokeWidthStart.value,
        strokeWidthEnd: strokeWidthEnd.value,
      },
    })
  }

  const handleMessage = (event: MessageEvent) => {
    const message = event.data as
      | { type?: PluginMessage; data?: string }
      | { type?: PluginMessage.SELECTION_STATE; data?: { selectedCount?: number } }
      | { type?: PluginMessage.LOOP_RESULT; data?: string }
      | { type?: PluginMessage.LOOP_ERROR; data?: string }

    if (!message) {
      return
    }

    if (message.type === PluginMessage.SELECTION_STATE) {
      syncSelectionStatus(message.data?.selectedCount ?? 0)
      return
    }

    if (message.type === PluginMessage.LOOP_RESULT) {
      return
    }

    if (message.type === PluginMessage.LOOP_ERROR) {
      console.warn(message.data ?? '生成失败。')
    }
  }

  onMounted(() => {
    window.addEventListener('message', handleMessage)
    sendMsgToPlugin({
      type: UIMessage.REQUEST_SELECTION_STATE,
    })

    if (isStandalonePreview) {
      syncSelectionStatus(0)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage)
  })

  return {
    selectedCount,
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
  }
}
