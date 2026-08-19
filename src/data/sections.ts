import type { LearningSection } from '../types';

/**
 * The four learning surfaces, in the order they build on each other: recognise
 * the letters, write them, assemble them into syllables, then hear them in use.
 */
export const SECTIONS: { id: LearningSection; label: string; hint: string }[] = [
  { id: 'letters', label: 'Học chữ', hint: 'Nhận mặt chữ và cách đọc' },
  { id: 'writing', label: 'Viết', hint: 'Viết đúng thứ tự nét' },
  { id: 'syllables', label: 'Ghép chữ', hint: 'Ráp phụ âm và nguyên âm thành âm tiết' },
  { id: 'listening', label: 'Nghe', hint: 'Nghe câu và hiểu nghĩa' },
];

export const SECTION_IDS: LearningSection[] = SECTIONS.map((section) => section.id);
