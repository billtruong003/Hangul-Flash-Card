import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { makeProgress } from '../test/fixtures';
import type { ProgressMap } from '../types';
import { HangulChart } from './HangulChart';

const noop = () => {};

function renderChart(overrides: Partial<Parameters<typeof HangulChart>[0]> = {}) {
  const onConsult = vi.fn();
  const onSpeak = vi.fn();
  render(
    <HangulChart
      progress={{}}
      highlightedId={null}
      canSpeak={false}
      onConsult={onConsult}
      onSpeak={onSpeak}
      {...overrides}
    />,
  );
  return { onConsult, onSpeak };
}

function cell(name: RegExp | string) {
  return screen.getByRole('button', { name });
}

describe('HangulChart', () => {
  it('groups every character under its category heading', () => {
    renderChart();
    for (const label of ['Phụ âm cơ bản', 'Nguyên âm cơ bản', 'Phụ âm căng', 'Nguyên âm ghép']) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button')).toHaveLength(40);
  });

  it('reports a consult when a character is clicked', () => {
    const { onConsult } = renderChart();
    fireEvent.click(cell(/^ㄴ, đọc là n$/));
    expect(onConsult).toHaveBeenCalled();
  });

  it('reports a consult when a character merely receives focus', () => {
    const { onConsult } = renderChart();
    cell(/^ㄴ, đọc là n$/).focus();
    expect(onConsult).toHaveBeenCalledTimes(1);
  });

  it('shows the pronunciation and explanation of the selected character', () => {
    renderChart();
    expect(screen.queryByText(/Đứng đầu âm tiết/)).not.toBeInTheDocument();

    fireEvent.click(cell(/^ㅇ, đọc là câm\/ng$/));

    expect(screen.getByText(/Đứng đầu âm tiết: không phát âm/)).toBeInTheDocument();
    expect(cell(/^ㅇ, đọc là câm\/ng$/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('asks for Korean speech when a character is selected', () => {
    const { onSpeak } = renderChart();
    fireEvent.click(cell(/^ㄴ, đọc là n$/));
    expect(onSpeak).toHaveBeenCalledWith('ㄴ');
  });

  it('marks mastered characters in their accessible name, not just by colour', () => {
    const progress: ProgressMap = {
      'c-n': makeProgress({
        shownCount: 5,
        unassistedCorrectCount: 5,
        currentUnassistedCorrectStreak: 5,
      }),
    };
    renderChart({ progress, onConsult: noop, onSpeak: noop });

    expect(cell(/^ㄴ, đọc là n, đã thuộc$/)).toBeInTheDocument();
    expect(cell(/^ㄱ, đọc là g\/k$/)).toBeInTheDocument();
  });

  it('marks the character being asked when the tab may reveal it', () => {
    renderChart({ highlightedId: 'c-n' });
    expect(cell(/^ㄴ, đọc là n, đang được hỏi$/)).toBeInTheDocument();
  });

  it('marks nothing when the caller withholds the highlighted id', () => {
    renderChart({ highlightedId: null });
    expect(screen.queryByRole('button', { name: /đang được hỏi/ })).not.toBeInTheDocument();
  });
});
