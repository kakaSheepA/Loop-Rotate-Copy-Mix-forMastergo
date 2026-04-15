import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  PluginMessage,
  UIMessage,
  type ControlPointKey,
  sendMsgToPlugin,
} from '@messages/sender'

export const useCopyRotateTool = () => {
  const selectedCount = ref(0)
  const copies = ref(8)
  const radius = ref(72)
  const angleStep = ref(45)
  const startAngle = ref(0)
  const controlPoint = ref<ControlPointKey>('center')
  const previewEnabled = ref(true)
  const radialAlignCopies = ref(true)
  const isStandalonePreview = typeof window !== 'undefined' && window.parent === window
  let previewTimer: number | undefined

  const canApply = computed(() => selectedCount.value >= 1)
  const actionLabel = computed(() => (canApply.value ? '应用' : '请选择图层'))

  const buildRequest = () => ({
    copies: copies.value,
    radius: radius.value,
    angleStep: angleStep.value,
    startAngle: startAngle.value,
    controlPoint: controlPoint.value,
    radialAlignCopies: radialAlignCopies.value,
  })

  const syncSelectionStatus = (count: number) => {
    selectedCount.value = count
  }

  const syncPreview = () => {
    if (isStandalonePreview) {
      return
    }

    if (!previewEnabled.value) {
      sendMsgToPlugin({
        type: UIMessage.CLEAR_COPY_ROTATE_PREVIEW,
      })
      return
    }

    if (!canApply.value) {
      sendMsgToPlugin({
        type: UIMessage.CLEAR_COPY_ROTATE_PREVIEW,
      })
      return
    }

    sendMsgToPlugin({
      type: UIMessage.SYNC_COPY_ROTATE_PREVIEW,
      data: buildRequest(),
    })
  }

  const createCopyRotate = () => {
    console.log('[copy-rotate-ui] createClick', {
      selectedCount: selectedCount.value,
      copies: copies.value,
      radius: radius.value,
      angleStep: angleStep.value,
      startAngle: startAngle.value,
      controlPoint: controlPoint.value,
      previewEnabled: previewEnabled.value,
      radialAlignCopies: radialAlignCopies.value,
      isStandalonePreview,
    })

    if (!canApply.value) {
      return
    }

    if (isStandalonePreview) {
      return
    }

    sendMsgToPlugin({
      type: UIMessage.APPLY_COPY_ROTATE,
      data: buildRequest(),
    })
  }

  const closeCopyRotate = () => {
    sendMsgToPlugin({
      type: UIMessage.CLOSE_PLUGIN,
    })
  }

  const handleMessage = (event: MessageEvent) => {
    const message = event.data as
      | { type?: PluginMessage; data?: string }
      | { type?: PluginMessage.SELECTION_STATE; data?: { selectedCount?: number } }
      | { type?: PluginMessage.COPY_ROTATE_RESULT; data?: string }
      | { type?: PluginMessage.COPY_ROTATE_ERROR; data?: string }

    if (!message) {
      return
    }

    if (message.type === PluginMessage.SELECTION_STATE) {
      syncSelectionStatus(message.data?.selectedCount ?? 0)
      return
    }
  }

  const schedulePreview = () => {
    if (previewTimer !== undefined) {
      window.clearTimeout(previewTimer)
    }

    previewTimer = window.setTimeout(() => {
      syncPreview()
    }, 80)
  }

  watch([selectedCount, copies, radius, angleStep, startAngle, radialAlignCopies], schedulePreview)

  watch(previewEnabled, () => {
    if (previewTimer !== undefined) {
      window.clearTimeout(previewTimer)
    }

    if (previewEnabled.value) {
      syncPreview()
      return
    }

    sendMsgToPlugin({
      type: UIMessage.CLEAR_COPY_ROTATE_PREVIEW,
    })
  })

  watch(controlPoint, () => {
    if (previewTimer !== undefined) {
      window.clearTimeout(previewTimer)
    }

    syncPreview()
  })

  onMounted(() => {
    window.addEventListener('message', handleMessage)
    sendMsgToPlugin({
      type: UIMessage.REQUEST_SELECTION_STATE,
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleMessage)
    if (!isStandalonePreview) {
      sendMsgToPlugin({
        type: UIMessage.CLEAR_COPY_ROTATE_PREVIEW,
      })
    }
  })

  return {
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
    closeCopyRotate,
  }
}
