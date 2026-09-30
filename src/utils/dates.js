const DAY = 86_400_000;

/** Fecha local en formato YYYY-MM-DD. */
export function toISODate(date = new Date()) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const todayISO = () => toISODate(new Date());

function parseDate(iso) {
  if (!iso) return null;
  // Fechas "YYYY-MM-DD" se interpretan en hora local.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

export function addDays(iso, n) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(fromIso, toIso) {
  return Math.round((parseDate(toIso) - parseDate(fromIso)) / DAY);
}

/** Días restantes incluyendo el día de hoy como día jugable. */
export function daysRemaining(endIso, today = todayISO()) {
  return Math.max(0, daysBetween(today, endIso));
}

export function isChallengeOver(challenge, today = todayISO()) {
  return !!challenge && today > challenge.endDate;
}

/** ¿La fecha (ISO completo o corto) cae dentro del rango del desafío? */
export function isWithin(dateIso, startIso, endIso) {
  const d = toISODate(parseDate(dateIso));
  return d >= startIso && d <= endIso;
}

const fmtShort = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const fmtLong = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDate = (iso) => (iso ? fmtLong.format(parseDate(iso)) : '');
export const formatShortDate = (iso) => (iso ? fmtShort.format(parseDate(iso)).replace('.', '') : '');

export function formatRange(startIso, endIso) {
  return `${formatShortDate(startIso)} - ${formatShortDate(endIso)}`;
}

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function relativeTime(iso, now = new Date()) {
  const diff = (parseDate(iso) - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'ahora';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < DAY / 1000) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < (DAY / 1000) * 7) return rtf.format(Math.round(diff / (DAY / 1000)), 'day');
  return formatShortDate(iso);
}

/** Etiqueta de día para agrupar listas: "Hoy", "Ayer" o la fecha. */
export function dayLabel(iso, today = todayISO()) {
  const d = toISODate(parseDate(iso));
  if (d === today) return 'Hoy';
  if (d === addDays(today, -1)) return 'Ayer';
  return formatDate(d);
}
