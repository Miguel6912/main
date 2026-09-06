/**
 * Purely decorative emoji icon per day -- adds visual flavor to Home/Course
 * Map without requiring custom illustration assets. Not curriculum content.
 */
export const DAY_ICONS: Record<number, string> = {
  1: '👋',
  2: '💬',
  3: '❓',
  4: '🔧',
  5: '🧩',
  6: '🏠',
  7: '📅',
  8: '🗺️',
  9: '🔍',
  10: '🎯',
  11: '⏪',
  12: '✈️',
  13: '🔁',
  14: '⚖️',
  15: '🗣️',
  16: '😲',
  17: '🎊',
  18: '🤔',
  19: '📖',
  20: '👂',
  21: '👥',
  22: '🧠',
  23: '📞',
  24: '📋',
  25: '🩺',
  26: '💼',
  27: '⚡',
  28: '🔊',
  29: '💡',
  30: '🏁',
};

export function iconForDay(dayNumber: number): string {
  return DAY_ICONS[dayNumber] ?? '📘';
}
