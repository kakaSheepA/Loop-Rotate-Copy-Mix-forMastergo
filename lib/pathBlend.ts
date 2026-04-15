import { applyLayerAppearance } from './blend'
import { groupCreatedNodes } from './nodeGroup'
import { extractContoursFromNode, type ExtractedPath, type PathContour } from './pathSource'
import { boundsOfPoints, contourSignedArea, resampleContour, serializeContour, type Contour, type Point } from './svgPath'

type BlendResult = {
  createdCount: number
  label: string
}

type ShapeNodeLike = {
  parent: { appendChild: (node: ShapeNodeLike) => void } | null
  name: string
  rotation: number
  x: number
  y: number
  width: number
  height: number
  penPaths: Array<{
    windingRule: string
    data: string
  }>
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const lerp = (start: number, end: number, t: number) => start + (end - start) * t

const contourArea = (contour: Contour) => Math.abs(contourSignedArea(contour.points))

const groupContoursByDepth = (contours: ExtractedPath['contours']) => {
  const groups = new Map<number, ExtractedPath['contours']>()

  for (const contour of contours) {
    const bucket = groups.get(contour.depth)
    if (bucket) {
      bucket.push(contour)
    } else {
      groups.set(contour.depth, [contour])
    }
  }

  return groups
}

const reverseContour = (contour: Contour): Contour => ({
  points: contour.points.slice().reverse(),
  closed: contour.closed,
})

const alignContourOrientation = (start: Contour, end: Contour) => {
  if (!start.closed || !end.closed) {
    return end
  }

  const startArea = contourSignedArea(start.points)
  const endArea = contourSignedArea(end.points)
  if (Math.abs(startArea) <= 1e-6 || Math.abs(endArea) <= 1e-6) {
    return end
  }

  if (startArea * endArea < 0) {
    return reverseContour(end)
  }

  return end
}

const pairContours = (startContours: ExtractedPath['contours'], endContours: ExtractedPath['contours']) => {
  const startGroups = groupContoursByDepth(startContours)
  const endGroups = groupContoursByDepth(endContours)
  const depths = Array.from(new Set([...startGroups.keys(), ...endGroups.keys()])).sort((left, right) => left - right)

  const pairs: Array<{ start: PathContour; end: PathContour }> = []

  for (const depth of depths) {
    const startGroup = startGroups.get(depth)
    const endGroup = endGroups.get(depth)

    if (!startGroup || !endGroup) {
      throw new Error('Contour depth mismatch.')
    }

    const count = Math.max(startGroup.length, endGroup.length)
    for (let index = 0; index < count; index += 1) {
      const startContour = startGroup[Math.min(index, startGroup.length - 1)]
      const endContour = endGroup[Math.min(index, endGroup.length - 1)]

      if (!startContour || !endContour || startContour.closed !== endContour.closed) {
        throw new Error('Contour structure mismatch.')
      }

      pairs.push({
        start: startContour,
        end: endContour,
      })
    }
  }

  return pairs
}

const buildMixedPath = (start: ExtractedPath, end: ExtractedPath, t: number) => {
  const contourPairs = pairContours(start.contours, end.contours)
  const mixedContours: Array<{ points: Point[]; closed: boolean }> = []

  for (const pair of contourPairs) {
    const startContour = pair.start
    const endContour = alignContourOrientation(pair.start, pair.end)
    const sampleCount = clamp(Math.max(startContour.points.length, endContour.points.length, 32), 24, 256)

    const startSamples = resampleContour(startContour, sampleCount)
    const endSamples = resampleContour(endContour, sampleCount)
    const mixedPoints = startSamples.map((startPoint, sampleIndex) => ({
      x: lerp(startPoint.x, endSamples[sampleIndex].x, t),
      y: lerp(startPoint.y, endSamples[sampleIndex].y, t),
    }))

    mixedContours.push({
      points: mixedPoints,
      closed: startContour.closed,
    })
  }

  const allPoints = mixedContours.flatMap((contour) => contour.points)
  const bounds = boundsOfPoints(allPoints)
  const data = mixedContours
    .map((contour) => {
      const localPoints = contour.points.map((point) => ({
        x: point.x - bounds.x,
        y: point.y - bounds.y,
      }))
      return serializeContour(localPoints, contour.closed)
    })
    .filter(Boolean)
    .join(' ')

  return {
    bounds,
    data,
    windingRule: start.windingRule,
  }
}

const createPathBlendLabel = (index: number, total: number) => `Path Blend ${index}/${total}`

export const tryCreatePathBlendNodes = (startNode: SceneNode, endNode: SceneNode, intermediateCount: number): BlendResult | null => {
  try {
    const startPath = extractContoursFromNode(startNode)
    const endPath = extractContoursFromNode(endNode)

    if (!startPath || !endPath) {
      return null
    }

    if (startPath.contours.length === 0 || endPath.contours.length === 0) {
      return null
    }

    const normalizedCount = clamp(Math.floor(intermediateCount), 1, 200)
    const parent = startNode.parent
    if (!parent) {
      return null
    }

    const created: ShapeNodeLike[] = []

    for (let index = 1; index <= normalizedCount; index += 1) {
      const t = index / (normalizedCount + 1)
      const mixed = buildMixedPath(startPath, endPath, t)
      const pen = mg.createPen() as ShapeNodeLike
      pen.name = createPathBlendLabel(index, normalizedCount)
      applyLayerAppearance(pen as any, startNode as any, endNode as any, t)
      pen.rotation = 0
      pen.x = mixed.bounds.x
      pen.y = mixed.bounds.y
      pen.width = mixed.bounds.width
      pen.height = mixed.bounds.height
      pen.penPaths = [
        {
          windingRule: mixed.windingRule,
          data: mixed.data,
        },
      ]
      pen.name = createPathBlendLabel(index, normalizedCount)
      parent.appendChild(pen)
      created.push(pen)
    }

    groupCreatedNodes(created, '路径混合组')

    return {
      createdCount: normalizedCount,
      label: `已生成 ${normalizedCount} 个路径混合中间层`,
    }
  } catch {
    return null
  }
}
