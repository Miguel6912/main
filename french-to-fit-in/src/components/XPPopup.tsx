import './XPPopup.css';

interface XPPopupProps {
  amount: number;
}

/** Small "+N XP" flash shown right after a scored answer. Purely additive
 * delight -- never blocks or delays the underlying feedback. Pass a
 * changing `key` (e.g. an incrementing counter) from the caller so each
 * new award remounts this and restarts the animation. */
export function XPPopup({ amount }: XPPopupProps) {
  if (amount <= 0) return null;
  return (
    <span className="xp-popup" aria-live="polite">
      +{amount} XP
    </span>
  );
}
