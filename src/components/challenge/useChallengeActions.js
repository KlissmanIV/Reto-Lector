import { useCallback } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { useUi } from '../../context/UiContext';
import { useToast } from '../../context/ToastContext';
import { isChallengeOver } from '../../utils/dates';

/** Cierre de desafío con confirmación, compartido por Inicio y Desafío. */
export function useCloseChallenge() {
  const { activeChallenge, leader, usersById, actions } = useAppData();
  const { confirm } = useUi();
  const { toast } = useToast();

  return useCallback(async () => {
    if (!activeChallenge) return;
    const over = isChallengeOver(activeChallenge);
    const outcome = leader.tie ? 'terminará en empate' : `gana ${usersById[leader.leaderId]?.shortName}`;
    const ok = await confirm({
      title: over ? 'Archivar desafío' : 'Terminar el desafío antes de tiempo',
      message: `Con el marcador actual ${outcome}. El desafío pasará al historial y no se podrán sumar más puntos.`,
      confirmLabel: over ? 'Archivar' : 'Terminar ahora',
      tone: over ? 'primary' : 'danger',
    });
    if (!ok) return;
    await actions.closeChallenge(activeChallenge.id);
    toast('Desafío archivado en el historial');
  }, [activeChallenge, leader, usersById, actions, confirm, toast]);
}
