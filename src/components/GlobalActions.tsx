import { ActionButton } from './ActionButton';
import { ChartIcon, SoundOffIcon, SoundOnIcon, TrashIcon } from './icons';

type GlobalActionsProps = {
  chartOpen: boolean;
  chartLocked: boolean;
  soundEnabled: boolean;
  speechSupported: boolean;
  onToggleChart: () => void;
  onToggleSound: () => void;
  onRequestClearProgress: () => void;
};

/**
 * Controls that mean the same thing on every surface.
 *
 * The reference chart is here rather than inside the letters quiz because
 * writing and syllable building want to look letters up too. Only the letters
 * quiz treats opening it as assistance — the shell owns the open/closed state
 * and that surface subscribes to it.
 *
 * Wiping progress stays at the top level rather than moving into the settings
 * drawer: it now clears all four surfaces, and burying it would make it harder
 * to find precisely as it got more destructive.
 */
export function GlobalActions({
  chartOpen,
  chartLocked,
  soundEnabled,
  speechSupported,
  onToggleChart,
  onToggleSound,
  onRequestClearProgress,
}: GlobalActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <ActionButton
        icon={<ChartIcon />}
        label={chartOpen ? 'Ẩn bảng Hangul' : 'Hiện bảng Hangul'}
        title={chartLocked ? 'Chế độ kiểm tra đang bật' : undefined}
        pressed={chartOpen}
        disabled={chartLocked}
        className="col-span-2 sm:col-span-1"
        onClick={onToggleChart}
      />
      <ActionButton
        icon={soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
        label={soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
        ariaLabel={soundEnabled ? 'Tắt âm thanh phát âm' : 'Bật âm thanh phát âm'}
        title={speechSupported ? undefined : 'Máy này không có giọng đọc tiếng Hàn'}
        pressed={soundEnabled}
        disabled={!speechSupported}
        onClick={onToggleSound}
      />
      <ActionButton
        icon={<TrashIcon />}
        label="Xóa toàn bộ tiến độ"
        danger
        onClick={onRequestClearProgress}
      />
    </div>
  );
}
