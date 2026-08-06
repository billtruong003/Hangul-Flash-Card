import type { Feedback } from '../hooks/useQuiz';
import type { AnswerResult, Question, QuizMode } from '../types';
import { AnswerButton, type AnswerState } from './AnswerButton';
import { AssistIcon, CheckIcon, CrossIcon, SpeakerIcon } from './icons';

type QuizCardProps = {
  question: Question;
  feedback: Feedback | null;
  mode: QuizMode;
  canSpeak: boolean;
  onSelect: (optionId: string) => void;
  onSpeak: (text: string) => void;
};

const RESULT_HEADLINES: Record<AnswerResult, string> = {
  'correct-unassisted': 'Chính xác',
  'correct-assisted': 'Đúng — có trợ giúp',
  incorrect: 'Chưa đúng',
};

const RESULT_TONES: Record<AnswerResult, string> = {
  'correct-unassisted': 'text-emerald-700 dark:text-emerald-400',
  'correct-assisted': 'text-amber-700 dark:text-amber-400',
  incorrect: 'text-rose-700 dark:text-rose-400',
};

function ResultIcon({ result }: { result: AnswerResult }) {
  if (result === 'correct-unassisted') return <CheckIcon className="h-4 w-4" />;
  if (result === 'correct-assisted') return <AssistIcon className="h-4 w-4" />;
  return <CrossIcon className="h-4 w-4" />;
}

function answerStateFor(optionId: string, feedback: Feedback | null): AnswerState {
  if (!feedback) return 'idle';
  if (optionId === feedback.correctId) {
    return feedback.result === 'correct-assisted' ? 'assisted' : 'correct';
  }
  if (optionId === feedback.selectedId) return 'incorrect';
  return 'dimmed';
}

export function QuizCard({ question, feedback, mode, canSpeak, onSelect, onSpeak }: QuizCardProps) {
  const { prompt, options } = question;
  const showsHangulPrompt = mode === 'char-to-sound';
  const feedbackMessage = feedback
    ? `${RESULT_HEADLINES[feedback.result]}. ${prompt.character} đọc là ${prompt.pronunciation}.`
    : '';

  return (
    <section
      id="quiz-panel"
      role="tabpanel"
      aria-labelledby={`tab-${mode}`}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col items-center">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {showsHangulPrompt ? 'Chữ này đọc thế nào?' : 'Âm này là chữ nào?'}
        </p>

        <div className="mt-2 flex min-h-[5.5rem] items-center gap-3 sm:min-h-[7rem]">
          <p
            key={`${prompt.id}-${mode}`}
            lang={showsHangulPrompt ? 'ko' : 'vi'}
            className={
              showsHangulPrompt
                ? 'animate-pop-in font-hangul text-7xl leading-none font-medium sm:text-8xl'
                : 'animate-pop-in text-5xl leading-tight font-bold sm:text-6xl'
            }
          >
            {showsHangulPrompt ? prompt.character : prompt.pronunciation}
          </p>

          {showsHangulPrompt && canSpeak && (
            <button
              type="button"
              onClick={() => onSpeak(prompt.character)}
              aria-label={`Nghe phát âm chữ ${prompt.character}`}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
            >
              <SpeakerIcon />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
        {options.map((option, index) => (
          <AnswerButton
            key={option.id}
            label={showsHangulPrompt ? option.pronunciation : option.character}
            ariaLabel={
              showsHangulPrompt
                ? `Đáp án ${index + 1}: đọc là ${option.pronunciation}`
                : `Đáp án ${index + 1}: chữ ${option.character}`
            }
            isHangul={!showsHangulPrompt}
            state={answerStateFor(option.id, feedback)}
            disabled={feedback !== null}
            shortcut={index + 1}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>

      <div className="mt-3 flex min-h-[4.25rem] flex-col justify-center rounded-2xl px-3 py-2 text-center sm:min-h-[4.5rem]">
        {feedback && (
          <div className="animate-fade-up">
            <p
              className={[
                'flex flex-wrap items-center justify-center gap-x-1.5 text-sm font-semibold sm:text-base',
                RESULT_TONES[feedback.result],
              ].join(' ')}
            >
              <ResultIcon result={feedback.result} />
              <span>{RESULT_HEADLINES[feedback.result]}</span>
              <span className="font-normal text-slate-600 dark:text-slate-300">
                — <span className="font-hangul">{prompt.character}</span> = {prompt.pronunciation}
              </span>
              {!showsHangulPrompt && canSpeak && (
                <button
                  type="button"
                  onClick={() => onSpeak(prompt.character)}
                  aria-label={`Nghe phát âm chữ ${prompt.character}`}
                  className="ml-0.5 rounded-full p-1 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                >
                  <SpeakerIcon className="h-4 w-4" />
                </button>
              )}
            </p>
            {feedback.result === 'correct-assisted' && (
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Không tính vào tiến độ thuộc chữ.
              </p>
            )}
            {prompt.explanation && (
              <p className="mt-1 text-xs leading-snug text-slate-500 sm:text-sm dark:text-slate-400">
                {prompt.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {feedbackMessage}
      </div>
    </section>
  );
}
