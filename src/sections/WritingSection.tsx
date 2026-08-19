import { StrokePad } from '../components/StrokePad';
import { useStrokePractice } from '../hooks/useStrokePractice';
import { CheckIcon, RefreshIcon, SpeakerIcon } from '../components/icons';
import type { PersistedState } from '../types';
import type { Dispatch, SetStateAction } from 'react';

type WritingSectionProps = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
  canSpeak: boolean;
  onSpeak: (text: string) => void;
};

const FEEDBACK_TEXT = {
  idle: '',
  wrong: 'Chưa đúng nét này — thử lại theo vệt mờ.',
  backwards: 'Đúng nét nhưng ngược chiều — bắt đầu từ chấm xanh.',
} as const;

export function WritingSection({ state, setState, canSpeak, onSpeak }: WritingSectionProps) {
  const practice = useStrokePractice({ state, setState });
  const {
    letter,
    letters,
    strokes,
    completed,
    feedback,
    showHint,
    demoStroke,
    finishedScore,
    progress,
  } = practice;

  if (!letter) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Hãy bật ít nhất một nhóm chữ trong phần cài đặt để bắt đầu luyện viết.
        </p>
      </section>
    );
  }

  const done = completed >= strokes.length && finishedScore !== null;

  return (
    <section
      aria-label="Luyện viết"
      className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Viết chữ này
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-hangul text-4xl leading-none font-medium" lang="ko">
              {letter.character}
            </span>
            <span className="text-lg font-semibold">{letter.romaja}</span>
            {canSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(letter.demoSyllable)}
                aria-label={`Nghe phát âm chữ ${letter.character}`}
                className="rounded-full p-1 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                <SpeakerIcon className="h-4 w-4" />
              </button>
            )}
          </p>
        </div>

        <p className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
          Nét {Math.min(completed + 1, strokes.length)} / {strokes.length}
          {progress && progress.bestScore > 0 && (
            <span className="mt-0.5 block">Điểm cao nhất {progress.bestScore}</span>
          )}
        </p>
      </header>

      <StrokePad
        strokes={strokes}
        completed={completed}
        showHint={showHint}
        feedback={feedback}
        demoStroke={demoStroke}
        label={`Vùng viết chữ ${letter.character}. Nét thứ ${Math.min(completed + 1, strokes.length)} trên ${strokes.length}.`}
        onStrokeDrawn={practice.handleStrokeDrawn}
      />

      <div aria-live="polite" className="min-h-[2.5rem] text-center text-sm">
        {done ? (
          <p className="flex items-center justify-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckIcon className="h-4 w-4" />
            Xong — {finishedScore} điểm
          </p>
        ) : feedback !== 'idle' ? (
          <p
            className={
              feedback === 'backwards'
                ? 'font-medium text-amber-700 dark:text-amber-400'
                : 'font-medium text-rose-700 dark:text-rose-400'
            }
          >
            {FEEDBACK_TEXT[feedback]}
          </p>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">
            {showHint ? 'Tô theo vệt mờ, bắt đầu từ chấm xanh.' : 'Viết từ trí nhớ.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={practice.playDemo}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Xem mẫu
        </button>
        <button
          type="button"
          onClick={practice.toggleHint}
          aria-pressed={!showHint}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {showHint ? 'Ẩn vệt mờ' : 'Hiện vệt mờ'}
        </button>
        <button
          type="button"
          onClick={practice.retry}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshIcon className="h-4 w-4" />
          Viết lại
        </button>
        <button
          type="button"
          onClick={practice.next}
          className="rounded-xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 dark:hover:bg-sky-500"
        >
          Chữ tiếp theo
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
        Đang luyện {letters.length} chữ theo nhóm đã bật trong cài đặt
      </p>
    </section>
  );
}
