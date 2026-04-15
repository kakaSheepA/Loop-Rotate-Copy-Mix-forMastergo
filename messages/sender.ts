export enum PluginMessage {
  BLEND_RESULT = 'BLEND_RESULT',
  BLEND_ERROR = 'BLEND_ERROR',
  SELECTION_STATE = 'SELECTION_STATE',
  SHAPE_RESULT = 'SHAPE_RESULT',
  SHAPE_ERROR = 'SHAPE_ERROR',
  LOOP_RESULT = 'LOOP_RESULT',
  LOOP_ERROR = 'LOOP_ERROR',
  COPY_ROTATE_RESULT = 'COPY_ROTATE_RESULT',
  COPY_ROTATE_ERROR = 'COPY_ROTATE_ERROR',
}

export enum UIMessage {
  CREATE_BLEND = 'CREATE_BLEND',
  CLOSE_PLUGIN = 'CLOSE_PLUGIN',
  CREATE_SHAPE = 'CREATE_SHAPE',
  CREATE_LOOP = 'CREATE_LOOP',
  REQUEST_SELECTION_STATE = 'REQUEST_SELECTION_STATE',
  SYNC_COPY_ROTATE_PREVIEW = 'SYNC_COPY_ROTATE_PREVIEW',
  CLEAR_COPY_ROTATE_PREVIEW = 'CLEAR_COPY_ROTATE_PREVIEW',
  APPLY_COPY_ROTATE = 'APPLY_COPY_ROTATE',
}

export type BlendRequest = {
  intermediateCount: number
}

export type ShapeKind = 'rectangle' | 'ellipse' | 'polygon' | 'star'

export type ShapeRequest = {
  kind: ShapeKind
  width: number
  height: number
  cornerRadius: number
  pointCount: number
  innerRadius: number
  fillColor: string
  strokeColor: string
  strokeWidth: number
}

export type LoopRequest = {
  iterations: number
  offsetX: number
  offsetY: number
  rotationStep: number
  controlPoint: ControlPointKey
  insertAboveSource: boolean
  scaleWidthStep: number
  scaleHeightStep: number
  opacityStart: number
  opacityEnd: number
  fillStart: string
  fillEnd: string
  strokeStart: string
  strokeEnd: string
  strokeWidthStart: number
  strokeWidthEnd: number
}

export type CopyRotateRequest = {
  copies: number
  radius: number
  angleStep: number
  startAngle: number
  controlPoint: ControlPointKey
  radialAlignCopies: boolean
}

export type ControlPointKey =
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'middleLeft'
  | 'center'
  | 'middleRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomRight'

export type PluginPayload = {
  type: PluginMessage.BLEND_RESULT
  data?: string
} | {
  type: PluginMessage.BLEND_ERROR
  data?: string
} | {
  type: PluginMessage.SELECTION_STATE
  data: {
    selectedCount: number
  }
} | {
  type: PluginMessage.SHAPE_RESULT
  data?: string
} | {
  type: PluginMessage.SHAPE_ERROR
  data?: string
} | {
  type: PluginMessage.LOOP_RESULT
  data?: string
} | {
  type: PluginMessage.LOOP_ERROR
  data?: string
} | {
  type: PluginMessage.COPY_ROTATE_RESULT
  data?: string
} | {
  type: PluginMessage.COPY_ROTATE_ERROR
  data?: string
}

export type UIToPluginMessage = {
  type: UIMessage
  data?: BlendRequest | ShapeRequest | LoopRequest | CopyRotateRequest
}

/**
 * 向 UI 发送消息
 */
export const sendMsgToUI = (data: PluginPayload) => {
  mg.ui.postMessage(data, '*')
}

/**
 * 向插件发送消息
 */
export const sendMsgToPlugin = (data: UIToPluginMessage) => {
  parent.postMessage(data, '*')
}
