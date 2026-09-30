import { BookCheck, BookMarked, BookOpen } from 'lucide-react';

export const STATUS = {
  pending: { label: 'Pendiente', icon: BookMarked },
  reading: { label: 'Leyendo', icon: BookOpen },
  finished: { label: 'Terminado', icon: BookCheck },
};

// Paleta de portadas generadas.
export const COVER_COLORS = [
  '#2f4b3a', '#8c3b2e', '#1f3a5f', '#c9a227', '#5b3a5e', '#3d6b73',
  '#b5643c', '#27272a', '#6b7a3a', '#9d4a61', '#4a5d7e', '#d4c4a8',
];

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label, icon: s.icon }));
