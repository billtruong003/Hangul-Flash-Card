type SpeechNoticeProps = {
  soundEnabled: boolean;
  speechSupported: boolean;
  hasKoreanVoice: boolean;
};

/**
 * Explains why nothing is being read aloud.
 *
 * Without this the app just goes quiet, which is indistinguishable from a bug —
 * and the usual cause is not a bug at all but a phone with no Korean
 * text-to-speech data installed, which the learner can fix in a minute if
 * anyone tells them how.
 */
export function SpeechNotice({ soundEnabled, speechSupported, hasKoreanVoice }: SpeechNoticeProps) {
  if (!soundEnabled) return null;
  if (speechSupported && hasKoreanVoice) return null;

  return (
    <section
      aria-label="Vì sao chưa nghe được"
      className="rounded-xl bg-amber-100 px-3 py-2.5 text-xs leading-relaxed text-amber-900 sm:text-sm dark:bg-amber-950/50 dark:text-amber-200"
    >
      {!speechSupported ? (
        <p>
          Trình duyệt này không hỗ trợ đọc thành tiếng. Thử mở bằng Chrome, Safari hoặc Edge bản
          mới.
        </p>
      ) : (
        <>
          <p>
            <span className="font-semibold">Máy chưa có giọng đọc tiếng Hàn.</span> Ứng dụng giữ im
            lặng thay vì đọc Hangul bằng giọng tiếng Anh — nghe như vậy còn hại hơn. Cài giọng Hàn
            rồi mở lại trang:
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
            <li>
              <span className="font-semibold">Android:</span> Cài đặt → Quản lý chung → Văn bản
              thành giọng nói → Cài dữ liệu giọng nói → Tiếng Hàn
            </li>
            <li>
              <span className="font-semibold">iPhone:</span> Cài đặt → Trợ năng → Nội dung đọc →
              Giọng nói → Tiếng Hàn
            </li>
            <li>
              <span className="font-semibold">Windows:</span> Settings → Time &amp; Language →
              Speech → Add voices → Korean
            </li>
          </ul>
          <p className="mt-1.5">
            Trên iPhone, đôi khi phải chạm vào một nút bất kỳ trong trang một lần thì danh sách
            giọng mới hiện ra.
          </p>
        </>
      )}
    </section>
  );
}
