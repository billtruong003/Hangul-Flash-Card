import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { CORRECT_DELAY_MS } from './hooks/useQuiz';
import {
  answerCorrectly,
  answerIncorrectly,
  buttonsSplitByCorrectness,
  chartToggle,
  openChart,
  openSettings,
  readStoredState,
  seedConsonantProgress,
  seedNearlyMasteredConsonants,
  gotoSection,
} from './test/appHarness';
import {
  breakAnalytics,
  eventNames,
  eventsNamed,
  recordAnalytics,
  type RecordedEvent,
} from './test/fixtures';

let events: RecordedEvent[];

beforeEach(() => {
  events = recordAnalytics();
});

afterEach(() => {
  vi.useRealTimers();
});

function quizAnswers() {
  return eventsNamed(events, 'quiz_answer');
}

describe('quiz_answer', () => {
  it('emits exactly one event per answered question', () => {
    render(<App />);
    answerCorrectly();

    expect(quizAnswers()).toHaveLength(1);
    expect(quizAnswers()[0].properties).toMatchObject({
      direction: 'character-to-sound',
      result: 'correct-unassisted',
      reviewMode: false,
      testMode: false,
    });
  });

  it('does not duplicate the event when React rerenders', () => {
    const { rerender } = render(<App />);
    answerCorrectly();
    expect(quizAnswers()).toHaveLength(1);

    rerender(<App />);
    rerender(<App />);
    openSettings();

    expect(quizAnswers()).toHaveLength(1);
  });

  it('reports the assisted result after the chart was consulted', () => {
    render(<App />);
    openChart();
    answerCorrectly();

    expect(quizAnswers()).toHaveLength(1);
    expect(quizAnswers()[0].properties).toMatchObject({ result: 'correct-assisted' });
  });

  it('reports a wrong answer as incorrect', () => {
    render(<App />);
    answerIncorrectly();
    expect(quizAnswers()[0].properties).toMatchObject({ result: 'incorrect' });
  });

  it('reports the direction of the reverse tab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Âm → Chữ' }));
    answerCorrectly();

    expect(quizAnswers()[0].properties).toMatchObject({ direction: 'sound-to-character' });
  });

  it('flags answers given inside review mode and test mode', () => {
    vi.useFakeTimers();
    render(<App />);

    answerIncorrectly();
    act(() => void vi.advanceTimersByTime(2000));
    fireEvent.keyDown(window, { key: 'r' });
    answerCorrectly();

    expect(quizAnswers()[1].properties).toMatchObject({ reviewMode: true, testMode: false });
  });

  it('never leaks the character or the learner history', () => {
    render(<App />);
    answerCorrectly();

    expect(Object.keys(quizAnswers()[0].properties ?? {}).sort()).toEqual([
      'category',
      'direction',
      'result',
      'reviewMode',
      'testMode',
    ]);
  });
});

describe('character_mastered', () => {
  it('fires once on the transition into mastery', () => {
    seedNearlyMasteredConsonants();
    render(<App />);
    answerCorrectly();

    expect(eventsNamed(events, 'character_mastered')).toHaveLength(1);
    expect(eventsNamed(events, 'character_mastered')[0].properties).toEqual({
      category: 'basic-consonant',
    });
  });

  it('stays quiet when an already mastered character is answered again', () => {
    seedConsonantProgress(5);
    render(<App />);
    answerCorrectly();

    expect(quizAnswers()).toHaveLength(1);
    expect(eventsNamed(events, 'character_mastered')).toHaveLength(0);
  });

  it('stays quiet when the answer was assisted', () => {
    seedNearlyMasteredConsonants();
    render(<App />);
    openChart();
    answerCorrectly();

    expect(eventsNamed(events, 'character_mastered')).toHaveLength(0);
  });
});

describe('chart_opened', () => {
  it('fires once per deliberate opening, not per rerender', () => {
    const { rerender } = render(<App />);

    openChart();
    rerender(<App />);
    rerender(<App />);
    expect(eventsNamed(events, 'chart_opened')).toHaveLength(1);

    fireEvent.click(chartToggle());
    rerender(<App />);
    expect(eventsNamed(events, 'chart_opened')).toHaveLength(1);

    openChart();
    expect(eventsNamed(events, 'chart_opened')).toHaveLength(2);
  });

  it('reports the surface the chart opened on', () => {
    render(<App />);
    openChart();
    expect(eventsNamed(events, 'chart_opened')[0].properties).toEqual({
      direction: 'character-to-sound',
      mobile: true,
    });
  });

  it('stays quiet when test mode has locked the chart', () => {
    render(<App />);
    openSettings();
    fireEvent.click(screen.getByRole('checkbox', { name: /Ẩn bảng trong chế độ kiểm tra/ }));

    fireEvent.click(chartToggle());
    expect(eventsNamed(events, 'chart_opened')).toHaveLength(0);
  });
});

describe('review_started', () => {
  it('fires only when review mode is entered', () => {
    vi.useFakeTimers();
    const { rerender } = render(<App />);

    answerIncorrectly();
    act(() => void vi.advanceTimersByTime(2000));
    expect(eventsNamed(events, 'review_started')).toHaveLength(0);

    fireEvent.keyDown(window, { key: 'r' });
    expect(eventsNamed(events, 'review_started')).toHaveLength(1);

    rerender(<App />);
    expect(eventsNamed(events, 'review_started')).toHaveLength(1);

    // Leaving review mode is not a new start.
    fireEvent.keyDown(window, { key: 'r' });
    expect(eventsNamed(events, 'review_started')).toHaveLength(1);

    fireEvent.keyDown(window, { key: 'r' });
    expect(eventsNamed(events, 'review_started')).toHaveLength(2);
  });

  it('buckets how many characters are waiting to be reviewed', () => {
    vi.useFakeTimers();
    render(<App />);

    answerIncorrectly();
    act(() => void vi.advanceTimersByTime(2000));
    fireEvent.keyDown(window, { key: 'r' });

    expect(eventsNamed(events, 'review_started')[0].properties).toEqual({ mistakeBucket: '1-5' });
  });
});

describe('test_mode_started', () => {
  it('fires only when test mode is switched on', () => {
    const { rerender } = render(<App />);
    openSettings();
    const toggle = screen.getByRole('checkbox', { name: /Ẩn bảng trong chế độ kiểm tra/ });

    fireEvent.click(toggle);
    expect(eventsNamed(events, 'test_mode_started')).toHaveLength(1);

    rerender(<App />);
    expect(eventsNamed(events, 'test_mode_started')).toHaveLength(1);

    fireEvent.click(toggle);
    expect(eventsNamed(events, 'test_mode_started')).toHaveLength(1);

    fireEvent.click(toggle);
    expect(eventsNamed(events, 'test_mode_started')).toHaveLength(2);
  });
});

describe('learning_categories_changed', () => {
  it('sends only how many categories are now enabled', () => {
    render(<App />);
    openSettings();

    fireEvent.click(screen.getByRole('checkbox', { name: /Phụ âm căng/ }));
    expect(eventsNamed(events, 'learning_categories_changed')[0].properties).toEqual({
      enabledCount: 3,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Nguyên âm cơ bản/ }));
    expect(eventsNamed(events, 'learning_categories_changed')[1].properties).toEqual({
      enabledCount: 2,
    });
  });

  it('stays quiet when the last category cannot be switched off', () => {
    render(<App />);
    openSettings();
    fireEvent.click(screen.getByRole('checkbox', { name: /Nguyên âm cơ bản/ }));
    expect(eventsNamed(events, 'learning_categories_changed')).toHaveLength(1);

    fireEvent.click(screen.getByRole('checkbox', { name: /Phụ âm cơ bản/ }));
    expect(eventsNamed(events, 'learning_categories_changed')).toHaveLength(1);
  });
});

describe('learning session', () => {
  function restartSession() {
    fireEvent.click(
      screen.getByRole('button', { name: 'Bắt đầu lại phiên học, giữ nguyên tiến độ dài hạn' }),
    );
  }

  it('starts on the first answer only', () => {
    vi.useFakeTimers();
    render(<App />);
    expect(eventNames(events)).not.toContain('learning_session_started');

    answerCorrectly();
    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));
    answerCorrectly();

    expect(eventsNamed(events, 'learning_session_started')).toHaveLength(1);
  });

  it('completes on an explicit restart and buckets the summary', () => {
    vi.useFakeTimers();
    render(<App />);

    answerCorrectly();
    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));
    openChart();
    answerCorrectly();
    act(() => void vi.advanceTimersByTime(CORRECT_DELAY_MS + 50));

    restartSession();

    const completed = eventsNamed(events, 'learning_session_completed');
    expect(completed).toHaveLength(1);
    expect(completed[0].properties).toEqual({
      answers: '1-9',
      accuracy: '50-69',
      assisted: '1-4',
    });
  });

  it('does not complete a session that never had an answer', () => {
    render(<App />);
    restartSession();
    restartSession();

    expect(eventNames(events)).not.toContain('learning_session_completed');
  });

  it('starts a fresh session after a restart', () => {
    render(<App />);
    answerCorrectly();
    restartSession();
    answerCorrectly();

    expect(eventsNamed(events, 'learning_session_started')).toHaveLength(2);
    expect(eventsNamed(events, 'learning_session_completed')).toHaveLength(1);
  });

  it('completes the session when progress is wiped', () => {
    render(<App />);
    answerCorrectly();

    fireEvent.click(screen.getByRole('button', { name: 'Xóa toàn bộ tiến độ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tiến độ' }));

    expect(eventsNamed(events, 'learning_session_completed')).toHaveLength(1);
  });
});

describe('analytics failures', () => {
  it('never reaches the quiz when the transport throws', () => {
    breakAnalytics();
    render(<App />);

    const character = buttonsSplitByCorrectness();
    expect(() => fireEvent.click(character.correct)).not.toThrow();

    expect(screen.getByText('Chính xác')).toBeInTheDocument();
    expect(Object.keys(readStoredState().progress)).toHaveLength(1);
  });

  it('never reaches the chart, review or settings controls', () => {
    breakAnalytics();
    render(<App />);

    expect(() => openChart()).not.toThrow();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    expect(() => fireEvent.keyDown(window, { key: 'r' })).not.toThrow();
    expect(screen.getByText('Chưa có chữ nào sai')).toBeInTheDocument();

    openSettings();
    expect(() =>
      fireEvent.click(screen.getByRole('checkbox', { name: /Phụ âm căng/ })),
    ).not.toThrow();
    expect(readStoredState().settings.enabledCategories).toHaveLength(3);
  });
});

describe('section_changed', () => {
  it('fires once per move, with the surface that was opened', () => {
    render(<App />);

    gotoSection('Nghe');
    gotoSection('Viết');

    expect(eventsNamed(events, 'section_changed').map((event) => event.properties)).toEqual([
      { section: 'listening' },
      { section: 'writing' },
    ]);
  });

  it('stays quiet when the learner taps the surface they are already on', () => {
    render(<App />);

    gotoSection('Học chữ');

    expect(eventNames(events)).not.toContain('section_changed');
  });

  it('does not add the surface to quiz_answer', () => {
    // quiz_answer only ever fires from the letters surface, so widening its
    // payload would carry a constant on every single answer.
    render(<App />);
    answerCorrectly();

    const [answer] = eventsNamed(events, 'quiz_answer');
    expect(Object.keys(answer.properties ?? {}).sort()).toEqual([
      'category',
      'direction',
      'result',
      'reviewMode',
      'testMode',
    ]);
  });
});
