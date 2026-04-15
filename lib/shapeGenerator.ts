import { type ShapeKind, type ShapeRequest } from '@messages/sender'

type PaintLike = {
  type: string
  color?: {
    r: number
    g: number
    b: number
    a?: number
  }
  opacity?: number
  visible?: boolean
  blendMode?: string
}

type ShapeNodeLike = {
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fills?: readonly PaintLike[]
  strokes?: readonly PaintLike[]
  strokeWeight?: number
  strokeAlign?: string
  cornerRadius?: number
  pointCount?: number
  innerRadius?: number
  resize?: (width: number, height: number) => void
  parent: { appendChild: (node: ShapeNodeLike) => void } | null
}

type ShapeResult = {
  createdCount: number
  label: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeHex = (value: string) => {
  const trimmed = value.trim().replace(/^#/, '')
  if (trimmed.length === 3) {
    return trimmed
      .split('')
      .map((char) => char + char)
      .join('')
  }

  if (trimmed.length === 6 || trimmed.length === 8) {
    return trimmed
  }

  return '3b82f6'
}

const hexToRgba = (value: string) => {
  const hex = normalizeHex(value)
  const parsed = Number.parseInt(hex.slice(0, 6), 16)
  const r = (parsed >> 16) & 255
  const g = (parsed >> 8) & 255
  const b = parsed & 255
  const alpha = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1

  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a: clamp(alpha, 0, 1),
  }
}

const makeSolidPaint = (color: string): PaintLike => ({
  type: 'SOLID',
  color: hexToRgba(color),
  opacity: 1,
  visible: true,
  blendMode: 'NORMAL',
})

const clearStrokeAppearance = (node: ShapeNodeLike) => {
  node.strokes = []
  node.strokeWeight = 0
}

const getViewportCenter = () => {
  const center = mg.viewport?.center
  if (!center) {
    return { x: 0, y: 0 }
  }

  return {
    x: center.x,
    y: center.y,
  }
}

const createShapeNode = (kind: ShapeKind) => {
  if (kind === 'rectangle') {
    return mg.createRectangle() as ShapeNodeLike
  }

  if (kind === 'ellipse') {
    return mg.createEllipse() as ShapeNodeLike
  }

  if (kind === 'polygon') {
    return mg.createPolygon() as ShapeNodeLike
  }

  return mg.createStar() as ShapeNodeLike
}

const shapeLabelMap: Record<ShapeKind, string> = {
  rectangle: '矩形',
  ellipse: '椭圆',
  polygon: '多边形',
  star: '星形',
}

export const createGeneratedShape = (request: ShapeRequest): ShapeResult => {
  const parent = mg.document.currentPage
  if (!parent) {
    throw new Error('当前页面不可用，无法生成形状。')
  }

  const width = clamp(Math.floor(request.width), 1, 5000)
  const height = clamp(Math.floor(request.height), 1, 5000)
  const kind = request.kind
  const node = createShapeNode(kind)
  const viewportCenter = getViewportCenter()

  node.name = shapeLabelMap[kind]
  node.opacity = 1

  if (typeof node.resize === 'function') {
    node.resize(width, height)
  } else {
    node.width = width
    node.height = height
  }

  node.x = viewportCenter.x - width / 2
  node.y = viewportCenter.y - height / 2

  node.fills = [makeSolidPaint(request.fillColor)]

  if (request.strokeWidth > 0) {
    node.strokes = [makeSolidPaint(request.strokeColor)]
    node.strokeWeight = clamp(request.strokeWidth, 0, 200)
    node.strokeAlign = 'CENTER'
  } else {
    clearStrokeAppearance(node)
  }

  if (kind === 'rectangle' && typeof request.cornerRadius === 'number') {
    node.cornerRadius = clamp(request.cornerRadius, 0, Math.min(width, height) / 2)
  }

  if (kind === 'polygon') {
    node.pointCount = clamp(Math.round(request.pointCount), 3, 12)
  }

  if (kind === 'star') {
    node.pointCount = clamp(Math.round(request.pointCount), 3, 12)
    node.innerRadius = clamp(request.innerRadius, 1, Math.min(width, height) / 2)
  }

  parent.appendChild(node)

  return {
    createdCount: 1,
    label: `已生成 1 个${shapeLabelMap[kind]}`,
  }
}
