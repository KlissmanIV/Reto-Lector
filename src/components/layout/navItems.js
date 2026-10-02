import { Flame, History, House, Library, Settings, Swords, UserRound } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/biblioteca', label: 'Biblioteca', icon: Library },
  { to: '/desafio', label: 'Desafío', icon: Swords },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
];

// Solo en el menú lateral; en móvil se accede desde el contador de la barra superior.
export const STREAK_ITEM = { to: '/racha', label: 'Racha', icon: Flame };

export const SETTINGS_ITEM = { to: '/ajustes', label: 'Ajustes', icon: Settings };
