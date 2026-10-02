const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anillo de tiempo restante de la ventana actual (activa o de gracia). */
export default function StreakRing({ fraction = 0, status, label, children }) {
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <div className={`streak-ring is-${status}`} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="streak-ring-track" cx="50" cy="50" r={RADIUS} />
        <circle
          className="streak-ring-fill"
          cx="50"
          cy="50"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </svg>
      <div className="streak-ring-content">{children}</div>
    </div>
  );
}
