import { STATUS } from './bookMeta';

export default function StatusBadge({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <span className={`status-badge is-${status}`}>
      <Icon size={13} strokeWidth={2.25} aria-hidden="true" />
      {s.label}
    </span>
  );
}
