import { useAppData } from '../../context/AppDataContext';
import { useNow } from '../../hooks/useNow';
import { getStreakState } from '../../utils/streak';

/** Estado actual de la racha de un participante (por defecto, el usuario activo). */
export function useStreak(userId) {
  const { streaks, currentUser } = useAppData();
  const now = useNow();
  const id = userId ?? currentUser?.id;
  return getStreakState(streaks?.[id], now);
}
