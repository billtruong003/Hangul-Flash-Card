import { ActionButton } from './ActionButton';
import { RefreshIcon, ReviewIcon } from './icons';

type QuizActionsProps = {
  reviewMode: boolean;
  onRestartSession: () => void;
  onToggleReview: () => void;
};

/**
 * Controls that only make sense while learning letters. "Phiên" means something
 * different on each surface, and reviewing mistakes is defined over the letter
 * quiz's own history, so neither belongs in the global row.
 */
export function QuizActions({ reviewMode, onRestartSession, onToggleReview }: QuizActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ActionButton
        icon={<RefreshIcon />}
        label="Bắt đầu lại phiên"
        ariaLabel="Bắt đầu lại phiên học, giữ nguyên tiến độ dài hạn"
        onClick={onRestartSession}
      />
      <ActionButton
        icon={<ReviewIcon />}
        label="Ôn chữ sai"
        ariaLabel={reviewMode ? 'Tắt chế độ ôn chữ sai' : 'Bật chế độ ôn chữ sai'}
        title="Phím tắt: R"
        pressed={reviewMode}
        onClick={onToggleReview}
      />
    </div>
  );
}
