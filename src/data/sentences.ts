import type { SentenceEntry } from '../types';

/**
 * The listening deck. Hand-written rather than imported from a corpus, because
 * there isn't one: Tatoeba carries 43 Korean–Vietnamese sentence pairs in total
 * (OPUS independently reports 32), which is nowhere near a usable deck, and the
 * larger Korean–English sets are ungraded and skew far past a beginner.
 *
 * Levels are the unlock order, and each one changes what the learner is being
 * asked to do:
 *   1 — a single word, so the task is only "did I hear those syllables"
 *   2 — a fixed phrase heard as one chunk, the way it is actually used
 *   3 — a full sentence, where word boundaries have to be picked out
 *
 * `words` is the tap-to-hear breakdown. Joined with spaces it must reproduce
 * `ko` exactly; `sentences.test.ts` enforces that, so the two cannot drift.
 * Romanization is never stored — it is derived through es-hangul, which applies
 * the pronunciation-change rules a hand-written column would get wrong.
 */
export const SENTENCES: SentenceEntry[] = [
  // ── Cấp 1: từ đơn ──────────────────────────────────────────────
  { id: 's01', ko: '물', vi: 'nước', level: 1, words: [{ ko: '물', vi: 'nước' }] },
  { id: 's02', ko: '밥', vi: 'cơm', level: 1, words: [{ ko: '밥', vi: 'cơm' }] },
  {
    id: 's03',
    ko: '학교',
    vi: 'trường học',
    level: 1,
    words: [{ ko: '학교', vi: 'trường học' }],
  },
  { id: 's04', ko: '친구', vi: 'bạn bè', level: 1, words: [{ ko: '친구', vi: 'bạn bè' }] },
  { id: 's05', ko: '사람', vi: 'người', level: 1, words: [{ ko: '사람', vi: 'người' }] },
  { id: 's06', ko: '오늘', vi: 'hôm nay', level: 1, words: [{ ko: '오늘', vi: 'hôm nay' }] },
  { id: 's07', ko: '김치', vi: 'kim chi', level: 1, words: [{ ko: '김치', vi: 'kim chi' }] },
  { id: 's08', ko: '사랑', vi: 'tình yêu', level: 1, words: [{ ko: '사랑', vi: 'tình yêu' }] },
  { id: 's09', ko: '한국', vi: 'Hàn Quốc', level: 1, words: [{ ko: '한국', vi: 'Hàn Quốc' }] },
  { id: 's10', ko: '가족', vi: 'gia đình', level: 1, words: [{ ko: '가족', vi: 'gia đình' }] },

  // ── Cấp 2: cụm nói quen thuộc ─────────────────────────────────
  {
    id: 's11',
    ko: '안녕하세요',
    vi: 'Xin chào.',
    level: 2,
    words: [{ ko: '안녕하세요', vi: 'xin chào' }],
  },
  {
    id: 's12',
    ko: '감사합니다',
    vi: 'Cảm ơn.',
    level: 2,
    words: [{ ko: '감사합니다', vi: 'cảm ơn' }],
  },
  {
    id: 's13',
    ko: '죄송합니다',
    vi: 'Tôi xin lỗi.',
    level: 2,
    words: [{ ko: '죄송합니다', vi: 'tôi xin lỗi' }],
  },
  {
    id: 's14',
    ko: '맛있어요',
    vi: 'Ngon quá.',
    level: 2,
    words: [{ ko: '맛있어요', vi: 'ngon' }],
  },
  {
    id: 's15',
    ko: '괜찮아요',
    vi: 'Không sao đâu.',
    level: 2,
    words: [{ ko: '괜찮아요', vi: 'không sao' }],
  },
  {
    id: 's16',
    ko: '잠깐만요',
    vi: 'Đợi một chút.',
    level: 2,
    words: [{ ko: '잠깐만요', vi: 'đợi một chút' }],
  },
  {
    id: 's17',
    ko: '얼마예요',
    vi: 'Bao nhiêu tiền?',
    level: 2,
    words: [{ ko: '얼마예요', vi: 'bao nhiêu tiền' }],
  },
  {
    id: 's18',
    ko: '안녕히 가세요',
    vi: 'Tạm biệt. (nói với người rời đi)',
    level: 2,
    words: [
      { ko: '안녕히', vi: 'bình an' },
      { ko: '가세요', vi: 'anh/chị đi nhé' },
    ],
  },
  {
    id: 's19',
    ko: '잘 먹겠습니다',
    vi: 'Con xin phép ăn ạ.',
    level: 2,
    words: [
      { ko: '잘', vi: 'ngon lành, tốt' },
      { ko: '먹겠습니다', vi: 'con sẽ ăn' },
    ],
  },
  {
    id: 's20',
    ko: '또 만나요',
    vi: 'Hẹn gặp lại.',
    level: 2,
    words: [
      { ko: '또', vi: 'lại' },
      { ko: '만나요', vi: 'gặp nhau' },
    ],
  },

  // ── Cấp 3: câu hoàn chỉnh ─────────────────────────────────────
  {
    id: 's21',
    ko: '저는 학생이에요',
    vi: 'Tôi là học sinh.',
    level: 3,
    words: [
      { ko: '저는', vi: 'tôi thì' },
      { ko: '학생이에요', vi: 'là học sinh' },
    ],
  },
  {
    id: 's22',
    ko: '이름이 뭐예요',
    vi: 'Bạn tên là gì?',
    level: 3,
    words: [
      { ko: '이름이', vi: 'tên thì' },
      { ko: '뭐예요', vi: 'là gì' },
    ],
  },
  {
    id: 's23',
    ko: '어디에 가요',
    vi: 'Bạn đi đâu vậy?',
    level: 3,
    words: [
      { ko: '어디에', vi: 'đến đâu' },
      { ko: '가요', vi: 'đi' },
    ],
  },
  {
    id: 's24',
    ko: '한국어를 공부해요',
    vi: 'Tôi học tiếng Hàn.',
    level: 3,
    words: [
      { ko: '한국어를', vi: 'tiếng Hàn' },
      { ko: '공부해요', vi: 'học' },
    ],
  },
  {
    id: 's25',
    ko: '물 좀 주세요',
    vi: 'Cho tôi xin chút nước.',
    level: 3,
    words: [
      { ko: '물', vi: 'nước' },
      { ko: '좀', vi: 'một chút' },
      { ko: '주세요', vi: 'xin hãy cho' },
    ],
  },
  {
    id: 's26',
    ko: '지금 몇 시예요',
    vi: 'Bây giờ là mấy giờ?',
    level: 3,
    words: [
      { ko: '지금', vi: 'bây giờ' },
      { ko: '몇', vi: 'mấy' },
      { ko: '시예요', vi: 'là giờ' },
    ],
  },
  {
    id: 's27',
    ko: '저는 베트남 사람이에요',
    vi: 'Tôi là người Việt Nam.',
    level: 3,
    words: [
      { ko: '저는', vi: 'tôi thì' },
      { ko: '베트남', vi: 'Việt Nam' },
      { ko: '사람이에요', vi: 'là người' },
    ],
  },
  {
    id: 's28',
    ko: '오늘 날씨가 좋아요',
    vi: 'Hôm nay thời tiết đẹp.',
    level: 3,
    words: [
      { ko: '오늘', vi: 'hôm nay' },
      { ko: '날씨가', vi: 'thời tiết thì' },
      { ko: '좋아요', vi: 'đẹp, tốt' },
    ],
  },
  {
    id: 's29',
    ko: '다시 한번 말해 주세요',
    vi: 'Xin nói lại một lần nữa.',
    level: 3,
    words: [
      { ko: '다시', vi: 'lại' },
      { ko: '한번', vi: 'một lần' },
      { ko: '말해', vi: 'nói' },
      { ko: '주세요', vi: 'xin hãy' },
    ],
  },
  {
    id: 's30',
    ko: '만나서 반갑습니다',
    vi: 'Rất vui được gặp bạn.',
    level: 3,
    words: [
      { ko: '만나서', vi: 'vì được gặp' },
      { ko: '반갑습니다', vi: 'rất vui' },
    ],
  },
];

export const SENTENCES_BY_ID: Record<string, SentenceEntry> = Object.fromEntries(
  SENTENCES.map((entry) => [entry.id, entry]),
);
