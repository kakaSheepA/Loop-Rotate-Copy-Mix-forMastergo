import { groupCreatedNodes } from './nodeGroup'
import { type ControlPointKey, type CopyRotateRequest } from '@messages/sender'

type CopyRotateNodeLike = SceneNode & {
  type: SceneNode['type']
  clone: () => CopyRotateNodeLike
  parent: { appendChild: (node: CopyRotateNodeLike) => void } | null
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  resize?: (width: number, height: number) => void
  name: string
}

type CopyRotateComponentLike = CopyRotateNodeLike & {
  createInstance: () => CopyRotateNodeLike
}

type CopyRotateResult = {
  createdCount: number
  label: string
  previewGroup?: { remove?: () => void } | null
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const degToRad = (value: number) => (value * Math.PI) / 180
const referenceCopyCount = 8

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

const rotateVector = (x: number, y: number, radians: number) => {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  }
}

const buildPlacement = (
  index: number,
  request: CopyRotateRequest,
  anchor: { x: number; y: number },
  orbitCenterX: number,
  orbitCenterY: number,
  baseWidth: number,
  baseHeight: number,
  baseRotation: number
) => {
  const angleStep = request.angleStep * (referenceCopyCount / Math.max(1, request.copies))
  const angle = request.startAngle + angleStep * index
  const rotation = request.radialAlignCopies ? baseRotation + angle : baseRotation
  const radians = degToRad(rotation)
  const offset = rotateVector(request.radius, 0, radians)
  const nextAnchorX = orbitCenterX + offset.x
  const nextAnchorY = orbitCenterY + offset.y
  const anchorVecX = (anchor.x - 0.5) * baseWidth
  const anchorVecY = (anchor.y - 0.5) * baseHeight
  const topLeftVecX = -baseWidth / 2
  const topLeftVecY = -baseHeight / 2
  const rotatedAnchor = rotateVector(anchorVecX, anchorVecY, radians)
  const rotatedTopLeft = rotateVector(topLeftVecX, topLeftVecY, radians)
  const centerX = nextAnchorX - rotatedAnchor.x
  const centerY = nextAnchorY - rotatedAnchor.y

  return {
    angle,
    x: centerX + rotatedTopLeft.x,
    y: centerY + rotatedTopLeft.y,
    rotation,
  }
}

const createSourceLabel = () => '公共组件（父形状）'
const createChildLabel = (index: number, total: number) => `子组件 ${index}/${total}`
const createPreviewLabel = (index: number, total: number) => `复制旋转 ${index}/${total}`

const findComponentAncestor = (node: CopyRotateNodeLike) => {
  let current: { type?: string; parent?: { type?: string; parent?: unknown } | null } | null =
    node

  while (current) {
    if (current.type === 'COMPONENT') {
      return current as CopyRotateComponentLike
    }

    current = current.parent ?? null
  }

  return null
}

export const buildCopyRotateNodes = (
  selection: SceneNode[],
  request: CopyRotateRequest,
  options: {
    preview?: boolean
  } = {}
): CopyRotateResult => {
  if (selection.length < 1) {
    throw new Error('请先选中 1 个图层。')
  }

  const source = selection[0] as CopyRotateNodeLike
  const parent = source.parent
  if (!parent) {
    throw new Error('所选图层没有父级容器，无法复制旋转。')
  }

  const totalCount = clamp(Math.floor(request.copies), 1, 200)
  const baseWidth = source.width
  const baseHeight = source.height
  const baseRotation = source.rotation ?? 0
  const anchor = controlPointMap[request.controlPoint ?? 'center']
  const orbitCenterX = source.x + baseWidth / 2
  const orbitCenterY = source.y + baseHeight / 2
  const previewOpacity = options.preview ? 0.42 : 1
  const placements = Array.from({ length: totalCount }, (_, index) =>
    buildPlacement(
      index,
      request,
      anchor,
      orbitCenterX,
      orbitCenterY,
      baseWidth,
      baseHeight,
      baseRotation
    )
  )

  const applyPlacement = (node: CopyRotateNodeLike, placement: ReturnType<typeof buildPlacement>) => {
    if (typeof node.resize === 'function') {
      node.resize(baseWidth, baseHeight)
    } else {
      node.width = baseWidth
      node.height = baseHeight
    }

    node.rotation = placement.rotation
    node.x = placement.x
    node.y = placement.y
  }

  if (options.preview) {
    const created: CopyRotateNodeLike[] = []
    placements.forEach((placement, index) => {
      const previewNode = source.clone()
      previewNode.name = createPreviewLabel(index + 1, totalCount)
      previewNode.opacity = previewOpacity
      applyPlacement(previewNode, placement)
      parent.appendChild(previewNode)
      created.push(previewNode)
    })

    const group = groupCreatedNodes(created, '复制旋转公共组件预览')
    return {
      createdCount: totalCount,
      label: `已更新预览 ${totalCount} 个复制旋转对象`,
      previewGroup: group ? (group as { remove?: () => void } | null) : null,
    }
  }

  const componentAncestor = findComponentAncestor(source)
  if (!componentAncestor) {
    const component = mg.createComponent([source]) as CopyRotateComponentLike
    component.name = createSourceLabel()
    applyPlacement(component, placements[0])

    placements.slice(1).forEach((placement, index) => {
      const instance = component.createInstance()
      instance.name = createChildLabel(index + 1, totalCount - 1)
      applyPlacement(instance, placement)
      parent.appendChild(instance)
    })

    return {
      createdCount: totalCount,
      label: `已生成 ${totalCount} 个复制旋转组件`,
      previewGroup: null,
    }
  }

  const component = componentAncestor as CopyRotateComponentLike
  component.name = component.name || createSourceLabel()
  applyPlacement(component, placements[0])

  placements.slice(1).forEach((placement, index) => {
    const instance = component.createInstance()
    instance.name = createChildLabel(index + 1, totalCount - 1)
    applyPlacement(instance, placement)
    parent.appendChild(instance)
  })

  return {
    createdCount: totalCount,
    label: `已生成 ${totalCount} 个复制旋转组件`,
    previewGroup: null,
  }
}
