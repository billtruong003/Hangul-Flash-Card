/**
 * How an answer option looks once a choice is locked in — shared by the letter
 * quiz and the listening grid so the two cannot drift apart.
 *
 * A plain module rather than part of `AnswerButton.tsx`: exporting constants
 * from a component file defeats fast refresh, and the listening grid needs the
 * palette without needing the button.
 */
export type AnswerState = 'idle' | 'correct' | 'assisted' | 'incorrect' | 'dimmed';

export const ANSWER_STATE_CLASSES: Record<AnswerState, string> = {
  idle: 'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500 dark:hover:bg-slate-800',
  correct:
    'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-100',
  assisted:
    'border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-100',
  incorrect:
    'border-rose-500 bg-rose-50 text-rose-900 animate-shake dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-100',
  dimmed: 'border-slate-200 bg-white opacity-50 dark:border-slate-800 dark:bg-slate-900',
};

/**
 * Which state an option is in. `assisted` is letters-only; other surfaces pass
 * `false` for it.
 */
export function answerStateFor(
  optionId: string,
  answer: { selectedId: string; correctId: string; assisted: boolean } | null,
): AnswerState {
  if (!answer) return 'idle';
  if (optionId === answer.correctId) return answer.assisted ? 'assisted' : 'correct';
  if (optionId === answer.selectedId) return 'incorrect';
  return 'dimmed';
}
