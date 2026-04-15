import { copyLayerAppearance } from './blend'
import { groupCreatedNodes } from './nodeGroup'
import { type ControlPointKey, type LoopRequest } from '@messages/sender'

type LoopNodeLike = SceneNode & {
  clone: () => LoopNodeLike
  parent: { appendChild: (node: LoopNodeLike) => void } | null
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fills?: readonly unknown[]
  strokes?: readonly unknown[]
  strokeWeight?: number
  resize?: (width: number, height: number) => void
  name: string
}

type LoopParentLike = LoopNodeLike['parent'] & {
  insertChild?: (index: number, node: LoopNodeLike) => void
  children?: LoopNodeLike[]
}

type ShapeResult = {
  createdCount: number
  label: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (start: number, end: number, t: number) => start + (end - start) * t

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

const hexToRgba = (value: string) => {
  const trimmed = value.trim().replace(/^#/, '')
  const hex = trimmed.length === 3
    ? trimmed.split('').map((char) => char + char).join('')
    : trimmed

  const safeHex = hex.length === 6 ? hex : '3b82f6'
  const parsed = Number.parseInt(safeHex, 16)

  return {
    r: ((parsed >> 16) & 255) / 255,
    g: ((parsed >> 8) & 255) / 255,
    b: (parsed & 255) / 255,
    a: 1,
  }
}

const lerpColor = (start: string, end: string, t: number) => {
  const a = hexToRgba(start)
  const b = hexToRgba(end)
  const mix = {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
    a: lerp(a.a, b.a, t),
  }

  return {
    type: 'SOLID',
    color: mix,
    opacity: 1,
    visible: true,
    blendMode: 'NORMAL',
  }
}

const hasText = (value: string) => value.trim().length > 0

const solidColor = (value: string) => {
  const color = hexToRgba(value)

  return {
    type: 'SOLID',
    color,
    opacity: 1,
    visible: true,
    blendMode: 'NORMAL',
  }
}

const getLoopPaint = (start: string, end: string, t: number) => {
  const hasStartColor = hasText(start)
  const hasEndColor = hasText(end)

  if (hasStartColor && hasEndColor) {
    return lerpColor(start, end, t)
  }

  if (hasStartColor) {
    return solidColor(start)
  }

  if (hasEndColor) {
    return solidColor(end)
  }

  return null
}

const applyLoopPaint = (
  clone: LoopNodeLike,
  startColor: string,
  endColor: string,
  t: number,
  target: 'fills' | 'strokes'
) => {
  const paint = getLoopPaint(startColor, endColor, t)
  if (!paint) {
    return false
  }

  if (target === 'fills') {
    clone.fills = [paint]
    return true
  }

  clone.strokes = [paint]
  return true
}

const rotateVector = (x: number, y: number, radians: number) => {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}

const createLoopLabel = (index: number, total: number) => `循环 ${index}/${total}`

const insertNodeRelativeToSource = (
  parent: LoopParentLike,
  node: LoopNodeLike,
  source: LoopNodeLike,
  above: boolean
) => {
  const children = parent.children ?? []
  const sourceIndex = children.findIndex((child) => child.id === source.id)

  if (typeof parent.insertChild === 'function' && sourceIndex >= 0) {
    parent.insertChild(above ? sourceIndex + 1 : sourceIndex, node)
    return
  }

  parent.appendChild(node)
}

export const createLoopNodes = (selection: SceneNode[], request: LoopRequest): ShapeResult => {
  if (selection.length < 1) {
    throw new Error('请先选中 1 个图层。')
  }

  const source = selection[0] as LoopNodeLike
  const parent = source.parent
  if (!parent) {
    throw new Error('所选图层没有父级容器，无法创建循环。')
  }

  const iterations = clamp(Math.floor(request.iterations), 2, 200)
  const created: LoopNodeLike[] = []
  const baseWidth = source.width
  const baseHeight = source.height
  const baseX = source.x
  const baseY = source.y
  const baseRotation = source.rotation ?? 0
  const anchor = controlPointMap[request.controlPoint ?? 'center']
  const baseAnchorX = baseX + baseWidth * anchor.x
  const baseAnchorY = baseY + baseHeight * anchor.y
  const loopParent = parent as LoopParentLike
  const shouldInsertAboveSource = request.insertAboveSource !== false

  for (let index = 0; index < iterations; index += 1) {
    const t = iterations === 1 ? 0 : index / (iterations - 1)
    const clone = source.clone()
    const nextWidth = Math.max(1, baseWidth + request.scaleWidthStep * index)
    const nextHeight = Math.max(1, baseHeight + request.scaleHeightStep * index)
    const nextAnchorX = baseAnchorX + request.offsetX * index
    const nextAnchorY = baseAnchorY + request.offsetY * index
    const nextRotation = baseRotation + request.rotationStep * index
    const nextOpacity = lerp(request.opacityStart, request.opacityEnd, t) / 100
    const strokeWidth = lerp(request.strokeWidthStart, request.strokeWidthEnd, t)
    const radians = (nextRotation * Math.PI) / 180
    const anchorVecX = (anchor.x - 0.5) * nextWidth
    const anchorVecY = (anchor.y - 0.5) * nextHeight
    const topLeftVecX = -nextWidth / 2
    const topLeftVecY = -nextHeight / 2
    const rotatedAnchor = rotateVector(anchorVecX, anchorVecY, radians)
    const rotatedTopLeft = rotateVector(topLeftVecX, topLeftVecY, radians)

    clone.name = createLoopLabel(index + 1, iterations)
    copyLayerAppearance(clone, source)

    clone.rotation = nextRotation
    clone.opacity = clamp(nextOpacity, 0, 1)
    if (typeof clone.resize === 'function') {
      clone.resize(nextWidth, nextHeight)
    } else {
      clone.width = nextWidth
      clone.height = nextHeight
    }
    const centerX = nextAnchorX - rotatedAnchor.x
    const centerY = nextAnchorY - rotatedAnchor.y
    clone.x = centerX + rotatedTopLeft.x
    clone.y = centerY + rotatedTopLeft.y

    applyLoopPaint(clone, request.fillStart, request.fillEnd, t, 'fills')
    const hasStroke = applyLoopPaint(clone, request.strokeStart, request.strokeEnd, t, 'strokes')
    if (hasStroke) {
      clone.strokeWeight = Math.max(0, strokeWidth)
    }

    insertNodeRelativeToSource(loopParent, clone, source, shouldInsertAboveSource)
    created.push(clone)
  }

  groupCreatedNodes(created, '循环组')

  return {
    createdCount: created.length,
    label: `已生成 ${created.length} 个循环层`,
  }
}
