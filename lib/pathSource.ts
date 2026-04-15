import {
  applyTransform,
  boundsOfPoints,
  contourDepth,
  contourSignedArea,
  parseSvgPathContours,
  type Bounds,
  type Contour,
  type Point,
} from './svgPath'

type Transform = [[number, number, number], [number, number, number]]

export type PathContour = Contour & {
  depth: number
  area: number
}

export type ExtractedPath = {
  contours: PathContour[]
  windingRule: string
  bounds: Bounds
}

type ShapeNodeLike = {
  clone: () => ShapeNodeLike
  absoluteTransform: Transform
  penPaths: {
    data: string
    windingRule: string
  } | null
  remove: () => void
}

type PenPathSourceLike = {
  absoluteTransform: Transform
  penPaths?: {
    data: string
    windingRule: string
  } | null
}

const contourArea = (contour: Contour) => Math.abs(contourSignedArea(contour.points))

const sortContours = (contours: Contour[]) =>
  contours
    .slice()
    .sort((left, right) => contourArea(right) - contourArea(left))

const normalizeContours = (contours: Contour[]) => {
  const absoluteContours = sortContours(contours)
  return absoluteContours
    .map((contour) => ({
      points: contour.points,
      closed: contour.closed,
      depth: contourDepth(contour, absoluteContours),
      area: contourArea(contour),
    }))
    .sort((left, right) => {
      if (left.depth !== right.depth) {
        return left.depth - right.depth
      }

      if (left.area !== right.area) {
        return right.area - left.area
      }

      return 0
    })
}

const toAbsolutePoints = (points: Point[], transform: Transform) =>
  points.map((point) => applyTransform(point, transform))

const extractContoursFromPenPathSource = (
  source: PenPathSourceLike
): ExtractedPath | null => {
  const penPath = source.penPaths
  if (!penPath || !penPath.data) {
    return null
  }

  let contours: Contour[]
  try {
    contours = parseSvgPathContours(penPath.data)
  } catch {
    return null
  }

  if (contours.length === 0) {
    return null
  }

  const absoluteContours = normalizeContours(
    contours.map((contour) => ({
      points: toAbsolutePoints(contour.points, source.absoluteTransform),
      closed: contour.closed,
    }))
  )

  return {
    contours: absoluteContours,
    windingRule: penPath.windingRule,
    bounds: boundsOfPoints(absoluteContours.flatMap((contour) => contour.points)),
  }
}

export const extractContoursFromNode = (node: SceneNode): ExtractedPath | null => {
  const directContours = extractContoursFromPenPathSource(node as unknown as PenPathSourceLike)
  if (directContours) {
    return directContours
  }

  const tempNode = node.clone()
  const flattened = mg.flatten([tempNode])

  if (!flattened) {
    return null
  }

  const pen = flattened as ShapeNodeLike
  const flattenedContours = extractContoursFromPenPathSource(pen)
  pen.remove()

  if (!flattenedContours) {
    return null
  }

  return flattenedContours
}
