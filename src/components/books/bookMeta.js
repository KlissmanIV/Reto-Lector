import { BookCheck, BookMarked, BookOpen } from 'lucide-react';

export const STATUS = {
  pending: { label: 'Pendiente', icon: BookMarked },
  reading: { label: 'Leyendo', icon: BookOpen },
  finished: { label: 'Terminado', icon: BookCheck },
};

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label, icon: s.icon }));
