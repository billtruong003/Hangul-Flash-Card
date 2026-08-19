/**
 * Grading a handwritten stroke against a reference stroke.
 *
 * The approach is hanzi-writer's (MIT), reimplemented rather than imported for
 * one concrete reason: hanzi-writer grades against *outline* paths, because a
 * Chinese brush stroke tapers along its length. Hangul in a Gothic face has an
 * even width, so a stroke can be described by its centreline alone. That makes
 * the reference data about five times cheaper to author — a polyline instead of
 * a closed outline — and lets this file stay a pure function with no rendering
 * concerns, which is what `lib/` is for here.
 *
 * A stroke has to clear five independent gates. Any one of them alone is easy
 * to fool: distance ignores direction, direction ignores position, shape
 * ignores scale, and length catches the stub someone draws by tapping.
 */

export type Point = readonly [number, number];
/** A stroke centreline in a 0–100 box, in the order it should be drawn. */
export type Stroke = readonly Point[];

export type StrokeMatchOptions = {
  /** A visible hint means the learner is tracing, so hold them to more. */
  hintVisible?: boolean;
};

/**
 * How a graded stroke should be reported back to the learner. It lives here
 * rather than with the pad that renders it: this is the presentation-free
 * reading of a `StrokeMatch`, produced and owned by the grading layer.
 */
export type StrokeFeedback = 'idle' | 'wrong' | 'backwards';

export type StrokeMatch = {
  isMatch: boolean;
  /** True when the shape was right but drawn end-to-start. */
  isBackwards: boolean;
  averageDistance: number;
};

/**
 * Thresholds carried over from hanzi-writer's 1024-unit space, divided by
 * 10.24 for the 0–100 box used here. They are deliberately forgiving: the goal
 * is teaching stroke order, not penalising an unsteady finger on a phone.
 */
const AVERAGE_DISTANCE_THRESHOLD = 34.2;
const START_END_DISTANCE_THRESHOLD = 24.4;
const LENGTH_OFFSET = 2.44;
/** Cosine similarity of travel direction; 0 means "not actively backwards". */
const DIRECTION_THRESHOLD = 0;
/** Fréchet distance between size-normalised curves, so it needs no scaling. */
const SHAPE_THRESHOLD = 0.4;
const MIN_LENGTH_RATIO = 0.35;
/**
 * A drawn stroke is compared at a few small rotations to forgive a tilt.
 * Untilted first: it is by far the common case, and the loop stops at the first
 * rotation that clears the bar rather than computing all five.
 */
const SHAPE_ROTATIONS = [0, Math.PI / 32, -Math.PI / 32, Math.PI / 16, -Math.PI / 16];
const RESAMPLE_POINTS = 24;

const subtract = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const distance = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

export function strokeLength(stroke: Stroke): number {
  let total = 0;
  for (let i = 1; i < stroke.length; i += 1) total += distance(stroke[i - 1], stroke[i]);
  return total;
}

function dropRepeats(points: Stroke): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) result.push(point);
  }
  return result;
}

/** Even spacing, so a slow wobble at one end cannot dominate the comparison. */
function resample(stroke: Stroke, count = RESAMPLE_POINTS): Point[] {
  const points = dropRepeats(stroke);
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: count }, () => points[0]);

  const total = strokeLength(points);
  if (total === 0) return Array.from({ length: count }, () => points[0]);

  const step = total / (count - 1);
  const result: Point[] = [points[0]];
  let segment = 1;
  let travelled = 0;

  for (let i = 1; i < count - 1; i += 1) {
    const target = i * step;
    while (
      segment < points.length - 1 &&
      travelled + distance(points[segment - 1], points[segment]) < target
    ) {
      travelled += distance(points[segment - 1], points[segment]);
      segment += 1;
    }
    const from = points[segment - 1];
    const to = points[segment];
    const segmentLength = distance(from, to) || 1;
    const ratio = Math.min(1, Math.max(0, (target - travelled) / segmentLength));
    result.push([from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio]);
  }

  result.push(points[points.length - 1]);
  return result;
}

/**
 * Centres an already-resampled curve on its centroid and scales it to unit RMS
 * radius. Takes resampled input on purpose — every caller already has it, and
 * resampling again inside here was pure rework.
 */
function normalize(points: Point[]): Point[] {
  if (points.length === 0) return [];

  const centre: Point = [
    average(points.map((point) => point[0])),
    average(points.map((point) => point[1])),
  ];
  const centred = points.map((point) => subtract(point, centre));
  const radius = Math.sqrt(average(centred.map(([x, y]) => x * x + y * y)));
  if (radius === 0) return centred;

  return centred.map(([x, y]) => [x / radius, y / radius] as Point);
}

function rotate(points: Point[], theta: number): Point[] {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return points.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos] as Point);
}

/** Discrete Fréchet distance — the classic "walking the dog" dynamic program. */
export function frechetDistance(a: Point[], b: Point[]): number {
  if (a.length === 0 || b.length === 0) return Infinity;

  let previous = new Float64Array(b.length);
  let current = new Float64Array(b.length);

  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      const direct = distance(a[i], b[j]);
      if (i === 0 && j === 0) current[j] = direct;
      else if (i === 0) current[j] = Math.max(current[j - 1], direct);
      else if (j === 0) current[j] = Math.max(previous[j], direct);
      else current[j] = Math.max(Math.min(previous[j], previous[j - 1], current[j - 1]), direct);
    }
    [previous, current] = [current, previous];
  }

  return previous[b.length - 1];
}

/**
 * Mean distance from each drawn point to the nearest point on the target.
 * Written as loops rather than `Math.min(...points.map(…))` because that form
 * allocates a throwaway array per drawn point, and this runs for every
 * candidate stroke of the character.
 */
function averageDistanceTo(points: Point[], target: Point[]): number {
  if (points.length === 0) return 0;
  let total = 0;
  for (const point of points) {
    let nearest = Infinity;
    for (const reference of target) {
      const gap = distance(point, reference);
      if (gap < nearest) nearest = gap;
    }
    total += nearest;
  }
  return total / points.length;
}

function edgesOf(points: Point[]): Point[] {
  const edges: Point[] = [];
  for (let i = 1; i < points.length; i += 1) edges.push(subtract(points[i], points[i - 1]));
  return edges;
}

function directionMatches(drawnEdges: Point[], referenceEdges: Point[]): boolean {
  if (drawnEdges.length === 0 || referenceEdges.length === 0) return false;

  let total = 0;
  for (const edge of drawnEdges) {
    const edgeLength = Math.hypot(edge[0], edge[1]) || 1;
    let best = -Infinity;
    for (const other of referenceEdges) {
      const otherLength = Math.hypot(other[0], other[1]) || 1;
      const similarity = (edge[0] * other[0] + edge[1] * other[1]) / (edgeLength * otherLength);
      if (similarity > best) best = similarity;
    }
    total += best;
  }

  return total / drawnEdges.length > DIRECTION_THRESHOLD;
}

/**
 * The answer is a boolean, so the loop stops at the first rotation that clears
 * the bar. Computing the minimum over all five and then comparing does the same
 * work four extra times, and the Fréchet DP is the most expensive gate here.
 */
function shapeMatches(drawnNormalized: Point[], referenceRotations: Point[][], leniency: number) {
  const limit = SHAPE_THRESHOLD * leniency;
  for (const rotation of referenceRotations) {
    if (frechetDistance(drawnNormalized, rotation) <= limit) return true;
  }
  return false;
}

/**
 * Everything about a stroke that grading needs and that does not depend on what
 * the learner drew. Reference strokes are module constants, so this is computed
 * once per stroke for the life of the tab.
 */
type Prepared = {
  points: Point[];
  length: number;
  edges: Point[];
  rotations: Point[][];
};

function prepareFrom(points: Point[]): Prepared {
  const normalized = normalize(points);
  return {
    points,
    length: strokeLength(points),
    edges: edgesOf(points),
    rotations: SHAPE_ROTATIONS.map((theta) => rotate(normalized, theta)),
  };
}

const preparedTargets = new WeakMap<Stroke, Prepared>();

function prepareTarget(target: Stroke): Prepared {
  const cached = preparedTargets.get(target);
  if (cached) return cached;
  const prepared = prepareFrom(resample(target));
  preparedTargets.set(target, prepared);
  return prepared;
}

function gradeAgainst(
  drawn: Prepared,
  drawnNormalized: Point[],
  reference: Prepared,
  hintVisible: boolean,
  leniency: number,
) {
  const averageDistance = averageDistanceTo(drawn.points, reference.points);
  // Tracing a visible outline should be held to a tighter tolerance than
  // recalling the stroke unaided.
  const distanceAllowance = AVERAGE_DISTANCE_THRESHOLD * (hintVisible ? 0.6 : 1) * leniency;
  if (averageDistance > distanceAllowance) return { isMatch: false, averageDistance };

  const last = drawn.points.length - 1;
  const referenceLast = reference.points.length - 1;
  const endsMatch =
    distance(drawn.points[0], reference.points[0]) <= START_END_DISTANCE_THRESHOLD * leniency &&
    distance(drawn.points[last], reference.points[referenceLast]) <=
      START_END_DISTANCE_THRESHOLD * leniency;

  const longEnough =
    (leniency * (drawn.length + LENGTH_OFFSET)) / (reference.length + LENGTH_OFFSET) >=
    MIN_LENGTH_RATIO;

  const isMatch =
    endsMatch &&
    longEnough &&
    directionMatches(drawn.edges, reference.edges) &&
    shapeMatches(drawnNormalized, reference.rotations, leniency);

  return { isMatch, averageDistance };
}

/**
 * Grades `userStroke` as the stroke at `index` of `target`.
 *
 * If a stroke the learner has not drawn yet is a *better* fit, this tightens
 * rather than rejects outright: someone whose ㅁ is wobbly should still be told
 * "not quite" instead of being failed for a stroke they drew correctly but out
 * of order — that case is what `isBackwards` and the ordering UI are for.
 */
export function matchStroke(
  userStroke: Stroke,
  target: readonly Stroke[],
  index: number,
  options: StrokeMatchOptions = {},
): StrokeMatch {
  const { hintVisible = false } = options;
  // resample() de-duplicates internally, so the raw points go straight in.
  const points = resample(userStroke);
  const expected = target[index];
  if (points.length < 2 || !expected) {
    return { isMatch: false, isBackwards: false, averageDistance: Infinity };
  }

  // The drawn stroke is fixed for this whole call, so it is prepared once and
  // reused across every candidate rather than re-derived per comparison.
  const drawn = prepareFrom(points);
  const drawnNormalized = normalize(points);
  const reference = prepareTarget(expected);

  const forward = gradeAgainst(drawn, drawnNormalized, reference, hintVisible, 1);

  if (!forward.isMatch) {
    const reversedPoints = [...points].reverse();
    const reversed = gradeAgainst(
      prepareFrom(reversedPoints),
      normalize(reversedPoints),
      reference,
      hintVisible,
      1,
    );
    return {
      isMatch: false,
      isBackwards: reversed.isMatch,
      averageDistance: forward.averageDistance,
    };
  }

  let closest = forward.averageDistance;
  for (let i = index + 1; i < target.length; i += 1) {
    const grade = gradeAgainst(drawn, drawnNormalized, prepareTarget(target[i]), hintVisible, 1);
    if (grade.isMatch && grade.averageDistance < closest) closest = grade.averageDistance;
  }

  if (closest < forward.averageDistance) {
    const adjustment = (0.6 * (closest + forward.averageDistance)) / (2 * forward.averageDistance);
    const stricter = gradeAgainst(drawn, drawnNormalized, reference, hintVisible, adjustment);
    return {
      isMatch: stricter.isMatch,
      isBackwards: false,
      averageDistance: forward.averageDistance,
    };
  }

  return { isMatch: true, isBackwards: false, averageDistance: forward.averageDistance };
}

/**
 * 0–100 for a finished character. Every stroke is worth the same, and a stroke
 * accepted only after a retry is worth half — so the score says "how much of
 * this did you know" rather than "did you eventually finish".
 */
export function scoreAttempt(strokes: readonly { attempts: number }[]): number {
  if (strokes.length === 0) return 0;
  const earned = strokes.reduce((sum, stroke) => sum + (stroke.attempts <= 1 ? 1 : 0.5), 0);
  return Math.round((earned / strokes.length) * 100);
}
