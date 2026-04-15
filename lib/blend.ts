type BlendPoint = {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
}

type SolidColor = {
  r: number
  g: number
  b: number
  a?: number
}

type PaintLike = {
  type: string
  opacity?: number
  color?: SolidColor
  visible?: boolean
  blendMode?: string
  [key: string]: unknown
}

type BlendableNode = {
  clone: () => any
  parent: { appendChild: (node: any) => void } | null
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fills?: readonly PaintLike[]
  strokes?: readonly PaintLike[]
  blendMode?: string
  strokeWeight?: number
  strokeAlign?: string
  strokeCap?: string
  strokeJoin?: string
  cornerRadius?: number | typeof mg.mixed
  topLeftRadius?: number
  topRightRadius?: number
  bottomLeftRadius?: number
  bottomRightRadius?: number
  resize?: (width: number, height: number) => void
  name: string
}

type BlendResult = {
  createdCount: number
  label: string
}

const lerp = (start: number, end: number, t: number) => start + (end - start) * t

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const interpolateColor = (start: SolidColor, end: SolidColor, t: number): SolidColor => ({
  r: lerp(start.r, end.r, t),
  g: lerp(start.g, end.g, t),
  b: lerp(start.b, end.b, t),
  a: lerp(start.a ?? 1, end.a ?? 1, t),
})

const interpolatePoint = (start: BlendPoint, end: BlendPoint, t: number): BlendPoint => ({
  x: lerp(start.x, end.x, t),
  y: lerp(start.y, end.y, t),
  width: lerp(start.width, end.width, t),
  height: lerp(start.height, end.height, t),
  rotation: lerp(start.rotation, end.rotation, t),
  opacity: lerp(start.opacity, end.opacity, t),
})

const readPoint = (node: BlendableNode): BlendPoint => ({
  x: node.x,
  y: node.y,
  width: node.width,
  height: node.height,
  rotation: node.rotation ?? 0,
  opacity: node.opacity ?? 1,
})

const isSolidPaint = (paint: PaintLike): paint is PaintLike & { color: SolidColor } => {
  return paint.type === 'SOLID' && !!paint.color
}

const clonePaint = (paint: PaintLike): PaintLike => ({
  ...paint,
  color: paint.color ? { ...paint.color } : paint.color,
})

const copyPaintArray = (paints: readonly PaintLike[] | undefined) =>
  paints ? paints.map((paint) => clonePaint(paint)) : undefined

const chooseFallbackPaints = (
  start: readonly PaintLike[] | undefined,
  end: readonly PaintLike[] | undefined
) => {
  if (start && start.length > 0) {
    return copyPaintArray(start)
  }

  if (end && end.length > 0) {
    return copyPaintArray(end)
  }

  return undefined
}

const blendPaintArray = (
  start: readonly PaintLike[] | undefined,
  end: readonly PaintLike[] | undefined,
  t: number
): readonly PaintLike[] | undefined => {
  if (!start || !end || start.length === 0 || end.length === 0 || start.length !== end.length) {
    return undefined
  }

  const blended = start.map((paint, index) => {
    const target = end[index]
    if (!isSolidPaint(paint) || !isSolidPaint(target)) {
      return undefined
    }

    return {
      ...paint,
      color: interpolateColor(paint.color, target.color, t),
      opacity: lerp(paint.opacity ?? 1, target.opacity ?? 1, t),
    }
  })

  if (blended.some((paint) => paint === undefined)) {
    return undefined
  }

  return blended as PaintLike[]
}

const clearStrokeAppearance = (node: BlendableNode) => {
  node.strokes = []
  node.strokeWeight = 0
}

const clearFillAppearance = (node: BlendableNode) => {
  node.fills = []
}

const blendOptionalNumber = (start?: number, end?: number, t?: number) => {
  if (typeof start === 'number' && typeof end === 'number' && typeof t === 'number') {
    return lerp(start, end, t)
  }

  if (typeof start === 'number') {
    return start
  }

  if (typeof end === 'number') {
    return end
  }

  return undefined
}

const blendCornerRadius = (
  start: BlendableNode,
  end: BlendableNode,
  t: number
): number | undefined => {
  return blendOptionalNumber(start.cornerRadius, end.cornerRadius, t)
}

const applyInterpolatedAppearance = (
  clone: BlendableNode,
  start: BlendableNode,
  end: BlendableNode,
  t: number
) => {
  clone.opacity = lerp(start.opacity, end.opacity, t)

  const blendedFills = blendPaintArray(start.fills, end.fills, t)
  if (blendedFills) {
    clone.fills = blendedFills
  } else {
    const fallbackFills = chooseFallbackPaints(start.fills, end.fills)
    if (fallbackFills) {
      clone.fills = fallbackFills
    } else {
      clearFillAppearance(clone)
    }
  }

  const blendedStrokes = blendPaintArray(start.strokes, end.strokes, t)
  if (blendedStrokes) {
    clone.strokes = blendedStrokes
    const blendedStrokeWeight = blendOptionalNumber(start.strokeWeight, end.strokeWeight, t)
    if (typeof blendedStrokeWeight === 'number') {
      clone.strokeWeight = blendedStrokeWeight
    }
  } else {
    const fallbackStrokes = chooseFallbackPaints(start.strokes, end.strokes)
    if (fallbackStrokes) {
      clone.strokes = fallbackStrokes
      const fallbackStrokeWeight = blendOptionalNumber(start.strokeWeight, end.strokeWeight, t)
      if (typeof fallbackStrokeWeight === 'number') {
        clone.strokeWeight = fallbackStrokeWeight
      }
    } else {
      clearStrokeAppearance(clone)
    }
  }

  const cornerRadius = blendCornerRadius(start, end, t)
  if (typeof cornerRadius === 'number') {
    clone.cornerRadius = cornerRadius
  }

  if (typeof start.topLeftRadius === 'number' && typeof end.topLeftRadius === 'number') {
    clone.topLeftRadius = lerp(start.topLeftRadius, end.topLeftRadius, t)
  }

  if (typeof start.topRightRadius === 'number' && typeof end.topRightRadius === 'number') {
    clone.topRightRadius = lerp(start.topRightRadius, end.topRightRadius, t)
  }

  if (typeof start.bottomLeftRadius === 'number' && typeof end.bottomLeftRadius === 'number') {
    clone.bottomLeftRadius = lerp(start.bottomLeftRadius, end.bottomLeftRadius, t)
  }

  if (typeof start.bottomRightRadius === 'number' && typeof end.bottomRightRadius === 'number') {
    clone.bottomRightRadius = lerp(start.bottomRightRadius, end.bottomRightRadius, t)
  }
}

export const copyLayerAppearance = (target: BlendableNode, source: BlendableNode) => {
  target.opacity = source.opacity
  target.blendMode = source.blendMode
  if (source.fills && source.fills.length > 0) {
    target.fills = copyPaintArray(source.fills)
  } else {
    clearFillAppearance(target)
  }
  if (source.strokes && source.strokes.length > 0) {
    target.strokes = copyPaintArray(source.strokes)
    target.strokeWeight = source.strokeWeight
  } else {
    clearStrokeAppearance(target)
  }
  target.strokeAlign = source.strokeAlign
  target.strokeCap = source.strokeCap
  target.strokeJoin = source.strokeJoin

  if (typeof source.cornerRadius === 'number') {
    target.cornerRadius = source.cornerRadius
  }

  if (typeof source.topLeftRadius === 'number') {
    target.topLeftRadius = source.topLeftRadius
  }

  if (typeof source.topRightRadius === 'number') {
    target.topRightRadius = source.topRightRadius
  }

  if (typeof source.bottomLeftRadius === 'number') {
    target.bottomLeftRadius = source.bottomLeftRadius
  }

  if (typeof source.bottomRightRadius === 'number') {
    target.bottomRightRadius = source.bottomRightRadius
  }
}

export const applyInterpolatedProperties = (
  clone: BlendableNode,
  start: BlendableNode,
  end: BlendableNode,
  t: number
) => {
  const point = interpolatePoint(readPoint(start), readPoint(end), t)
  clone.x = point.x
  clone.y = point.y
  clone.opacity = point.opacity
  clone.rotation = point.rotation

  if (typeof clone.resize === 'function') {
    clone.resize(point.width, point.height)
  } else {
    clone.width = point.width
    clone.height = point.height
  }

  applyInterpolatedAppearance(clone, start, end, t)
}

export const createBlendNodes = (
  startNode: BlendableNode,
  endNode: BlendableNode,
  intermediateCount: number
): BlendResult => {
  const normalizedCount = clamp(Math.floor(intermediateCount), 1, 200)
  const parent = startNode.parent

  if (!parent) {
    throw new Error('所选图层没有可用的父级容器，无法创建混合结果。')
  }

  const created: BlendableNode[] = []

  for (let index = 1; index <= normalizedCount; index += 1) {
    const t = index / (normalizedCount + 1)
    const clone = startNode.clone() as BlendableNode
    clone.name = `Blend ${index}/${normalizedCount}`

    applyInterpolatedProperties(clone, startNode, endNode, t)
    parent.appendChild(clone)
    created.push(clone)
  }

  groupCreatedNodes(created, '混合组')

  return {
    createdCount: created.length,
    label: `已生成 ${created.length} 个混合中间层`,
  }
}

export const applyLayerAppearance = applyInterpolatedAppearance
import { groupCreatedNodes } from './nodeGroup'
