import { Flame } from 'lucide-react';

/**
 * Llama de racha en capas (resplandor, llama y núcleo). El estado controla
 * color y movimiento: activa (viva), gracia (tenue, en riesgo), perdida (apagada).
 */
export default function StreakFlame({ status = 'active', size = 48, className = '' }) {
  return (
    <span className={`flame is-${status} ${className}`} style={{ '--flame-size': `${size}px` }} aria-hidden="true">
      <span className="flame-glow" />
      <Flame className="flame-outer" fill="currentColor" strokeWidth={0} />
      <Flame className="flame-core" fill="currentColor" strokeWidth={0} />
    </span>
  );
}
