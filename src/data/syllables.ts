import type { SyllableEntry } from '../types';

/**
 * Syllables the learner assembles from jamo, ordered roughly by difficulty:
 * open syllables (초성 + 중성) first, then ones that close with a batchim.
 *
 * Every entry is a real word rather than a nonsense syllable, so building it
 * teaches vocabulary at the same time as the assembly rule. `syllables.test.ts`
 * checks with es-hangul that each one decomposes into jamo the app actually
 * teaches — otherwise a learner could be asked to build a letter they have
 * never been shown.
 */
export const SYLLABLES: SyllableEntry[] = [
  // ── Không có batchim (초성 + 중성) ──────────────────────────────
  { syllable: '나', meaning: 'tôi, tớ (thân mật)' },
  { syllable: '너', meaning: 'bạn, cậu (thân mật)' },
  { syllable: '소', meaning: 'con bò' },
  { syllable: '코', meaning: 'cái mũi' },
  { syllable: '무', meaning: 'củ cải' },
  { syllable: '이', meaning: 'cái răng; số hai' },
  { syllable: '오', meaning: 'số năm' },
  { syllable: '구', meaning: 'số chín' },
  { syllable: '사', meaning: 'số bốn' },
  { syllable: '차', meaning: 'trà; xe' },
  { syllable: '배', meaning: 'quả lê; cái bụng; con tàu' },
  { syllable: '개', meaning: 'con chó' },
  { syllable: '새', meaning: 'con chim' },
  { syllable: '게', meaning: 'con cua' },
  { syllable: '키', meaning: 'chiều cao' },
  { syllable: '피', meaning: 'máu' },
  { syllable: '파', meaning: 'hành lá' },
  { syllable: '뭐', meaning: 'cái gì' },
  { syllable: '위', meaning: 'phía trên' },
  { syllable: '귀', meaning: 'cái tai' },
  { syllable: '터', meaning: 'nền đất, chỗ' },
  { syllable: '띠', meaning: 'con giáp; dây đai' },
  { syllable: '뼈', meaning: 'xương' },
  { syllable: '쌀', meaning: 'gạo' },

  // ── Có batchim (초성 + 중성 + 종성) ────────────────────────────
  { syllable: '감', meaning: 'quả hồng' },
  { syllable: '밥', meaning: 'cơm' },
  { syllable: '집', meaning: 'ngôi nhà' },
  { syllable: '물', meaning: 'nước' },
  { syllable: '산', meaning: 'ngọn núi' },
  { syllable: '손', meaning: 'bàn tay' },
  { syllable: '발', meaning: 'bàn chân' },
  { syllable: '눈', meaning: 'mắt; tuyết' },
  { syllable: '입', meaning: 'cái miệng' },
  { syllable: '국', meaning: 'canh' },
  { syllable: '강', meaning: 'dòng sông' },
  { syllable: '방', meaning: 'căn phòng' },
  { syllable: '곰', meaning: 'con gấu' },
  { syllable: '말', meaning: 'con ngựa; lời nói' },
  { syllable: '별', meaning: 'ngôi sao' },
  { syllable: '문', meaning: 'cái cửa' },
  { syllable: '옷', meaning: 'quần áo' },
  { syllable: '꽃', meaning: 'bông hoa' },
  { syllable: '책', meaning: 'quyển sách' },
  { syllable: '빵', meaning: 'bánh mì' },
  { syllable: '컵', meaning: 'cái cốc' },
  // 닭 was tempting here but its batchim is ㄺ, a two-letter cluster the app
  // does not teach. Anything with a 겹받침 stays out until it does.
];

export const SYLLABLES_BY_ID: Record<string, SyllableEntry> = Object.fromEntries(
  SYLLABLES.map((entry) => [entry.syllable, entry]),
);
