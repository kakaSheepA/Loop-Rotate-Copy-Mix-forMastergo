import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { PluginMessage, UIMessage, sendMsgToPlugin } from '@messages/sender'

export const useBlendTool = () => {
  const intermediateCount = ref(5)
  const selectedCount = ref(0)
  const status = ref('请选择2个图层。')
  const statusType = ref<'idle' | 'success' | 'error'>('idle')
  const isStandalonePreview =
    typeof window !== 'undefined' && window.parent === window
  let previewTimer: number | undefined

  const canCreate = computed(() => selectedCount.value >= 2)
  const createButtonLabel = computed(() => (canCreate.value ? '创建' : '请选择2个图层'))

  const syncSelectionStatus = (count: number) => {
    selectedCount.value = count

    if (count < 2) {
      status.value = '请选择2个图层。'
      statusType.value = 'idle'
      return
    }

    if (statusType.value === 'idle' && status.value === '请选择2个图层。') {
      status.value = `已选中 ${count} 个图层。`
    }
  }

  const createBlend = () => {
    console.log('[blend-ui] createClick', {
      selectedCount: selectedCount.value,
      canCreate: canCreate.value,
      intermediateCount: intermediateCount.value,
      isStandalonePreview,
    })

    if (!canCreate.value) {
      status.value = '请选择2个图层。'
      statusType.value = 'idle'
      return
    }

    status.value = '正在生成混合层...'
    statusType.value = 'idle'

    if (isStandalonePreview) {
      window.clearTimeout(previewTimer)
      previewTimer = window.setTimeout(() => {
        status.value = `浏览器预览：已生成 ${intermediateCount.value} 个混合中间层。`
        statusType.value = 'success'
      }, 350)
      return
    }

    sendMsgToPlugin({
      type: UIMessage.CREATE_BLEND,
      data: {
        intermediateCount: intermediateCount.value,
      },
    })
  }

  const handleMessage = (event: MessageEvent) => {
    const message = event.data as
      | { type?: PluginMessage; data?: string }
      | { type?: PluginMessage.SELECTION_STATE; data?: { selectedCount?: number } }

    if (!message) {
      return
    }

    if (message.type === PluginMessage.SELECTION_STATE) {
      console.log('[blend-ui] selectionState', message.data?.selectedCount ?? 0)
      syncSelectionStatus(message.data?.selectedCount ?? 0)
      return
    }

    if (message.type === PluginMessage.BLEND_RESULT) {
      console.log('[blend-ui] blendResult', message.data ?? '')
      status.value = message.data ?? '已生成混合层。'
      statusType.value = 'success'
      return
    }

    if (message.type === PluginMessage.BLEND_ERROR) {
      console.log('[blend-ui] blendError', message.data ?? '')
      status.value = message.data ?? '生成失败。'
      statusType.value = 'error'
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
    if (previewTimer !== undefined) {
      window.clearTimeout(previewTimer)
    }
  })

  return {
    intermediateCount,
    selectedCount,
    canCreate,
    createButtonLabel,
    status,
    statusType,
    createBlend,
  }
}
