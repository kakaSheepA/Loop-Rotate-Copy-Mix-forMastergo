import { applyInterpolatedProperties } from './blend'
import { groupCreatedNodes } from './nodeGroup'
import { extractContoursFromNode, type ExtractedPath, type PathContour } from './pathSource'
import { boundsOfPoints, contourLength, sampleContourFrame } from './svgPath'

type BlendResult = {
  createdCount: number
  label: string
}

type BlendableNode = SceneNode & {
  clone: () => BlendableNode
  parent: { appendChild: (node: BlendableNode) => void } | null
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

type PathNode = {
  node: BlendableNode
  path: ExtractedPath
  contour: PathContour
}

type ShapeNode = {
  node: BlendableNode
  path: ExtractedPath
  center: { x: number; y: number }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const distance = (start: { x: number; y: number }, end: { x: number; y: number }) =>
  Math.hypot(end.x - start.x, end.y - start.y)

const getContourCenter = (path: ExtractedPath) => {
  const bounds = path.bounds.width > 0 || path.bounds.height > 0
    ? path.bounds
    : boundsOfPoints(path.contours.flatMap((contour) => contour.points))

  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

const getLongestOpenContour = (path: ExtractedPath): PathContour | null => {
  const openContours = path.contours.filter((contour) => !contour.closed)

  if (openContours.length === 0) {
    return null
  }

  return openContours.reduce((longest, contour) =>
    contourLength(contour) > contourLength(longest) ? contour : longest
  )
}

const getPathNode = (node: SceneNode): PathNode | null => {
  const path = extractContoursFromNode(node)
  const contour = path ? getLongestOpenContour(path) : null

  if (!path || !contour) {
    return null
  }

  return {
    node: node as BlendableNode,
    path,
    contour,
  }
}

const getShapeNode = (node: SceneNode): ShapeNode | null => {
  const path = extractContoursFromNode(node)

  if (!path || path.contours.length === 0 || path.contours.every((contour) => !contour.closed)) {
    return null
  }

  return {
    node: node as BlendableNode,
    path,
    center: getContourCenter(path),
  }
}

const pickBestShapePair = (shapes: ShapeNode[], startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => {
  if (shapes.length < 2) {
    return null
  }

  let best: { source: ShapeNode; target: ShapeNode } | null = null
  let bestScore = Number.POSITIVE_INFINITY

  for (let i = 0; i < shapes.length; i += 1) {
    for (let j = i + 1; j < shapes.length; j += 1) {
      const left = shapes[i]
      const right = shapes[j]

      const scoreForward =
        distance(left.center, startPoint) +
        distance(right.center, endPoint)
      const scoreReverse =
        distance(right.center, startPoint) +
        distance(left.center, endPoint)

      if (scoreForward < bestScore) {
        bestScore = scoreForward
        best = {
          source: left,
          target: right,
        }
      }

      if (scoreReverse < bestScore) {
        bestScore = scoreReverse
        best = {
          source: right,
          target: left,
        }
      }
    }
  }

  return best
}

const createGuidedPathBlendLabel = (index: number, total: number) => `Path Blend ${index}/${total}`

export const tryCreateGuidedPathBlendNodes = (
  selectedNodes: SceneNode[],
  intermediateCount: number
): BlendResult | null => {
  try {
    const pathNodes = selectedNodes.map(getPathNode).filter((item): item is PathNode => !!item)
    if (pathNodes.length === 0) {
      return null
    }

    const guideNode = pathNodes
      .slice()
      .sort((left, right) => contourLength(right.contour) - contourLength(left.contour))[0]

    const guideStart = sampleContourFrame(guideNode.contour, 0).point
    const guideEnd = sampleContourFrame(guideNode.contour, 1).point

    const shapeNodes = selectedNodes
      .filter((node) => node !== guideNode.node)
      .map(getShapeNode)
      .filter((item): item is ShapeNode => !!item)

    const pair = pickBestShapePair(shapeNodes, guideStart, guideEnd)
    if (!pair) {
      return null
    }

    const parent = pair.source.node.parent
    if (!parent) {
      return null
    }

    const normalizedCount = clamp(Math.floor(intermediateCount), 1, 200)
    const totalCount = normalizedCount + 2
    const created: BlendableNode[] = []

    for (let index = 0; index < totalCount; index += 1) {
      const t = totalCount === 1 ? 0 : index / (totalCount - 1)
      const frame = sampleContourFrame(guideNode.contour, t)
      const clone = pair.source.node.clone() as BlendableNode
      clone.name = createGuidedPathBlendLabel(index + 1, totalCount)
      applyInterpolatedProperties(clone as any, pair.source.node as any, pair.target.node as any, t)
      clone.rotation = frame.angle
      clone.x = frame.point.x - clone.width / 2
      clone.y = frame.point.y - clone.height / 2

      parent.appendChild(clone)
      created.push(clone)
    }

    groupCreatedNodes(created, '路径引导混合组')

    return {
      createdCount: totalCount,
      label: `已生成 ${totalCount} 个路径引导图层`,
    }
  } catch {
    return null
  }
}
