import { useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_ORDER, HANGUL_CHARACTERS } from '../data/hangul';
import { isMastered } from '../lib/progress';
import { SLOW_RATE } from '../lib/speech';
import type { HangulCharacter, ProgressMap } from '../types';
import { CheckIcon, SpeakerIcon } from './icons';

type HangulChartProps = {
  progress: ProgressMap;
  /**
   * The character currently being asked, or null when marking it would give the
   * answer away — which is the case for the "Âm → Chữ" tab.
   */
  highlightedId: string | null;
  canSpeak: boolean;
  /** Any interaction with the chart counts as consulting it. */
  onConsult: () => void;
  /** Takes a spoken form — always a real syllable, never a bare jamo. */
  onSpeak: (text: string, options?: { rate?: number }) => void;
};

function cellLabel(
  character: HangulCharacter,
  mastered: boolean,
  highlighted: boolean,
  canSpeak: boolean,
): string {
  const parts = [`${character.character}, đọc là ${character.romaja}`];
  if (canSpeak) parts.push('chạm để nghe');
  if (mastered) parts.push('đã thuộc');
  if (highlighted) parts.push('đang được hỏi');
  return parts.join(', ');
}

export function HangulChart({
  progress,
  highlightedId,
  canSpeak,
  onConsult,
  onSpeak,
}: HangulChartProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = HANGUL_CHARACTERS.find((character) => character.id === selectedId) ?? null;

  const select = (character: HangulCharacter) => {
    onConsult();
    setSelectedId(character.id);
    onSpeak(character.demoSyllable);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        {CATEGORY_ORDER.map((category) => (
          <section key={category} aria-label={CATEGORY_LABELS[category]}>
            <h3 className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 lg:grid-cols-5">
              {HANGUL_CHARACTERS.filter((character) => character.category === category).map(
                (character) => {
                  const mastered = isMastered(progress[character.id]);
                  const highlighted = character.id === highlightedId;
                  const isSelected = character.id === selectedId;

                  return (
                    <button
                      key={character.id}
                      type="button"
                      onClick={() => select(character)}
                      onFocus={onConsult}
                      aria-pressed={isSelected}
                      aria-label={cellLabel(character, mastered, highlighted, canSpeak)}
                      className={[
                        'relative flex min-h-[3.25rem] flex-col items-center justify-center rounded-lg border px-0.5 py-1 transition-colors',
                        isSelected
                          ? 'border-sky-600 bg-sky-100 dark:border-sky-400 dark:bg-sky-950'
                          : highlighted
                            ? 'border-sky-500 border-dashed bg-sky-50 dark:border-sky-500 dark:bg-sky-950/40'
                            : 'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500 dark:hover:bg-slate-800',
                      ].join(' ')}
                    >
                      {mastered && (
                        <CheckIcon className="absolute top-0.5 right-0.5 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {/* The whole cell is the tap target — a nested button
                          would be invalid markup — so this is a hint, not a
                          control. The accessible name carries it for others. */}
                      {canSpeak && (
                        <SpeakerIcon
                          aria-hidden="true"
                          className="absolute top-0.5 left-0.5 h-3 w-3 text-slate-400 dark:text-slate-500"
                        />
                      )}
                      <span className="font-hangul text-xl leading-none font-medium" lang="ko">
                        {character.character}
                      </span>
                      <span className="mt-0.5 w-full truncate text-center text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                        {character.romaja}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </section>
        ))}
      </div>

      <div
        aria-live="polite"
        className="min-h-[4.5rem] shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60"
      >
        {selected ? (
          <div className="flex items-start gap-3">
            <span className="font-hangul text-3xl leading-none font-medium" lang="ko">
              {selected.character}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-semibold">
                {selected.romaja}
                {canSpeak && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onConsult();
                        onSpeak(selected.demoSyllable);
                      }}
                      aria-label={`Nghe phát âm chữ ${selected.character}`}
                      className="rounded-full p-1 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                    >
                      <SpeakerIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onConsult();
                        onSpeak(selected.demoSyllable, { rate: SLOW_RATE });
                      }}
                      aria-label={`Nghe chậm chữ ${selected.character}`}
                      className="rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 transition-colors hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
                    >
                      Chậm
                    </button>
                  </>
                )}
                <span className="font-hangul text-xs font-normal text-slate-400 dark:text-slate-500">
                  {selected.demoSyllable}
                </span>
              </p>
              {selected.explanation && (
                <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-300">
                  {selected.explanation}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
            Chạm vào một chữ để xem cách đọc và ghi chú. Câu trả lời sau khi tra bảng sẽ được tính
            là
            <span className="font-semibold"> có trợ giúp</span>.
          </p>
        )}
      </div>
    </div>
  );
}
