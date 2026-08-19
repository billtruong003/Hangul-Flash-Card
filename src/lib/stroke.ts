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
  /** Above 1 is more forgiving. */
  leniency?: number;
  /** A visible hint means the learner is tracing, so hold them to more. */
  hintVisible?: boolean;
};

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
/** A drawn stroke is compared at a few small rotations to forgive a tilt. */
const SHAPE_ROTATIONS = [Math.PI / 16, Math.PI / 32, 0, -Math.PI / 32, -Math.PI / 16];
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

/** Centres a curve on its centroid and scales it to unit RMS radius. */
function normalize(stroke: Stroke): Point[] {
  const points = resample(stroke);
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

/** Mean distance from each drawn point to the nearest point on the target. */
function averageDistanceTo(points: Point[], target: Point[]): number {
  return average(
    points.map((point) => Math.min(...target.map((reference) => distance(point, reference)))),
  );
}

function directionMatches(points: Point[], target: Point[]): boolean {
  const edges = (list: Point[]) =>
    list.slice(1).map((point, index) => subtract(point, list[index]));

  const drawn = edges(points);
  const reference = edges(target);
  if (drawn.length === 0 || reference.length === 0) return false;

  const similarities = drawn.map((edge) => {
    const edgeLength = Math.hypot(edge[0], edge[1]) || 1;
    return Math.max(
      ...reference.map((other) => {
        const otherLength = Math.hypot(other[0], other[1]) || 1;
        return (edge[0] * other[0] + edge[1] * other[1]) / (edgeLength * otherLength);
      }),
    );
  });

  return average(similarities) > DIRECTION_THRESHOLD;
}

function shapeMatches(points: Point[], target: Point[], leniency: number): boolean {
  const drawn = normalize(points);
  const reference = normalize(target);
  const best = Math.min(
    ...SHAPE_ROTATIONS.map((theta) => frechetDistance(drawn, rotate(reference, theta))),
  );
  return best <= SHAPE_THRESHOLD * leniency;
}

function gradeAgainst(drawn: Point[], target: Stroke, options: StrokeMatchOptions) {
  const { leniency = 1, hintVisible = false } = options;
  const reference = resample(target);

  const averageDistance = averageDistanceTo(drawn, reference);
  // Tracing a visible outline should be held to a tighter tolerance than
  // recalling the stroke unaided.
  const distanceAllowance = AVERAGE_DISTANCE_THRESHOLD * (hintVisible ? 0.6 : 1) * leniency;
  if (averageDistance > distanceAllowance) return { isMatch: false, averageDistance };

  const endsMatch =
    distance(drawn[0], reference[0]) <= START_END_DISTANCE_THRESHOLD * leniency &&
    distance(drawn[drawn.length - 1], reference[reference.length - 1]) <=
      START_END_DISTANCE_THRESHOLD * leniency;

  const longEnough =
    (leniency * (strokeLength(drawn) + LENGTH_OFFSET)) /
      (strokeLength(reference) + LENGTH_OFFSET) >=
    MIN_LENGTH_RATIO;

  const isMatch =
    endsMatch &&
    longEnough &&
    directionMatches(drawn, reference) &&
    shapeMatches(drawn, reference, leniency);

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
  const drawn = resample(dropRepeats(userStroke));
  const expected = target[index];
  if (drawn.length < 2 || !expected) {
    return { isMatch: false, isBackwards: false, averageDistance: Infinity };
  }

  const forward = gradeAgainst(drawn, expected, options);

  if (!forward.isMatch) {
    const reversed = gradeAgainst([...drawn].reverse(), expected, options);
    return {
      isMatch: false,
      isBackwards: reversed.isMatch,
      averageDistance: forward.averageDistance,
    };
  }

  let closest = forward.averageDistance;
  for (const later of target.slice(index + 1)) {
    const grade = gradeAgainst(drawn, later, options);
    if (grade.isMatch && grade.averageDistance < closest) closest = grade.averageDistance;
  }

  if (closest < forward.averageDistance) {
    const adjustment = (0.6 * (closest + forward.averageDistance)) / (2 * forward.averageDistance);
    const stricter = gradeAgainst(drawn, expected, {
      ...options,
      leniency: (options.leniency ?? 1) * adjustment,
    });
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
