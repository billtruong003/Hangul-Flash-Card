import type { Dispatch, SetStateAction } from 'react';
import { CheckIcon, CrossIcon, RefreshIcon, SpeakerIcon } from '../components/icons';
import { useSyllableBuilder } from '../hooks/useSyllableBuilder';
import {
  POSSIBLE_FINALS,
  POSSIBLE_INITIALS,
  POSSIBLE_MEDIALS,
  romanizeKorean,
} from '../lib/syllable';
import type { HangulCharacter, PersistedState } from '../types';

type SyllableSectionProps = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
  canSpeak: boolean;
  onSpeak: (text: string) => void;
};

type PickerProps = {
  legend: string;
  options: HangulCharacter[];
  selectedId: string | null;
  /** Adds a "no final consonant" choice, which is a real answer, not a blank. */
  allowNone?: boolean;
  disabled: boolean;
  onSelect: (id: string | null) => void;
};

function Picker({ legend, options, selectedId, allowNone, disabled, onSelect }: PickerProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {legend}
      </legend>
      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded-xl border border-slate-200 p-1.5 dark:border-slate-700">
        {allowNone && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-pressed={selectedId === null}
            className={[
              'min-h-[2.25rem] rounded-lg px-2 text-xs font-semibold transition-colors disabled:opacity-40',
              selectedId === null
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            Không có
          </button>
        )}
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            aria-pressed={option.id === selectedId}
            aria-label={`${legend}: ${option.character}, ${option.romaja}`}
            className={[
              'flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-lg px-1.5 transition-colors disabled:opacity-40',
              option.id === selectedId
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <span className="font-hangul text-base leading-none" lang="ko">
              {option.character}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function SyllableSection({ state, setState, canSpeak, onSpeak }: SyllableSectionProps) {
  const builder = useSyllableBuilder({
    state,
    setState,
    soundEnabled: canSpeak,
  });
  const { target, preview, solved, missedThisRound, answer, progress } = builder;

  if (!target) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">Chưa có âm tiết nào để ghép.</p>
      </section>
    );
  }

  const wrongPreview = preview !== null && preview !== target.syllable && missedThisRound;

  return (
    <section
      aria-label="Ghép âm tiết"
      className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="text-center">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Ghép các chữ thành âm tiết này
        </p>
        <p className="mt-1 text-3xl font-bold sm:text-4xl" lang="ko-Latn">
          {romanizeKorean(target.syllable)}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{target.meaning}</p>
      </div>

      {/* Live preview: the point is watching the letters snap into one block. */}
      <div
        aria-live="polite"
        className={[
          'flex min-h-[6rem] items-center justify-center rounded-2xl border-2 transition-colors',
          solved
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
            : wrongPreview
              ? 'animate-shake border-rose-400 bg-rose-50 dark:bg-rose-950/40'
              : 'border-dashed border-slate-300 dark:border-slate-700',
        ].join(' ')}
      >
        {preview ? (
          <span className="font-hangul text-6xl leading-none font-medium sm:text-7xl" lang="ko">
            {preview}
          </span>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500">
            Chọn phụ âm đầu và nguyên âm
          </span>
        )}
      </div>

      {solved ? (
        <div className="animate-fade-up text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-sm font-semibold text-emerald-700 sm:text-base dark:text-emerald-400">
            <CheckIcon className="h-4 w-4" />
            <span>{missedThisRound ? 'Đã ghép đúng' : 'Chính xác'}</span>
            <span className="font-normal text-slate-600 dark:text-slate-300">
              — <span className="font-hangul">{target.syllable}</span> = {target.meaning}
            </span>
            {canSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(target.syllable)}
                aria-label={`Nghe phát âm ${target.syllable}`}
                className="rounded-full p-1 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                <SpeakerIcon className="h-4 w-4" />
              </button>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {answer?.initial.character} ({answer?.initial.romaja}) + {answer?.medial.character} (
            {answer?.medial.romaja})
            {answer?.final && (
              <>
                {' '}
                + {answer.final.character} (cuối âm tiết đọc {answer.final.finalRomaja})
              </>
            )}
          </p>
        </div>
      ) : (
        <div aria-live="polite" className="min-h-[1.25rem] text-center text-sm">
          {wrongPreview && (
            <p className="flex items-center justify-center gap-1.5 font-medium text-rose-700 dark:text-rose-400">
              <CrossIcon className="h-4 w-4" />
              Chưa đúng — thử đổi một chữ
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <Picker
          legend="Phụ âm đầu"
          options={POSSIBLE_INITIALS}
          selectedId={builder.initialId}
          disabled={solved}
          onSelect={builder.setInitialId}
        />
        <Picker
          legend="Nguyên âm"
          options={POSSIBLE_MEDIALS}
          selectedId={builder.medialId}
          disabled={solved}
          onSelect={builder.setMedialId}
        />
        <Picker
          legend="Phụ âm cuối"
          options={POSSIBLE_FINALS}
          selectedId={builder.finalId}
          allowNone
          disabled={solved}
          onSelect={builder.setFinalId}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={builder.check}
          disabled={!preview || solved}
          className="rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-40 dark:hover:bg-sky-500"
        >
          Kiểm tra
        </button>
        <button
          type="button"
          onClick={builder.clear}
          disabled={solved}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshIcon className="h-4 w-4" />
          Xóa
        </button>
        <button
          type="button"
          onClick={builder.reveal}
          disabled={solved}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Gợi ý
        </button>
        <button
          type="button"
          onClick={builder.next}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Âm tiết khác
        </button>
      </div>

      {progress && progress.builtCount > 0 && (
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Âm tiết này: đúng {progress.correctCount} / {progress.builtCount} lần
        </p>
      )}
    </section>
  );
}
