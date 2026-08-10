import { afterEach, describe, expect, it } from 'vitest';
import { recordAnalytics, restoreAnalytics } from '../test/fixtures';
import {
  bucketAccuracy,
  bucketAnswers,
  bucketAssisted,
  bucketMistakes,
  setAnalyticsTransport,
  trackCategoryChanged,
  trackCharacterMastered,
  trackChartOpened,
  trackQuizAnswer,
  trackReviewStarted,
  trackSessionCompleted,
  trackSessionStarted,
  trackTestModeStarted,
} from './analytics';

afterEach(restoreAnalytics);

describe('bucketing', () => {
  it('widens answer counts', () => {
    expect(bucketAnswers(1)).toBe('1-9');
    expect(bucketAnswers(9)).toBe('1-9');
    expect(bucketAnswers(10)).toBe('10-24');
    expect(bucketAnswers(24)).toBe('10-24');
    expect(bucketAnswers(25)).toBe('25-49');
    expect(bucketAnswers(49)).toBe('25-49');
    expect(bucketAnswers(50)).toBe('50+');
    expect(bucketAnswers(1200)).toBe('50+');
  });

  it('widens accuracy percentages', () => {
    expect(bucketAccuracy(0)).toBe('<50');
    expect(bucketAccuracy(49.9)).toBe('<50');
    expect(bucketAccuracy(50)).toBe('50-69');
    expect(bucketAccuracy(69.9)).toBe('50-69');
    expect(bucketAccuracy(70)).toBe('70-84');
    expect(bucketAccuracy(84.9)).toBe('70-84');
    expect(bucketAccuracy(85)).toBe('85+');
    expect(bucketAccuracy(100)).toBe('85+');
  });

  it('widens assisted counts', () => {
    expect(bucketAssisted(0)).toBe('0');
    expect(bucketAssisted(1)).toBe('1-4');
    expect(bucketAssisted(4)).toBe('1-4');
    expect(bucketAssisted(5)).toBe('5+');
  });

  it('widens mistake counts', () => {
    expect(bucketMistakes(1)).toBe('1-5');
    expect(bucketMistakes(5)).toBe('1-5');
    expect(bucketMistakes(6)).toBe('6-10');
    expect(bucketMistakes(10)).toBe('6-10');
    expect(bucketMistakes(11)).toBe('11+');
  });
});

describe('event payloads', () => {
  it('maps the internal quiz mode onto a stable direction name', () => {
    const events = recordAnalytics();

    trackQuizAnswer({
      mode: 'char-to-sound',
      category: 'basic-consonant',
      result: 'correct-unassisted',
      reviewMode: false,
      testMode: false,
    });
    trackQuizAnswer({
      mode: 'sound-to-char',
      category: 'compound-vowel',
      result: 'incorrect',
      reviewMode: true,
      testMode: true,
    });

    expect(events).toEqual([
      {
        name: 'quiz_answer',
        properties: {
          direction: 'character-to-sound',
          category: 'basic-consonant',
          result: 'correct-unassisted',
          reviewMode: false,
          testMode: false,
        },
      },
      {
        name: 'quiz_answer',
        properties: {
          direction: 'sound-to-character',
          category: 'compound-vowel',
          result: 'incorrect',
          reviewMode: true,
          testMode: true,
        },
      },
    ]);
  });

  it('never sends the Hangul character itself', () => {
    const events = recordAnalytics();
    trackQuizAnswer({
      mode: 'char-to-sound',
      category: 'basic-vowel',
      result: 'correct-assisted',
      reviewMode: false,
      testMode: false,
    });
    expect(JSON.stringify(events)).not.toMatch(/[㄰-㆏가-힯]/);
  });

  it('sends only the category for a mastered character', () => {
    const events = recordAnalytics();
    trackCharacterMastered('tense-consonant');
    expect(events).toEqual([
      { name: 'character_mastered', properties: { category: 'tense-consonant' } },
    ]);
  });

  it('reports the chart surface without any learner detail', () => {
    const events = recordAnalytics();
    trackChartOpened({ mode: 'sound-to-char', mobile: true });
    expect(events[0].properties).toEqual({ direction: 'sound-to-character', mobile: true });
  });

  it('buckets the mistake count instead of listing the characters', () => {
    const events = recordAnalytics();
    trackReviewStarted(7);
    expect(events[0]).toEqual({ name: 'review_started', properties: { mistakeBucket: '6-10' } });
  });

  it('sends test mode and session start with no properties at all', () => {
    const events = recordAnalytics();
    trackTestModeStarted();
    trackSessionStarted();
    expect(events).toEqual([
      { name: 'test_mode_started', properties: undefined },
      { name: 'learning_session_started', properties: undefined },
    ]);
  });

  it('buckets every number in the session summary', () => {
    const events = recordAnalytics();
    trackSessionCompleted({ answers: 30, correct: 24, assisted: 3 });
    expect(events[0]).toEqual({
      name: 'learning_session_completed',
      properties: { answers: '25-49', accuracy: '70-84', assisted: '1-4' },
    });
  });

  it('treats a session with no answers as zero accuracy rather than dividing by zero', () => {
    const events = recordAnalytics();
    trackSessionCompleted({ answers: 0, correct: 0, assisted: 0 });
    expect(events[0].properties).toEqual({ answers: '1-9', accuracy: '<50', assisted: '0' });
  });

  it('sends the category count, never the category list', () => {
    const events = recordAnalytics();
    trackCategoryChanged(3);
    expect(events[0]).toEqual({
      name: 'learning_categories_changed',
      properties: { enabledCount: 3 },
    });
  });
});

describe('transport safety', () => {
  it('stays silent by default under Vitest', () => {
    const events = recordAnalytics();
    restoreAnalytics();
    trackSessionStarted();
    expect(events).toHaveLength(0);
  });

  it('swallows a throwing transport', () => {
    setAnalyticsTransport(() => {
      throw new Error('beacon down');
    });
    expect(() => trackTestModeStarted()).not.toThrow();
  });

  it('stops emitting once the transport is removed', () => {
    const events = recordAnalytics();
    trackSessionStarted();
    setAnalyticsTransport(null);
    trackSessionStarted();
    expect(events).toHaveLength(1);
  });
});
