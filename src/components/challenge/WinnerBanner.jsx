import { Trophy } from 'lucide-react';
import { Avatar } from '../common/ui';

/** Aviso de desafío finalizado con ganador (o empate) y acción para archivarlo. */
export default function WinnerBanner({ challenge, winner, tie, onClose }) {
  return (
    <section className="winner-banner" aria-live="polite">
      <span className="winner-icon" aria-hidden="true"><Trophy size={22} /></span>
      <div className="winner-text">
        <p className="winner-kicker">{challenge.name} ha terminado</p>
        {tie ? (
          <p className="winner-title">Empate perfecto</p>
        ) : (
          <p className="winner-title">
            {winner && <Avatar user={winner} size={26} />} Gana {winner?.shortName}
          </p>
        )}
      </div>
      {onClose && (
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Cerrar y archivar
        </button>
      )}
    </section>
  );
}
