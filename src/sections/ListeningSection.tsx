import type { Dispatch, SetStateAction } from 'react';
import { ANSWER_STATE_CLASSES, answerStateFor } from '../components/answerState';
import { TabBar } from '../components/TabBar';
import { CheckIcon, CrossIcon, SpeakerIcon } from '../components/icons';
import { SENTENCE_TOPICS } from '../data/sentences';
import { useListening } from '../hooks/useListening';
import { romanizeKorean } from '../lib/syllable';
import type { PersistedState, SentenceLevel, SentenceTopic } from '../types';

type ListeningSectionProps = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
  canSpeak: boolean;
};

const LEVEL_TABS = [
  { id: '1', label: 'Từ đơn' },
  { id: '2', label: 'Cụm nói' },
  { id: '3', label: 'Câu' },
];

function topicClass(active: boolean): string {
  return [
    'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
    active
      ? 'bg-sky-600 text-white'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
  ].join(' ');
}

export function ListeningSection({ state, setState, canSpeak }: ListeningSectionProps) {
  const listening = useListening({ state, setState, soundEnabled: canSpeak });
  const { current, options, answered, isCorrect, selectedId } = listening;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <TabBar
        tabs={LEVEL_TABS}
        activeId={String(listening.level)}
        panelId="listening-panel"
        label="Mức độ nghe"
        onChange={(id) => listening.changeLevel(Number(id) as SentenceLevel)}
      />

      {/* Topic and level are independent filters, so "Tất cả" is a real choice
          here rather than an eleventh topic. */}
      <div
        role="group"
        aria-label="Chủ đề"
        className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 p-1.5 dark:border-slate-800"
      >
        <button
          type="button"
          onClick={() => listening.changeTopic(null)}
          aria-pressed={listening.topic === null}
          className={topicClass(listening.topic === null)}
        >
          Tất cả
        </button>
        {(Object.keys(SENTENCE_TOPICS) as SentenceTopic[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => listening.changeTopic(id)}
            aria-pressed={listening.topic === id}
            className={topicClass(listening.topic === id)}
          >
            {SENTENCE_TOPICS[id]}
          </button>
        ))}
      </div>

      {!canSpeak && (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-center text-xs font-medium text-amber-900 sm:text-sm dark:bg-amber-950/50 dark:text-amber-200">
          Bật <span className="font-semibold">Âm thanh</span> để nghe câu.
        </p>
      )}

      <section
        id="listening-panel"
        aria-label="Nghe hiểu"
        className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        {!current ? (
          <p className="text-center text-sm text-slate-600 dark:text-slate-300">
            Chưa có câu nào cho mức và chủ đề này.
          </p>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Nghe rồi chọn nghĩa
              </p>
              <button
                type="button"
                onClick={listening.play}
                disabled={!canSpeak}
                aria-label="Phát câu tiếng Hàn"
                className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-600 text-white transition-colors hover:bg-sky-700 disabled:opacity-40 dark:hover:bg-sky-500"
              >
                <SpeakerIcon className="h-9 w-9" />
              </button>
              <p className="min-h-[1rem] text-[11px] text-slate-400 dark:text-slate-500">
                {listening.replays > 0 && !answered
                  ? `Đã nghe ${listening.replays} lần`
                  : `${listening.poolSize} câu trong nhóm này`}
              </p>
            </div>

            <div className="grid gap-2.5">
              {options.map((option, index) => {
                const state = answerStateFor(
                  option.id,
                  selectedId === null
                    ? null
                    : { selectedId, correctId: current.id, assisted: false },
                );

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => listening.answer(option.id)}
                    disabled={answered}
                    // A distinct prefix from the letter quiz's "Đáp án", so a
                    // query for one can never pick up the other.
                    aria-label={`Nghĩa ${index + 1}: ${option.vi}`}
                    className={[
                      'rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default sm:text-base',
                      ANSWER_STATE_CLASSES[state],
                    ].join(' ')}
                  >
                    {option.vi}
                  </button>
                );
              })}
            </div>

            <div aria-live="polite" className="min-h-[2rem]">
              {answered && (
                <div className="animate-fade-up flex flex-col gap-3">
                  <p
                    className={[
                      'flex items-center justify-center gap-1.5 text-sm font-semibold sm:text-base',
                      isCorrect
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400',
                    ].join(' ')}
                  >
                    {isCorrect ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CrossIcon className="h-4 w-4" />
                    )}
                    {isCorrect ? 'Chính xác' : `Nghĩa đúng: ${current.vi}`}
                  </p>

                  {/* The breakdown: the Hangul appears only now, and each word
                      can be played on its own to isolate what was missed. */}
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
                    <p
                      className="text-center font-hangul text-2xl leading-snug font-medium sm:text-3xl"
                      lang="ko"
                    >
                      {current.ko}
                    </p>
                    <p
                      className="mt-0.5 text-center text-xs text-slate-500 dark:text-slate-400"
                      lang="ko-Latn"
                    >
                      {romanizeKorean(current.ko)}
                    </p>

                    <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {current.words.map((word, index) => (
                        <li key={`${word.ko}-${index}`}>
                          <button
                            type="button"
                            onClick={() => listening.playWord(word.ko)}
                            disabled={!canSpeak}
                            aria-label={`Nghe từ ${word.ko}, nghĩa là ${word.vi}`}
                            className="flex flex-col items-center rounded-xl border border-slate-200 px-2.5 py-1.5 transition-colors hover:border-sky-400 hover:bg-white disabled:opacity-60 dark:border-slate-700 dark:hover:border-sky-500 dark:hover:bg-slate-900"
                          >
                            <span className="font-hangul text-base leading-tight" lang="ko">
                              {word.ko}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {word.vi}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={listening.next}
                    className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 dark:hover:bg-sky-500"
                  >
                    Câu tiếp theo
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
