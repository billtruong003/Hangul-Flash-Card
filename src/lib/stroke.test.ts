import { describe, expect, it } from 'vitest';
import { HANGUL_CHARACTERS } from '../data/hangul';
import { STROKES } from '../data/strokes';
import { frechetDistance, matchStroke, scoreAttempt, strokeLength, type Stroke } from './stroke';

/** Walks a stroke, adding a little jitter, the way a finger would. */
function trace(stroke: Stroke, jitter = 0, samples = 30): Stroke {
  const points: [number, number][] = [];
  const total = strokeLength(stroke);

  for (let i = 0; i < samples; i += 1) {
    const target = (i / (samples - 1)) * total;
    let travelled = 0;
    let point: [number, number] = [stroke[0][0], stroke[0][1]];

    for (let s = 1; s < stroke.length; s += 1) {
      const segment = Math.hypot(stroke[s][0] - stroke[s - 1][0], stroke[s][1] - stroke[s - 1][1]);
      if (travelled + segment >= target || s === stroke.length - 1) {
        const ratio = segment === 0 ? 0 : Math.min(1, (target - travelled) / segment);
        point = [
          stroke[s - 1][0] + (stroke[s][0] - stroke[s - 1][0]) * ratio,
          stroke[s - 1][1] + (stroke[s][1] - stroke[s - 1][1]) * ratio,
        ];
        break;
      }
      travelled += segment;
    }

    // Deterministic wobble — a seeded shape rather than Math.random, so a
    // failure here is always reproducible.
    const wobble = Math.sin(i * 1.7) * jitter;
    points.push([point[0] + wobble, point[1] - wobble]);
  }

  return points;
}

const VERTICAL: Stroke = [
  [50, 12],
  [50, 88],
];
const HORIZONTAL: Stroke = [
  [14, 50],
  [86, 50],
];

describe('frechetDistance', () => {
  it('is zero for a curve against itself', () => {
    expect(frechetDistance([...VERTICAL], [...VERTICAL])).toBe(0);
  });

  it('grows with how far apart the curves run', () => {
    const near = frechetDistance(
      [...VERTICAL],
      [
        [52, 12],
        [52, 88],
      ],
    );
    const far = frechetDistance(
      [...VERTICAL],
      [
        [90, 12],
        [90, 88],
      ],
    );
    expect(near).toBeLessThan(far);
  });
});

describe('matchStroke', () => {
  it('accepts a clean trace of the expected stroke', () => {
    expect(matchStroke(trace(VERTICAL), [VERTICAL], 0).isMatch).toBe(true);
  });

  it('accepts a shaky trace, because fingers are shaky', () => {
    expect(matchStroke(trace(VERTICAL, 3), [VERTICAL], 0).isMatch).toBe(true);
  });

  it('rejects a stroke drawn somewhere else entirely', () => {
    expect(matchStroke(trace(HORIZONTAL), [VERTICAL], 0).isMatch).toBe(false);
  });

  it('rejects a stroke drawn end to start, and says so', () => {
    const backwards = [...trace(VERTICAL)].reverse();
    const result = matchStroke(backwards, [VERTICAL], 0);

    expect(result.isMatch).toBe(false);
    // The difference between "wrong shape" and "right shape, wrong direction"
    // is the whole point of practising order rather than appearance.
    expect(result.isBackwards).toBe(true);
  });

  it('rejects a tap or a stub that never travels', () => {
    expect(matchStroke([[50, 50]], [VERTICAL], 0).isMatch).toBe(false);
    expect(
      matchStroke(
        [
          [50, 48],
          [50, 52],
        ],
        [VERTICAL],
        0,
      ).isMatch,
    ).toBe(false);
  });

  it('rejects a stroke that stops less than a third of the way', () => {
    const short: Stroke = [
      [50, 12],
      [50, 30],
    ];
    expect(matchStroke(trace(short), [VERTICAL], 0).isMatch).toBe(false);
  });

  it('rejects the second stroke of ㅁ when the first is expected', () => {
    const mieum = STROKES['c-m'];
    expect(matchStroke(trace(mieum[1]), mieum, 0).isMatch).toBe(false);
  });

  it('accepts each stroke of ㅁ at its own position', () => {
    const mieum = STROKES['c-m'];
    for (let i = 0; i < mieum.length; i += 1) {
      expect(matchStroke(trace(mieum[i]), mieum, i).isMatch, `stroke ${i + 1}`).toBe(true);
    }
  });

  it('accepts the circle of ㅇ but not the same circle drawn the other way', () => {
    const ieung = STROKES['c-ng'];
    expect(matchStroke(trace(ieung[0]), ieung, 0).isMatch).toBe(true);

    const clockwise = [...trace(ieung[0])].reverse();
    expect(matchStroke(clockwise, ieung, 0).isMatch).toBe(false);
  });
});

describe('every letter can be traced from its own data', () => {
  it.each(HANGUL_CHARACTERS.map((character) => [character.id, character.character]))(
    '%s (%s)',
    (id) => {
      const strokes = STROKES[id];
      expect(strokes, id).toBeDefined();
      for (let i = 0; i < strokes.length; i += 1) {
        expect(
          matchStroke(trace(strokes[i], 1.5), strokes, i).isMatch,
          `${id} stroke ${i + 1}`,
        ).toBe(true);
      }
    },
  );
});

describe('the stroke data', () => {
  it('covers all 40 letters and nothing else', () => {
    expect(Object.keys(STROKES).sort()).toEqual(
      HANGUL_CHARACTERS.map((character) => character.id).sort(),
    );
  });

  it('keeps every point inside the 0–100 box', () => {
    for (const [id, strokes] of Object.entries(STROKES)) {
      for (const stroke of strokes) {
        for (const [x, y] of stroke) {
          expect(x, id).toBeGreaterThanOrEqual(0);
          expect(x, id).toBeLessThanOrEqual(100);
          expect(y, id).toBeGreaterThanOrEqual(0);
          expect(y, id).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('gives every stroke real length, so none is a stray dot', () => {
    for (const [id, strokes] of Object.entries(STROKES)) {
      expect(strokes.length, id).toBeGreaterThan(0);
      for (const stroke of strokes) {
        expect(stroke.length, id).toBeGreaterThanOrEqual(2);
        expect(strokeLength(stroke), id).toBeGreaterThan(10);
      }
    }
  });

  it('writes a tense consonant as its base letter twice', () => {
    const doubled: [string, string][] = [
      ['t-kk', 'c-g'],
      ['t-tt', 'c-d'],
      ['t-pp', 'c-b'],
      ['t-ss', 'c-s'],
      ['t-jj', 'c-j'],
    ];
    for (const [tense, base] of doubled) {
      expect(STROKES[tense], tense).toHaveLength(STROKES[base].length * 2);
    }
  });

  it('matches the stroke counts Korean handwriting actually uses', () => {
    const expected: Record<string, number> = {
      'c-g': 1,
      'c-n': 1,
      'c-d': 2,
      'c-r': 3,
      'c-m': 3,
      'c-b': 4,
      'c-s': 2,
      'c-ng': 1,
      'c-p': 4,
      'v-eu': 1,
      'v-i': 1,
      'v-a': 2,
      'v-ya': 3,
    };
    for (const [id, count] of Object.entries(expected)) {
      expect(STROKES[id], id).toHaveLength(count);
    }
  });
});

describe('scoreAttempt', () => {
  it('gives full marks when nothing needed a second try', () => {
    expect(scoreAttempt([{ attempts: 1 }, { attempts: 1 }])).toBe(100);
  });

  it('halves a stroke that took more than one go', () => {
    expect(scoreAttempt([{ attempts: 1 }, { attempts: 3 }])).toBe(75);
    expect(scoreAttempt([{ attempts: 2 }, { attempts: 2 }])).toBe(50);
  });

  it('is zero for nothing drawn', () => {
    expect(scoreAttempt([])).toBe(0);
  });
});
