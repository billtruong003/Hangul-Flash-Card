import type { QuizMode } from '../types';

export const TABS: { id: QuizMode; label: string; hint: string }[] = [
  { id: 'char-to-sound', label: 'Chữ → Âm', hint: 'Nhìn chữ Hangul, chọn cách đọc' },
  { id: 'sound-to-char', label: 'Âm → Chữ', hint: 'Nhìn cách đọc, chọn chữ Hangul' },
];
