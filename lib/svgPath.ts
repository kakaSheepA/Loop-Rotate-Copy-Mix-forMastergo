export type Point = {
  x: number
  y: number
}

export type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

export type Contour = {
  points: Point[]
  closed: boolean
}

export type ContourFrame = {
  point: Point
  angle: number
}

export type Transform = [[number, number, number], [number, number, number]]

const EPSILON = 1e-6

const distance = (start: Point, end: Point) => Math.hypot(end.x - start.x, end.y - start.y)

const lerp = (start: number, end: number, t: number) => start + (end - start) * t

const pointsEqual = (start: Point, end: Point) =>
  Math.abs(start.x - end.x) <= EPSILON && Math.abs(start.y - end.y) <= EPSILON

const pushPoint = (points: Point[], point: Point) => {
  const last = points[points.length - 1]
  if (!last || !pointsEqual(last, point)) {
    points.push(point)
  }
}

export const contourLength = (contour: Contour) => {
  if (contour.points.length < 2) {
    return 0
  }

  const sourcePoints = contour.closed ? canonicalizeClosedContour(contour.points) : contour.points
  const totalSegments = contour.closed ? sourcePoints.length : sourcePoints.length - 1
  let total = 0

  for (let index = 0; index < totalSegments; index += 1) {
    const start = sourcePoints[index]
    const end = sourcePoints[(index + 1) % sourcePoints.length]
    total += distance(start, end)
  }

  return total
}

export const applyTransform = (point: Point, transform: Transform): Point => ({
  x: transform[0][0] * point.x + transform[0][1] * point.y + transform[0][2],
  y: transform[1][0] * point.x + transform[1][1] * point.y + transform[1][2],
})

export const boundsOfPoints = (points: Point[]): Bounds => {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = points[0].x
  let minY = points[0].y
  let maxX = points[0].x
  let maxY = points[0].y

  for (const point of points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

const tokenize = (data: string): string[] => data.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) ?? []

const readNumber = (tokens: string[], state: { index: number }): number => {
  const token = tokens[state.index]
  if (token === undefined) {
    throw new Error('Invalid SVG path data.')
  }

  state.index += 1
  const value = Number(token)
  if (Number.isNaN(value)) {
    throw new Error('Invalid SVG path data.')
  }

  return value
}

const sampleLine = (start: Point, end: Point, steps: number): Point[] => {
  const points: Point[] = []

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    points.push({
      x: lerp(start.x, end.x, t),
      y: lerp(start.y, end.y, t),
    })
  }

  return points
}

const sampleQuadratic = (start: Point, control: Point, end: Point, steps: number): Point[] => {
  const points: Point[] = []

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    const oneMinusT = 1 - t
    points.push({
      x:
        oneMinusT * oneMinusT * start.x +
        2 * oneMinusT * t * control.x +
        t * t * end.x,
      y:
        oneMinusT * oneMinusT * start.y +
        2 * oneMinusT * t * control.y +
        t * t * end.y,
    })
  }

  return points
}

const sampleCubic = (
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  steps: number
): Point[] => {
  const points: Point[] = []

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    const oneMinusT = 1 - t
    points.push({
      x:
        oneMinusT * oneMinusT * oneMinusT * start.x +
        3 * oneMinusT * oneMinusT * t * control1.x +
        3 * oneMinusT * t * t * control2.x +
        t * t * t * end.x,
      y:
        oneMinusT * oneMinusT * oneMinusT * start.y +
        3 * oneMinusT * oneMinusT * t * control1.y +
        3 * oneMinusT * t * t * control2.y +
        t * t * t * end.y,
    })
  }

  return points
}

const estimateLineSamples = (start: Point, end: Point) => {
  const length = distance(start, end)
  return Math.max(2, Math.min(40, Math.ceil(length / 8)))
}

const estimateCurveSamples = (...points: Point[]) => {
  let total = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    total += distance(points[index], points[index + 1])
  }

  return Math.max(6, Math.min(48, Math.ceil(total / 8)))
}

const appendSegmentSamples = (contour: Point[], segment: Point[]) => {
  for (let index = 1; index < segment.length; index += 1) {
    pushPoint(contour, segment[index])
  }
}

const rotateToCanonicalStart = (points: Point[]) => {
  if (points.length === 0) {
    return points
  }

  let bestIndex = 0
  for (let index = 1; index < points.length; index += 1) {
    const candidate = points[index]
    const best = points[bestIndex]
    if (candidate.x < best.x - EPSILON || (Math.abs(candidate.x - best.x) <= EPSILON && candidate.y < best.y)) {
      bestIndex = index
    }
  }

  return points.slice(bestIndex).concat(points.slice(0, bestIndex))
}

export const contourSignedArea = (points: Point[]) => {
  let sum = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    sum += current.x * next.y - next.x * current.y
  }

  return sum / 2
}

export const canonicalizeClosedContour = (points: Point[]) => {
  if (points.length < 3) {
    return points.slice()
  }

  return rotateToCanonicalStart(points.slice())
}

export const pointInPolygon = (point: Point, contour: Point[]) => {
  let inside = false

  for (let index = 0, previous = contour.length - 1; index < contour.length; previous = index, index += 1) {
    const current = contour[index]
    const last = contour[previous]
    const intersects =
      current.y > point.y !== last.y > point.y &&
      point.x < ((last.x - current.x) * (point.y - current.y)) / (last.y - current.y + EPSILON) + current.x

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

export const contourCentroid = (contour: Contour): Point => {
  if (contour.points.length === 0) {
    return { x: 0, y: 0 }
  }

  if (contour.points.length < 3) {
    const bounds = boundsOfPoints(contour.points)
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    }
  }

  const area = contourSignedArea(contour.points)
  if (Math.abs(area) <= EPSILON) {
    const bounds = boundsOfPoints(contour.points)
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    }
  }

  let x = 0
  let y = 0

  for (let index = 0; index < contour.points.length; index += 1) {
    const current = contour.points[index]
    const next = contour.points[(index + 1) % contour.points.length]
    const cross = current.x * next.y - next.x * current.y
    x += (current.x + next.x) * cross
    y += (current.y + next.y) * cross
  }

  const factor = 1 / (6 * area)
  return {
    x: x * factor,
    y: y * factor,
  }
}

export const contourDepth = (contour: Contour, siblings: Contour[]) => {
  const probe = contourCentroid(contour)
  let depth = 0

  for (const sibling of siblings) {
    if (sibling === contour || sibling.points.length < 3) {
      continue
    }

    if (pointInPolygon(probe, sibling.points)) {
      depth += 1
    }
  }

  return depth
}

export const parseSvgPathContours = (data: string): Contour[] => {
  const tokens = tokenize(data)
  const contours: Contour[] = []
  const state = { index: 0 }

  let command = ''
  let current: Point | null = null
  let startPoint: Point | null = null
  let contourPoints: Point[] = []
  let closed = false
  let previousCubicControl: Point | null = null
  let previousQuadraticControl: Point | null = null

  const finishContour = () => {
    if (contourPoints.length > 0) {
      contours.push({
        points: contourPoints,
        closed,
      })
    }
    contourPoints = []
    closed = false
  }

  const appendCurrent = (point: Point) => {
    pushPoint(contourPoints, point)
    current = point
  }

  while (state.index < tokens.length) {
    const token = tokens[state.index]
    if (/[a-zA-Z]/.test(token)) {
      command = token
      state.index += 1
    } else if (!command) {
      throw new Error('Invalid SVG path data.')
    }

    const isRelative = command === command.toLowerCase()
    const upper = command.toUpperCase()

    if (upper === 'M') {
      const x = readNumber(tokens, state)
      const y = readNumber(tokens, state)
      const point = {
        x: isRelative && current ? current.x + x : x,
        y: isRelative && current ? current.y + y : y,
      }

      finishContour()
      contourPoints = [point]
      current = point
      startPoint = point
      closed = false
      previousCubicControl = null
      previousQuadraticControl = null

      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const lineX = readNumber(tokens, state)
        const lineY = readNumber(tokens, state)
        const target = {
          x: isRelative && current ? current.x + lineX : lineX,
          y: isRelative && current ? current.y + lineY : lineY,
        }
        appendSegmentSamples(contourPoints, sampleLine(current, target, estimateLineSamples(current, target)))
        current = target
        startPoint = startPoint ?? point
      }
      continue
    }

    if (!current) {
      throw new Error('Invalid SVG path data.')
    }

    if (upper === 'L') {
      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const x = readNumber(tokens, state)
        const y = readNumber(tokens, state)
        const target = {
          x: isRelative ? current.x + x : x,
          y: isRelative ? current.y + y : y,
        }
        appendSegmentSamples(contourPoints, sampleLine(current, target, estimateLineSamples(current, target)))
        current = target
      }
      previousCubicControl = null
      previousQuadraticControl = null
      continue
    }

    if (upper === 'H') {
      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const x = readNumber(tokens, state)
        const target = {
          x: isRelative ? current.x + x : x,
          y: current.y,
        }
        appendSegmentSamples(contourPoints, sampleLine(current, target, estimateLineSamples(current, target)))
        current = target
      }
      previousCubicControl = null
      previousQuadraticControl = null
      continue
    }

    if (upper === 'V') {
      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const y = readNumber(tokens, state)
        const target = {
          x: current.x,
          y: isRelative ? current.y + y : y,
        }
        appendSegmentSamples(contourPoints, sampleLine(current, target, estimateLineSamples(current, target)))
        current = target
      }
      previousCubicControl = null
      previousQuadraticControl = null
      continue
    }

    if (upper === 'C') {
      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const control1 = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        const control2 = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        const target = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        appendSegmentSamples(
          contourPoints,
          sampleCubic(current, control1, control2, target, estimateCurveSamples(current, control1, control2, target))
        )
        current = target
        previousCubicControl = control2
        previousQuadraticControl = null
      }
      continue
    }

    if (upper === 'S') {
      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const control1 =
          previousCubicControl && current
            ? {
                x: 2 * current.x - previousCubicControl.x,
                y: 2 * current.y - previousCubicControl.y,
              }
            : current
        const control2 = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        const target = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        appendSegmentSamples(
          contourPoints,
          sampleCubic(current, control1, control2, target, estimateCurveSamples(current, control1, control2, target))
        )
        current = target
        previousCubicControl = control2
        previousQuadraticControl = null
      }
      continue
    }

    if (upper === 'Q') {
      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const control = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        const target = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        appendSegmentSamples(
          contourPoints,
          sampleQuadratic(current, control, target, estimateCurveSamples(current, control, target))
        )
        current = target
        previousQuadraticControl = control
        previousCubicControl = null
      }
      continue
    }

    if (upper === 'T') {
      while (state.index < tokens.length && !/[a-zA-Z]/.test(tokens[state.index])) {
        const control =
          previousQuadraticControl && current
            ? {
                x: 2 * current.x - previousQuadraticControl.x,
                y: 2 * current.y - previousQuadraticControl.y,
              }
            : current
        const target = {
          x: isRelative ? current.x + readNumber(tokens, state) : readNumber(tokens, state),
          y: isRelative ? current.y + readNumber(tokens, state) : readNumber(tokens, state),
        }
        appendSegmentSamples(
          contourPoints,
          sampleQuadratic(current, control, target, estimateCurveSamples(current, control, target))
        )
        current = target
        previousQuadraticControl = control
        previousCubicControl = null
      }
      continue
    }

    if (upper === 'A') {
      throw new Error('Arc path commands are not supported.')
    }

    if (upper === 'Z') {
      if (startPoint && current && !pointsEqual(current, startPoint)) {
        appendSegmentSamples(contourPoints, sampleLine(current, startPoint, estimateLineSamples(current, startPoint)))
      }
      closed = true
      current = startPoint
      previousCubicControl = null
      previousQuadraticControl = null
      state.index += 1
      finishContour()
      startPoint = null
      current = null
      continue
    }

    throw new Error('Unsupported SVG path command.')
  }

  finishContour()

  return contours
}

const pointAtDistance = (points: Point[], distanceTarget: number, closed: boolean): Point => {
  const totalSegments = closed ? points.length : points.length - 1
  let accumulated = 0

  for (let index = 0; index < totalSegments; index += 1) {
    const start = points[index]
    const end = points[(index + 1) % points.length]
    const segmentLength = distance(start, end)
    const next = accumulated + segmentLength

    if (distanceTarget <= next || index === totalSegments - 1) {
      const ratio = segmentLength === 0 ? 0 : (distanceTarget - accumulated) / segmentLength
      return {
        x: lerp(start.x, end.x, ratio),
        y: lerp(start.y, end.y, ratio),
      }
    }

    accumulated = next
  }

  return points[points.length - 1]
}

const segmentFrameAtDistance = (points: Point[], distanceTarget: number, closed: boolean): ContourFrame => {
  const totalSegments = closed ? points.length : points.length - 1
  let accumulated = 0

  for (let index = 0; index < totalSegments; index += 1) {
    const start = points[index]
    const end = points[(index + 1) % points.length]
    const segmentLength = distance(start, end)
    const next = accumulated + segmentLength

    if (distanceTarget <= next || index === totalSegments - 1) {
      const ratio = segmentLength === 0 ? 0 : (distanceTarget - accumulated) / segmentLength
      const point = {
        x: lerp(start.x, end.x, ratio),
        y: lerp(start.y, end.y, ratio),
      }

      return {
        point,
        angle: Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI),
      }
    }

    accumulated = next
  }

  const last = points[points.length - 1]
  return {
    point: last,
    angle: 0,
  }
}

export const resampleContour = (contour: Contour, sampleCount: number): Point[] => {
  if (contour.points.length === 0) {
    return []
  }

  if (contour.points.length === 1) {
    return Array.from({ length: sampleCount }, () => contour.points[0])
  }

  const sourcePoints = contour.closed ? canonicalizeClosedContour(contour.points) : contour.points.slice()
  const totalSegments = contour.closed ? sourcePoints.length : sourcePoints.length - 1
  let totalLength = 0

  for (let index = 0; index < totalSegments; index += 1) {
    const start = sourcePoints[index]
    const end = sourcePoints[(index + 1) % sourcePoints.length]
    totalLength += distance(start, end)
  }

  if (totalLength <= EPSILON) {
    return Array.from({ length: sampleCount }, () => sourcePoints[0])
  }

  const result: Point[] = []
  const closed = contour.closed
  const denominator = closed ? sampleCount : Math.max(1, sampleCount - 1)

  for (let index = 0; index < sampleCount; index += 1) {
    const ratio = closed ? index / sampleCount : index / denominator
    const targetDistance = ratio * totalLength
    result.push(pointAtDistance(sourcePoints, targetDistance, closed))
  }

  return result
}

export const sampleContourFrame = (contour: Contour, ratio: number): ContourFrame => {
  if (contour.points.length === 0) {
    return {
      point: { x: 0, y: 0 },
      angle: 0,
    }
  }

  if (contour.points.length === 1) {
    return {
      point: contour.points[0],
      angle: 0,
    }
  }

  const sourcePoints = contour.closed ? canonicalizeClosedContour(contour.points) : contour.points.slice()
  const totalSegments = contour.closed ? sourcePoints.length : sourcePoints.length - 1
  let totalLength = 0

  for (let index = 0; index < totalSegments; index += 1) {
    const start = sourcePoints[index]
    const end = sourcePoints[(index + 1) % sourcePoints.length]
    totalLength += distance(start, end)
  }

  if (totalLength <= EPSILON) {
    return {
      point: sourcePoints[0],
      angle: 0,
    }
  }

  const normalizedRatio = Math.max(0, Math.min(1, ratio))
  const targetDistance = normalizedRatio * totalLength
  return segmentFrameAtDistance(sourcePoints, targetDistance, contour.closed)
}

export const serializeContour = (points: Point[], closed: boolean) => {
  if (points.length === 0) {
    return ''
  }

  const format = (value: number) => {
    const rounded = Math.round(value * 1000) / 1000
    return Number.isInteger(rounded) ? String(rounded) : String(rounded)
  }

  const commands = [`M ${format(points[0].x)} ${format(points[0].y)}`]
  for (let index = 1; index < points.length; index += 1) {
    commands.push(`L ${format(points[index].x)} ${format(points[index].y)}`)
  }

  if (closed) {
    commands.push('Z')
  }

  return commands.join(' ')
}
