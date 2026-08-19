import { useCallback, useRef, useState } from 'react';
import type { Point, Stroke, StrokeFeedback } from '../lib/stroke';

type StrokePadProps = {
  strokes: Stroke[];
  /** How many strokes are already done, which is also the index of the next. */
  completed: number;
  /** Faint guide for the stroke due now. Off means writing from memory. */
  showHint: boolean;
  feedback: StrokeFeedback;
  /** Non-null while the demo animation is running: strokes drawn so far. */
  demoStroke: number | null;
  label: string;
  onStrokeDrawn: (points: Point[]) => void;
};

const toPath = (stroke: Stroke): string =>
  stroke.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

export function StrokePad({
  strokes,
  completed,
  showHint,
  feedback,
  demoStroke,
  label,
  onStrokeDrawn,
}: StrokePadProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drawing, setDrawing] = useState<Point[] | null>(null);
  const isDemo = demoStroke !== null;

  /** Screen coordinates → the 0–100 box the stroke data lives in. */
  const toLocal = useCallback((event: React.PointerEvent): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return null;
    return [
      ((event.clientX - box.left) / box.width) * 100,
      ((event.clientY - box.top) / box.height) * 100,
    ];
  }, []);

  const handleDown = (event: React.PointerEvent) => {
    if (isDemo || completed >= strokes.length) return;
    const point = toLocal(event);
    if (!point) return;
    // Capture so a finger that slides off the pad still finishes the stroke
    // here rather than silently abandoning it.
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawing([point]);
  };

  const handleMove = (event: React.PointerEvent) => {
    if (!drawing) return;
    const point = toLocal(event);
    if (point) setDrawing((current) => (current ? [...current, point] : current));
  };

  const handleUp = () => {
    if (!drawing) return;
    const points = drawing;
    setDrawing(null);
    if (points.length >= 2) onStrokeDrawn(points);
  };

  const guideTone =
    feedback === 'wrong'
      ? 'stroke-rose-400 dark:stroke-rose-500'
      : feedback === 'backwards'
        ? 'stroke-amber-400 dark:stroke-amber-500'
        : 'stroke-slate-300 dark:stroke-slate-600';

  const visibleCount = isDemo ? demoStroke : completed;
  const nextStroke = strokes[completed];
  const showGuide = !isDemo && showHint && nextStroke !== undefined;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      role="application"
      aria-label={label}
      className={[
        'aspect-square w-full touch-none rounded-2xl border bg-white select-none',
        feedback === 'wrong'
          ? 'animate-shake border-rose-300 dark:border-rose-700'
          : 'border-slate-200 dark:border-slate-700',
        'dark:bg-slate-950',
      ].join(' ')}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      {/* Quarter guides, so the learner can judge proportion. */}
      <path
        d="M50 4 V96 M4 50 H96"
        className="stroke-slate-100 dark:stroke-slate-800"
        strokeWidth="0.8"
        strokeDasharray="3 3"
      />

      {showGuide && (
        <>
          <path
            d={toPath(nextStroke)}
            fill="none"
            className={guideTone}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.45"
          />
          {/* Where to put the pen down. */}
          <circle
            cx={nextStroke[0][0]}
            cy={nextStroke[0][1]}
            r="3.4"
            className="fill-sky-500"
            opacity="0.9"
          />
          <text
            x={nextStroke[0][0]}
            y={nextStroke[0][1] + 1.6}
            textAnchor="middle"
            className="fill-white"
            style={{ fontSize: '4.4px', fontWeight: 700 }}
          >
            {completed + 1}
          </text>
        </>
      )}

      {strokes.slice(0, visibleCount).map((stroke, index) => (
        <path
          key={index}
          d={toPath(stroke)}
          fill="none"
          className="stroke-slate-800 dark:stroke-slate-100"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {drawing && drawing.length >= 2 && (
        <path
          d={toPath(drawing)}
          fill="none"
          className="stroke-sky-500"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
      )}
    </svg>
  );
}
