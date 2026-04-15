import { createBlendNodes } from './blend'
import { buildCopyRotateNodes } from './copyRotateGenerator'
import { tryCreateGuidedPathBlendNodes } from './guidedPathBlend'
import { createLoopNodes } from './loopGenerator'
import { tryCreatePathBlendNodes } from './pathBlend'
import { createGeneratedShape } from './shapeGenerator'
import { PluginMessage, UIMessage, type UIToPluginMessage, sendMsgToUI } from '@messages/sender'

mg.showUI(__html__)

let copyRotatePreviewGroup: { remove?: () => void } | null = null
let copyRotatePreviewRequest: Record<string, any> | null = null
let copyRotatePreviewSelectionSignature = ''
let copyRotateSelectionWatchTimer: ReturnType<typeof setInterval> | null = null

const log = (message: string, payload?: unknown) => {
  console.log(`[blend] ${message}`, payload ?? '')
}

const getCurrentSelection = () => {
  const selection = mg.document.currentPage.selection as Array<{
    parent: { id: string } | null
  } & Record<string, any>>

  return selection
}

const getSelectionSignature = (selection: Array<Record<string, any>>) =>
  selection
    .map((node) =>
      [
        node.id,
        Math.round(node.x ?? 0),
        Math.round(node.y ?? 0),
        Math.round(node.width ?? 0),
        Math.round(node.height ?? 0),
        Math.round(node.rotation ?? 0),
      ].join(':')
    )
    .join('|')

const getSelectedNodes = (minimumCount: number) => {
  const selection = getCurrentSelection()

  if (selection.length < minimumCount) {
    throw new Error(`请先在画布中选中至少 ${minimumCount} 个图层。`)
  }

  if (selection.some((node) => !node.parent)) {
    throw new Error('所选图层必须有父级容器。')
  }

  const parentId = selection[0].parent?.id
  if (selection.some((node) => node.parent?.id !== parentId)) {
    throw new Error('所选图层必须位于同一父级容器中。')
  }

  return selection
}

const sendSelectionState = () => {
  const selection = getCurrentSelection()
  const selectedCount = selection.length
  log('selectionchange', { selectedCount })
  sendMsgToUI({
    type: PluginMessage.SELECTION_STATE,
    data: {
      selectedCount,
    },
  })
}

const sendResult = (message: string) => {
  sendMsgToUI({
    type: PluginMessage.BLEND_RESULT,
    data: message,
  })
}

const clearCopyRotatePreview = () => {
  if (copyRotatePreviewGroup && typeof copyRotatePreviewGroup.remove === 'function') {
    copyRotatePreviewGroup.remove()
  }
  copyRotatePreviewGroup = null
}

const refreshCopyRotatePreview = () => {
  if (!copyRotatePreviewRequest) {
    return
  }

  try {
    const selection = getCurrentSelection()
    if (selection.length < 1) {
      clearCopyRotatePreview()
      copyRotatePreviewSelectionSignature = ''
      return
    }

    if (selection.some((node) => !node.parent)) {
      return
    }

    const nextSignature = getSelectionSignature(selection)
    if (nextSignature === copyRotatePreviewSelectionSignature) {
      return
    }

    clearCopyRotatePreview()
    const result = buildCopyRotateNodes(selection, copyRotatePreviewRequest as any, {
      preview: true,
    })
    copyRotatePreviewGroup = result.previewGroup ?? null
    copyRotatePreviewSelectionSignature = nextSignature
    log('copyRotate.preview.refresh', { label: result.label, createdCount: result.createdCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : '刷新预览失败。'
    log('copyRotate.preview.refresh.error', { message })
  }
}

copyRotateSelectionWatchTimer = setInterval(() => {
  if (!copyRotatePreviewRequest) {
    return
  }

  refreshCopyRotatePreview()
}, 120)

const sendError = (message: string) => {
  sendMsgToUI({
    type: PluginMessage.BLEND_ERROR,
    data: message,
  })
}

mg.on('selectionchange', () => {
  sendSelectionState()
})

sendSelectionState()

mg.ui.onmessage = (msg: UIToPluginMessage) => {
  try {
    log('ui.message', { type: msg.type, data: msg.data })

    if (msg.type === UIMessage.CLOSE_PLUGIN) {
      clearCopyRotatePreview()
      if (copyRotateSelectionWatchTimer) {
        clearInterval(copyRotateSelectionWatchTimer)
        copyRotateSelectionWatchTimer = null
      }
      mg.closePlugin()
      return
    }

    if (msg.type === UIMessage.REQUEST_SELECTION_STATE) {
      sendSelectionState()
      return
    }

    if (msg.type === UIMessage.CLEAR_COPY_ROTATE_PREVIEW) {
      clearCopyRotatePreview()
      copyRotatePreviewRequest = null
      copyRotatePreviewSelectionSignature = ''
      return
    }

    if (msg.type === UIMessage.CREATE_SHAPE) {
      try {
        const result = createGeneratedShape(msg.data as any)
        mg.commitUndo()
        log('shape.result', { label: result.label, createdCount: result.createdCount })
        sendMsgToUI({
          type: PluginMessage.SHAPE_RESULT,
          data: result.label,
        })
        mg.notify(result.label)
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成形状失败。'
        log('shape.error', { message })
        sendMsgToUI({
          type: PluginMessage.SHAPE_ERROR,
          data: message,
        })
        mg.notify(message)
      }
      return
    }

    if (msg.type === UIMessage.CREATE_LOOP) {
      try {
        log('loop.dispatch', { data: msg.data })
        const selection = getSelectedNodes(1)
        log('loop.selection', {
          count: selection.length,
          types: selection.map((node) => node.type),
          parents: selection.map((node) => node.parent?.id ?? null),
        })
        const result = createLoopNodes(selection, msg.data as any)
        mg.commitUndo()
        log('loop.result', { label: result.label, createdCount: result.createdCount })
        sendMsgToUI({
          type: PluginMessage.LOOP_RESULT,
          data: result.label,
        })
        mg.notify(result.label)
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成循环失败。'
        log('loop.error', { message })
        sendMsgToUI({
          type: PluginMessage.LOOP_ERROR,
          data: message,
        })
        mg.notify(message)
      }
      return
    }

    if (msg.type === UIMessage.SYNC_COPY_ROTATE_PREVIEW) {
      try {
        log('copyRotate.preview.dispatch', { data: msg.data })
        const selection = getSelectedNodes(1)
        clearCopyRotatePreview()
        copyRotatePreviewRequest = msg.data as any
        const result = buildCopyRotateNodes(selection, msg.data as any, {
          preview: true,
        })
        copyRotatePreviewGroup = result.previewGroup ?? null
        copyRotatePreviewSelectionSignature = getSelectionSignature(selection)
        log('copyRotate.preview.result', { label: result.label, createdCount: result.createdCount })
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新预览失败。'
        log('copyRotate.preview.error', { message })
        sendMsgToUI({
          type: PluginMessage.COPY_ROTATE_ERROR,
          data: message,
        })
      }
      return
    }

    if (msg.type === UIMessage.APPLY_COPY_ROTATE) {
      try {
        log('copyRotate.apply.dispatch', { data: msg.data })
        const selection = getSelectedNodes(1)
        clearCopyRotatePreview()
        copyRotatePreviewRequest = null
        copyRotatePreviewSelectionSignature = ''
        const result = buildCopyRotateNodes(selection, msg.data as any, {
          preview: false,
        })
        mg.commitUndo()
        log('copyRotate.result', { label: result.label, createdCount: result.createdCount })
        sendMsgToUI({
          type: PluginMessage.COPY_ROTATE_RESULT,
          data: result.label,
        })
        mg.notify(result.label)
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成复制旋转失败。'
        log('copyRotate.error', { message })
        sendMsgToUI({
          type: PluginMessage.COPY_ROTATE_ERROR,
          data: message,
        })
        mg.notify(message)
      }
      return
    }

    if (msg.type !== UIMessage.CREATE_BLEND) {
      return
    }

    const intermediateCount = msg.data?.intermediateCount ?? 5
    const selection = getSelectedNodes(2)
    const guidedResult = tryCreateGuidedPathBlendNodes(selection, intermediateCount)
    log('guidedPathBlend.result', { usedGuidedPathBlend: Boolean(guidedResult) })

    const [startNode, endNode] = selection as [SceneNode, SceneNode]
    const pathResult = guidedResult ?? tryCreatePathBlendNodes(startNode, endNode, intermediateCount)
    log('pathBlend.result', { usedPathBlend: Boolean(pathResult) })
    const result = pathResult ?? createBlendNodes(startNode, endNode, intermediateCount)

    mg.commitUndo()
    log('create.result', { label: result.label, createdCount: result.createdCount })
    sendResult(result.label)
    mg.notify(result.label)
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成混合失败。'
    log('create.error', { message })
    sendError(message)
    mg.notify(message)
  }
}
